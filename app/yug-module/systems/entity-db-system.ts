import { ApiComponent, ApiEntity } from "yug-entity-system";
import { ApiOptionsEntity } from "yug-entity-system/dist/types/entity-types";
import FirebirdNativeAdapter from "../data-base/adapters/FirebirdNativeAdapter";


export const deleteEntityToKey = async (key: string): Promise<string | null> => {
    try {
        const db = new FirebirdNativeAdapter();
        const deletedKey = await db.executeAndReturning<{ KEY: string }>(`delete from entities e where e."KEY" = ? RETURNING "KEY"`, [key]);
        return deletedKey.KEY;
    } catch (e) {
        throw e;
    }
}

/** Сохранение родительской и всех дочерних сущностей */
export const saveEntities = async (entities: ApiEntity[]): Promise<ApiEntity[]> => {
    try {
        const disassembleEntity = disassemble(entities);
        const resultEntities = await writeEntityToBatabase(disassembleEntity);
        const disassembleComponents = disassembleComponent(resultEntities);
        await writeComponentToBatabase(disassembleComponents);
        return entities;
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
        const set = new Set<ApiComponent>();
        for (const entity of entities) {
            for (const component of entity?.components || []) {
                component.entityId = entity.id;
                component.entityKey = entity.key;
                set.add(component);
            }
        }
        return set;
    } catch (e) {
        throw e;
    }
}
/** Разбор и подготовка всех сущностей к сохранению */
export const disassemble = (entities: ApiEntity[]): Set<ApiEntity> => {
    const set = new Set<ApiEntity>();
    for (const entity of entities) { set.add(entity);}
    return set;
}

/** Запись компонентв в базу данных  */
const writeComponentToBatabase = async (disassembleComponents: Set<ApiComponent>) => {
    const db = new FirebirdNativeAdapter();
    const attachment = await db.connect();
    const transaction = await attachment.startTransaction();
    try {
        const savable = await attachment.prepare(transaction, `
         INSERT INTO COMPONENTS (
            ID_ENTITY, COMPONENT_NAME, COMPONENT_DESCRIPTION, PROPERTY_NAME, 
            PROPERTY_DESCRIPTION, PROPERTY_VALUE, PROPERTY_FORMULA, PROPERTY_TYPE,
            ATTRIBUTES, BINDING_TO_LIST, KEY, ENTITY_KEY )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING ID;`);

        const editable = await attachment.prepare(transaction, `
            UPDATE COMPONENTS C SET
                C.ID_ENTITY = ?, C.COMPONENT_NAME = ?, C.COMPONENT_DESCRIPTION = ?, C.PROPERTY_NAME = ?, C.PROPERTY_DESCRIPTION = ?,
                C.PROPERTY_VALUE = ?, C.PROPERTY_FORMULA = ?, C.PROPERTY_TYPE = ?, C.ATTRIBUTES = ?, C.BINDING_TO_LIST = ?, C.KEY = ?, C.ENTITY_KEY = ?  
            WHERE C.ID = ?`);
   

        for (const component of disassembleComponents) {
            if (component.id) {
                await editable.execute(transaction, 
                    [
                        component.entityId || null, component.componentName || null, component.componentDescription || null,
                        component.propertyName || null, component.propertyDescription || null, String(component.propertyValue),
                        component.propertyFormula || null, component.propertyType || null, component.attributes || null, component.bindingToList || false,
                        component.key || null, component.entityKey || null,
                        component.id
                    ]);
            }else{
                const newEntry =  await savable.executeSingletonAsObject<{ID: number}>(transaction,
                    [
                        component.entityId || null, component.componentName || null, component.componentDescription || null,
                        component.propertyName || null, component.propertyDescription || null, String(component.propertyValue),
                        component.propertyFormula || null, component.propertyType || null, component.attributes || null, component.bindingToList || false,
                        component.key || null, component.entityKey || null
                    ]);
                component.id = newEntry.ID;
            }
        }
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
                    E.ID_SAMPLE = ?,
                    E.CATEGORY = ?,
                    E.NAME = ?,
                    E.NOTE = ?,
                    E.KEY = ?,
                    E.PARENT_KEY = ?,
                    E.DATE_UPDATE = CURRENT_TIMESTAMP
                WHERE E.ID = ?`);
        for (const entity of disassembleEntity) {
            const signature = entity;
            const father = findFather(entity.parentKey, disassembleEntity);
            if (father && father.id) signature.parentId = father.id;
            if (signature.id) {
                await editable.execute(transaction, 
                    [signature.parentId || null, signature.sampleId || null, signature.category || null, signature.name, signature.note || null, signature.key || null, signature.parentKey || null, signature.id])
            }else{
                const newEntry = await savable.executeSingletonAsObject<{ID: number}>(transaction, 
                    [signature.parentId || null, signature.sampleId || null, signature.category || null, signature.name, signature.note || null, signature.key || null, signature.parentKey || null])
                signature.id = newEntry.ID;
            }
        }
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
                PROPERTY_FORMULA VARCHAR(2048),
                PROPERTY_TYPE VARCHAR(512),
                ATTRIBUTES VARCHAR(512),
                BINDING_TO_LIST BOOLEAN,
                "KEY" VARCHAR(512),
                ENTITY_KEY VARCHAR(512))
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
                        :PROPERTY_VALUE, :PROPERTY_FORMULA, :PROPERTY_TYPE, :ATTRIBUTES, :BINDING_TO_LIST, :"KEY", :ENTITY_KEY
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
        entityId: data.ID_ENTITY || undefined,
        entityKey: data.ENTITY_KEY || undefined,
        componentName: data.COMPONENT_NAME,
        componentDescription: data.COMPONENT_DESCRIPTION,
        propertyName: data.PROPERTY_NAME,
        propertyDescription: data.PROPERTY_DESCRIPTION,
        propertyValue: data.PROPERTY_VALUE || 0,
        propertyFormula: data.PROPERTY_FORMULA || undefined,
        propertyType: (data.PROPERTY_TYPE as any),
        attributes: data.ATTRIBUTES || undefined,
        bindingToList: data.BINDING_TO_LIST || false
    }
}


const convertEntityDbToApi = (data: EntityDb, comps: ComponentDb[]): ApiEntity => {
    const components = comps.filter(c => c.ID_ENTITY === data.ID).map(c => convertComponentsDbToApi(c));
    return {
        id: data.ID,
        typeId: undefined,
        category: data.CATEGORY || undefined,
        parentId: data.ID_PARENT || undefined,
        sampleId: data.ID_SAMPLE || undefined,
        name: data.NAME || undefined,
        note: data.NOTE || undefined,
        dateCreation: data.DATE_CREATION,
        dateUpdate: data.DATE_UPDATE,
        key: data.KEY,
        parentKey: data.PARENT_KEY,
        components: components
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
    PROPERTY_TYPE: string;
    ATTRIBUTES: string | null;
    BINDING_TO_LIST        : boolean
    KEY: string;
    ENTITY_KEY: string | null;
}



export default { saveEntities, getEntitySamples}