import FirebirdNativeAdapter from "../data-base/adapters/FirebirdNativeAdapter";
import { Blob } from 'node-firebird-driver-native';
import databaseQuery from "../utils/db-query";
import { ApiEntity, ApiComponent } from "yug-entity-system-async";

/** Возвращает одну сущность, которая являеться праотцом сущности. */
export const getGrandfather = async (key: string): Promise<ApiEntity | null> => {
    try {
        const db = new FirebirdNativeAdapter();
        const result = await db.executeRequest<EntityView>(databaseQuery('find grandfather'), [key]);
        if (!result.length) return null;
        const [grandfather] =  convertEntityViewToApi(result);
        return grandfather;
    } catch (e) {
        throw e;
    }
}

export const deleteEntityToKey = async (key: string): Promise<string | null> => {
    try {
        const db = new FirebirdNativeAdapter();
        const deletedKey = await db.executeAndReturning<{ KEY: string }>(`delete from entities e where e."KEY" = ? RETURNING "KEY"`, [key]);
        return deletedKey.KEY;
    } catch (e) {
        throw e;
    }
}
export const deleteComponentsToId= async (id: number): Promise<void> => {
    try {
        const db = new FirebirdNativeAdapter();
        await db.execute(`DELETE FROM COMPONENTS C WHERE C.ENTITY_KEY = ?`, [id]);
    } catch (e) {
        throw e;
    }
}

export const deleteChildsToParentId = async (id: number): Promise<void> => {
    try {
        const db = new FirebirdNativeAdapter();
        await db.execute(`DELETE FROM ENTITIES E WHERE E.ID_PARENT = ?`, [Number(id)])
    } catch (e) {
        throw e;
    }
}

/** Получение сущности, а так же её дочерних сущностей и компонентов по ключу  */
export const getEntityToKey = async (key: string): Promise<ApiEntity[]> => {
    const db = new FirebirdNativeAdapter();
    const attachment = await db.connect();
    const transaction = await attachment.startTransaction();
    try {
        const resSet = await attachment.executeQuery(transaction, databaseQuery('get entity to key'), [key]);
        const result = await resSet.fetchAsObject<EntityView>();
        await resSet.close();

        /* Работа с БЛОБ
        const blobs = result.map(r => r.FORMULA_IMPORT);
        console.log("BLOBS", blobs.map(b => b?.isValid));
        const valoidBlob = blobs.find(b => !!b?.isValid)!;
        console.log("valoidBlob", valoidBlob);
        const blobStream = await attachment.openBlob(transaction, valoidBlob);
        const buffer = Buffer.alloc(await blobStream.length);
        await blobStream.read(buffer);
        await blobStream.close();
        console.log("Расшифрованный БЛОБ", buffer.toString());
        */
        await transaction.commit();
        return convertEntityViewToApi(result);
    } catch (e) {
        console.log(e);
        await transaction.rollback()
        throw e;
    }
}
/**
 * Конвертирование обекта представления в массив сущностей.
 * @param data EntityView[] - объект представления из БД
 * @returns массив сущностей.
 */
const convertEntityViewToApi = (data: EntityView[]): ApiEntity[] => {
    const ids = [...new Set(data.map(e => e.ID))];
    const entities: ApiEntity[] = [];
    for (const id of ids) {
        const vEnt: EntityDb | undefined = data.find(d => d.ID === id);
        if (!vEnt) continue;
        const vComps: ComponentDb[] = data.filter(d => d.ID_ENTITY === id).map(d => {
           const { 
               ID_COMPONENT: ID, ID_ENTITY, COMPONENT_NAME, 
               COMPONENT_DESCRIPTION, PROPERTY_NAME, 
               PROPERTY_DESCRIPTION, PROPERTY_FORMULA, PROPERTY_TYPE,
               PROPERTY_VALUE, ATTRIBUTES, BINDING_TO_LIST, COMPONENT_KEY: KEY, ENTITY_KEY, FORMULA_IMPORT } = d;
            return {
                ID, ID_ENTITY, COMPONENT_NAME,
                COMPONENT_DESCRIPTION, PROPERTY_NAME,
                PROPERTY_DESCRIPTION, PROPERTY_FORMULA, PROPERTY_TYPE,
                PROPERTY_VALUE, ATTRIBUTES, BINDING_TO_LIST, KEY, ENTITY_KEY, FORMULA_IMPORT
            }
        });
        entities.push(convertEntityDbToApi(vEnt, vComps))
    }
    return entities;
}

