import { ApiComponent, ApiEntity, ApiEntityOptions } from "yug-entity-system";
import FirebirdNativeAdapter from "../data-base/adapters/FirebirdNativeAdapter";

/** Сохранение родительской и всех дочерних сущностей */
export const saveEntities = async (entities: ApiEntityOptions[]): Promise<ApiEntityOptions[]> => {
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
export const disassembleComponent = (entities: Set<ApiEntityOptions>): Set<ApiComponent> => {
    try {
        const set = new Set<ApiComponent>();
        for (const entity of entities) {
            for (const component of entity.components) {
                component.entityId = entity.signature.id;
                set.add(component);
            }
        }
        return set;
    } catch (e) {
        throw e;
    }
}
/** Разбор и подготовка всех сущностей к сохранению */
export const disassemble = (entities: ApiEntityOptions[]): Set<ApiEntityOptions> => {
    const set = new Set<ApiEntityOptions>();
    for (const entity of entities) {
        set.add(entity);
        const children = disassemble(entity.сhildEntities)
        for (const child of children) {
            set.add(child);
        }
    }
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
            ATTRIBUTES, BINDING_TO_LIST)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING ID;`);

        const editable = await attachment.prepare(transaction, `
            UPDATE COMPONENTS C SET
                C.ID_ENTITY = ?, C.COMPONENT_NAME = ?, C.COMPONENT_DESCRIPTION = ?, C.PROPERTY_NAME = ?, C.PROPERTY_DESCRIPTION = ?,
                C.PROPERTY_VALUE = ?, C.PROPERTY_FORMULA = ?, C.PROPERTY_TYPE = ?, C.ATTRIBUTES = ?, C.BINDING_TO_LIST = ?
            WHERE C.ID = ?`);
   

        for (const component of disassembleComponents) {
            if (component.id) {
                await editable.execute(transaction, 
                    [
                        component.entityId || null, component.componentName || null, component.componentDescription || null,
                        component.propertyName || null, component.propertyDescription || null, String(component.propertyValue),
                        component.propertyFormula || null, component.propertyType || null, component.attributes || null, component.bindingToList || null,
                        component.id
                    ]);
            }else{
                const newEntry =  await savable.executeSingletonAsObject<{ID: number}>(transaction,
                    [
                        component.entityId || null, component.componentName || null, component.componentDescription || null,
                        component.propertyName || null, component.propertyDescription || null, String(component.propertyValue),
                        component.propertyFormula || null, component.propertyType || null, component.attributes || null, component.bindingToList || null
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
const writeEntityToBatabase = async (disassembleEntity: Set<ApiEntityOptions>) => {
    const db = new FirebirdNativeAdapter();
    const attachment = await db.connect();
    const transaction = await attachment.startTransaction();
    try {
        const savable = await attachment.prepare(transaction, `
                INSERT INTO ENTITIES (ID_PARENT, ID_SAMPLE, CATEGORY, NAME, NOTE, DATE_UPDATE)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                RETURNING ID;`);
        const editable = await attachment.prepare(transaction, `
            UPDATE ENTITIES E SET E.ID_PARENT = ?,
                    E.ID_SAMPLE = ?,
                    E.CATEGORY = ?,
                    E.NAME = ?,
                    E.NOTE = ?,
                    E.DATE_UPDATE = CURRENT_TIMESTAMP
                WHERE E.ID = ?`);
        for (const entity of disassembleEntity) {
            const signature = entity.signature;
            const father = findFather(entity.parentKey, disassembleEntity);
            if (father && father.signature.id) signature.parentId = father.signature.id;
            if (signature.id) {
                await editable.execute(transaction, 
                    [signature.parentId||null, signature.sampleId || null, signature.category || null, signature.name, signature.note || null, signature.id])
            }else{
                const newEntry = await savable.executeSingletonAsObject<{ID: number}>(transaction, 
                    [signature.parentId || null, signature.sampleId || null, signature.category || null, signature.name, signature.note || null])
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

const findFather = (fatherKey: string | undefined, disassembleEntity: Set<ApiEntityOptions>): ApiEntityOptions | undefined => {
    let father: ApiEntityOptions| undefined = undefined;
    if (!fatherKey) return father;
    for (const candidate of disassembleEntity) {
        if (candidate.key === fatherKey) {
            father = candidate;
            break
        }
    }
    return father;
}

export default { saveEntities }