/** Сохранение родительской и всех дочерних сущностей */
export const saveEntities = async (entities: ApiEntity[]=[]): Promise<ApiEntity[]> => {
    try {
        // const fathers = entities.filter((e, i, arr )=> {
        //     if (!e.parentKey) return true;
        //     const index = arr.findIndex(f => f.key === e.parentKey);
        //     return index === -1;
        // })
        
        // if (fathers.length) {
        //     const engine = createEngine();
        
        //     const apiSamples = await getEntitySamples();
        //     engine.clearSamples();
        //     const samples = engine.loadAndReturning(apiSamples);

        //     for (const father of fathers) {
        //         const sample = samples.find(s => s.getKey() === father.key);
        //         if (sample) {
        //             const index = entities.findIndex(e => e.key === father.key);
        //             if (index >= 0) {
        //                 entities[index].id = sample.getId();
        //                 entities[index].key = sample.getKey();
        //             }
        //            // await deleteChildsToParentId(father.id);
        //            // await deleteComponentsToId(father.id);
        //         }
        //     }
        // }
        // //const disassembleEntity = disassemble(entities); - уже разобраны
        // const disassembleEntity = new Set(entities)
        // const resultEntities = await writeEntityToBatabase(disassembleEntity);
        // const disassembleComponents = disassembleComponent(resultEntities);
        // await writeComponentToBatabase(disassembleComponents);
        // return entities;
        return []
    } catch (e) {
        throw e;
    }
}
/** Подготовка копонента к сохранению. Добавление в коллекцию Set */
export const prepareComponent = (components: ApiComponent[]): Set<ApiComponent> => {
    try {
        return new Set<ApiComponent>();
    } catch (e) {
        throw e;
    }
}

/** Разбор всех комопнентов из всех сущностей, в коллеции */
export const disassembleComponent = (entities: Set<ApiEntity>): Set<ApiComponent> => {
    try {
        // const set = new Set<ApiComponent>();
        // for (const entity of entities) {
        //     for (const component of entity?.components || []) {
        //         component.entityId = entity.id;
        //         component.entityKey = entity.key;
        //         set.add(component);
        //     }
        // }
        // return set;
        return new Set();
    } catch (e) {
        throw e;
    }
}
/** Разбор и подготовка всех сущностей к сохранению */
export const disassemble = (entities: ApiEntity[]): Set<ApiEntity> => {
    const disassembleEntities = getAllChildren(<ApiEntity[]>entities);
    const set = new Set<ApiEntity>((<ApiEntity[]>disassembleEntities));
    return set;
}

const getAllChildren = (entities: ApiEntity[] = []): ApiEntity[] => {
    // const tempArr: ApiEntity[] = [];
    // for (const entity of entities) {
    //     const { id, key, category, components, dateCreation, dateUpdate, 
    //         name, note, parentId, parentKey, sampleId } = <ApiEntity>entity;
    //     const { children } = (<ApiEntity>entity);
    //     tempArr.push({ id, key, category, components, dateCreation, dateUpdate, 
    //         name, note, parentId, parentKey, sampleId});
    //     const disassembleChildren = getAllChildren(children);
    //     tempArr.push(...<ApiEntity[]>disassembleChildren);
    // }
    // return <ApiEntity[]> tempArr;
    return []
}

/** Запись компонентв в базу данных  */
const writeComponentToBatabase = async (disassembleComponents: Set<ApiComponent>) => {
    const db = new FirebirdNativeAdapter();
    const attachment = await db.connect();
    const transaction = await attachment.startTransaction();
    try {

        const savable = await attachment.prepare(transaction, `
         INSERT INTO COMPONENTS (
            ENTITY_KEY, COMPONENT_NAME, COMPONENT_DESCRIPTION, PROPERTY_NAME, 
            PROPERTY_DESCRIPTION, PROPERTY_VALUE, PROPERTY_FORMULA, PROPERTY_TYPE,
            ATTRIBUTES, BINDING_TO_LIST, KEY, ENTITY_KEY, FORMULA_IMPORT )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING ID;`);

        const editable = await attachment.prepare(transaction, `
            UPDATE COMPONENTS C SET
                C.ID_ENTITY = ?, C.COMPONENT_NAME = ?, C.COMPONENT_DESCRIPTION = ?, C.PROPERTY_NAME = ?, C.PROPERTY_DESCRIPTION = ?,
                C.PROPERTY_VALUE = ?, C.PROPERTY_FORMULA = ?, C.PROPERTY_TYPE = ?, C.ATTRIBUTES = ?, C.BINDING_TO_LIST = ?, C.KEY = ?, C.ENTITY_KEY = ?, C.FORMULA_IMPORT = ?  
            WHERE C.ID = ?`);
   

        // for (const component of disassembleComponents) {
        //     if (component.id) {
        //         await editable.execute(transaction, 
        //             [
        //                 component.entityId || null, component.componentName || null, component.componentDescription || null,
        //                 component.propertyName || null, component.propertyDescription || null, String(component.propertyValue),
        //                 component.propertyFormula || null, component.propertyType || null, component.attributes || null, component.bindingToList || false,
        //                 component.key || null, component.entityKey || null, 
        //                 component.formulaImport ? Buffer.alloc(component.formulaImport?.length || 0, component.formulaImport) : null,
        //                 component.id
        //             ]);
        //     }else{
        //         const newEntry =  await savable.executeSingletonAsObject<{ID: number}>(transaction,
        //             [
        //                 component.entityId || null, component.componentName || null, component.componentDescription || null,
        //                 component.propertyName || null, component.propertyDescription || null, String(component.propertyValue),
        //                 component.propertyFormula || null, component.propertyType || null, component.attributes || null, component.bindingToList || false,
        //                 component.key || null, component.entityKey || null, 
        //                 component.formulaImport ? Buffer.alloc(component.formulaImport?.length || 0, component.formulaImport) : null,
        //             ]);
        //         component.id = newEntry.ID;
        //     }
        // }
        await savable.dispose();
        await editable.dispose();
        await transaction.commit();

        return disassembleComponents;
    } catch (e) {
        console.log(e);
        await transaction.rollback()
        throw e;
    }
}
/** Запись сущностей в базу даных */
const writeEntityToBatabase = async (disassembleEntity: Set<ApiEntity>) => {
    const db = new FirebirdNativeAdapter();
    const attachment = await db.connect();
    const transaction = await attachment.startTransaction();
    try {
        const savable = await attachment.prepare(transaction, `
                INSERT INTO ENTITIES (ID_PARENT, ID_SAMPLE, CATEGORY, NAME, NOTE, KEY, PARENT_KEY, DATE_UPDATE)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                RETURNING ID;`);
        const editable = await attachment.prepare(transaction, `
            UPDATE ENTITIES E SET E.ID_PARENT = ?,
                    E.SAMPLE_KEY = ?,
                    E.CATEGORY = ?,
                    E.NAME = ?,
                    E.NOTE = ?,
                    E.KEY = ?,
                    E.PARENT_KEY = ?,
                    E.DATE_UPDATE = CURRENT_TIMESTAMP
                WHERE E.ID = ?`);
        
        // for (const entity of disassembleEntity) {
        //     const signature = entity;
        //     const father = findFather(entity.parentKey, disassembleEntity);
        //     if (father && father.id) signature.parentId = father.id;
        //     if (signature.id) {
        //         await editable.execute(transaction, 
        //             [signature.parentId || null, signature.sampleId || null, signature.category || null, signature.name, signature.note || null, signature.key || null, signature.parentKey || null, signature.id])
        //     }else{
        //         const newEntry = await savable.executeSingletonAsObject<{ID: number}>(transaction, 
        //             [signature.parentId || null, signature.sampleId || null, signature.category || null, signature.name, signature.note || null, signature.key || null, signature.parentKey || null])
        //         signature.id = newEntry.ID;
        //     }
        // }
        await savable.dispose();
        await editable.dispose();
        await transaction.commit();
        return disassembleEntity;
    } catch (e) {
        await transaction.rollback()
        throw e;
    }
}

const findFather = (fatherKey: string | undefined, disassembleEntity: Set<ApiEntity>): ApiEntity | undefined => {
    let father: ApiEntity| undefined = undefined;
    if (!fatherKey) return father;
    for (const candidate of disassembleEntity) {
        if (candidate.key === fatherKey) {
            father = candidate;
            break;
        }
    }
    return father;
}

export const getEntitySamples = async (): Promise<ApiEntity[]> => {
    const db = new FirebirdNativeAdapter();
    try {
        const dbEntities = await db.executeRequest<EntityDb>(`SELECT * FROM GET_ENTITY_SAMPLES`, []);
        //Тут блоб уже превращен в строку , в самой процедуре GET_COMPS_TO_ID_ENTITY
        const dbComponents = await db.executeRequest<ComponentDb>(`
            EXECUTE BLOCK
            RETURNS (
                ID INTEGER,
                ID_ENTITY INTEGER,
                COMPONENT_NAME VARCHAR(512),
                COMPONENT_DESCRIPTION VARCHAR(512),
                PROPERTY_NAME VARCHAR(512),
                PROPERTY_DESCRIPTION VARCHAR(512),
                PROPERTY_VALUE VARCHAR(512),
                PROPERTY_FORMULA VARCHAR(8000),
                PROPERTY_TYPE VARCHAR(512),
                ATTRIBUTES VARCHAR(512),
                BINDING_TO_LIST BOOLEAN,
                "KEY" VARCHAR(512),
                ENTITY_KEY VARCHAR(512),
                FORMULA_IMPORT VARCHAR(8000)
                )
            AS
            DECLARE VARIABLE CURRENT_ENTITY_ID INTEGER;
            BEGIN
            FOR SELECT ID FROM GET_ENTITY_SAMPLES
                INTO :CURRENT_ENTITY_ID
            DO
            BEGIN
                FOR SELECT *
                    FROM GET_COMPS_TO_ID_ENTITY(:CURRENT_ENTITY_ID)
                    INTO :ID, :ID_ENTITY, :COMPONENT_NAME, :COMPONENT_DESCRIPTION, :PROPERTY_NAME, :PROPERTY_DESCRIPTION,
                        :PROPERTY_VALUE, :PROPERTY_FORMULA, :PROPERTY_TYPE, :ATTRIBUTES, :BINDING_TO_LIST, :"KEY", :ENTITY_KEY, :FORMULA_IMPORT
                DO
                SUSPEND;
            END
            END`, []);

        const entities = dbEntities.map(e => convertEntityDbToApi(e, dbComponents));
        return entities;
    } catch (e) {
        throw e;
    }
}
const convertComponentsDbToApi = (data: ComponentDb): ApiComponent => {
    return {
        id: data.ID,
        key: data.KEY,
        entityKey: data.ENTITY_KEY || undefined,
        componentName: data.COMPONENT_NAME,
        componentDescription: data.COMPONENT_DESCRIPTION,
        propertyName: data.PROPERTY_NAME,
        propertyDescription: data.PROPERTY_DESCRIPTION,
        propertyValue: data.PROPERTY_VALUE || 0,
        propertyFormula: data.PROPERTY_FORMULA || undefined,
        propertyType: (data.PROPERTY_TYPE as any),
        attributes: data.ATTRIBUTES || undefined,
        bindingToList: data.BINDING_TO_LIST || false,
        index: 0,
        indicators:{}
    }
}

const convertEntityDbToApi = (data: EntityDb, comps: ComponentDb[]): ApiEntity => {
    const components = comps.filter(c => c.ID_ENTITY === data.ID).map(c => convertComponentsDbToApi(c));
    return {
        id: data.ID,
        category: data.CATEGORY || undefined,
        name: data.NAME || "",
        note: data.NOTE || undefined,
        key: data.KEY,
        parentKey: data.PARENT_KEY||undefined,
        components: components,
        index: 0,
        indicators: {},
    }
}

interface EntityDb {
  ID: number;
  ID_PARENT: number | null;
  ID_SAMPLE: number | null;
  CATEGORY: string | null;
  NAME: string | null;
  NOTE: string | null;
  DATE_CREATION: Date;
  DATE_UPDATE: Date;
  KEY: string;
  PARENT_KEY: string;
}

interface ComponentDb {
    ID: number;
    ID_ENTITY: number | null;
    COMPONENT_NAME        :string;
    COMPONENT_DESCRIPTION: string;
    PROPERTY_NAME: string;
    PROPERTY_DESCRIPTION: string;
    PROPERTY_VALUE: string | null;
    PROPERTY_FORMULA: string | null;
    FORMULA_IMPORT: string | null;
    PROPERTY_TYPE: string;
    ATTRIBUTES: string | null;
    BINDING_TO_LIST  : boolean
    KEY: string;
    ENTITY_KEY: string | null;
}

interface EntityView {
    ID: number;
    ID_PARENT: number;
    ID_SAMPLE: number;
    CATEGORY: string;
    NAME: string;
    NOTE: string;
    DATE_CREATION: Date;
    DATE_UPDATE: Date;
    KEY: string;
    PARENT_KEY: string;
    ID_COMPONENT: number;
    ID_ENTITY: number;
    COMPONENT_NAME: string;
    COMPONENT_DESCRIPTION: string;
    PROPERTY_NAME: string;
    PROPERTY_DESCRIPTION: string;
    PROPERTY_VALUE: string;
    PROPERTY_FORMULA: string;
    PROPERTY_TYPE: string;
    ATTRIBUTES: string;
    BINDING_TO_LIST: boolean;
    COMPONENT_KEY: string;
    ENTITY_KEY: string;
    FORMULA_IMPORT: string | null;
}

export default { saveEntities, getEntitySamples, deleteEntityToKey}