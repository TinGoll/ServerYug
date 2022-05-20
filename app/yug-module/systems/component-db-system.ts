import createEngine, { ApiEntity, Engine, Entity, ApiComponent } from "yug-entity-system";
import FirebirdAdapter from "../data-base/adapters/FirebirdAdapter";
import FirebirdNativeAdapter from "../data-base/adapters/FirebirdNativeAdapter";
import { DbComponent } from "../types/components/component-types";
import databaseQuery from "../utils/db-query";


export const updateComponents = async (components: ApiComponent[]): Promise<ApiComponent[]> => {
    const db = new FirebirdNativeAdapter();
    const attachment = await db.connect();
    const transaction = await attachment.startTransaction();
    try {
        const editable = await attachment.prepare(transaction, `
            UPDATE COMPONENTS C SET
                C.ID_ENTITY = ?, C.COMPONENT_NAME = ?, C.COMPONENT_DESCRIPTION = ?, C.PROPERTY_NAME = ?, C.PROPERTY_DESCRIPTION = ?,
                C.PROPERTY_VALUE = ?, C.PROPERTY_FORMULA = ?, C.PROPERTY_TYPE = ?, C.ATTRIBUTES = ?, C.BINDING_TO_LIST = ?, C.KEY = ?, C.ENTITY_KEY = ?, C.FORMULA_IMPORT = ? 
            WHERE C.ID = ?`);
        for (const component of components) {
            await editable.execute(transaction,
                [
                    component.entityId || null, component.componentName || null, component.componentDescription || null,
                    component.propertyName || null, component.propertyDescription || null, String(component.propertyValue),
                    component.propertyFormula || null, component.propertyType || null, component.attributes || null, component.bindingToList || false,
                    component.key || null, component.entityKey || null, 
                    component.formulaImport ? Buffer.alloc(component.formulaImport?.length||0, component.formulaImport) : null,
                    component.id
                ]);
        }
        await editable.dispose();
        await transaction.commit();
        return components;
    } catch (e) {
        await transaction.rollback();
        throw e;
    }
}

export const insertComponents = async (components: ApiComponent[]): Promise<ApiComponent[]> => {
    const db = new FirebirdNativeAdapter();
    const attachment = await db.connect();
    const transaction = await attachment.startTransaction();
    try {
        const insertable = await attachment.prepare(transaction, 
        `INSERT INTO COMPONENTS (
            ID_ENTITY, COMPONENT_NAME, COMPONENT_DESCRIPTION, PROPERTY_NAME, 
            PROPERTY_DESCRIPTION, PROPERTY_VALUE, PROPERTY_FORMULA, PROPERTY_TYPE,
            ATTRIBUTES, BINDING_TO_LIST, KEY, ENTITY_KEY, FORMULA_IMPORT)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING ID;`);
        for (const component of components) {
            const newEntry = await insertable.executeSingletonAsObject<{ ID: number }>(transaction,
                [
                    component.entityId || null, component.componentName || null, component.componentDescription || null,
                    component.propertyName || null, component.propertyDescription || null, String(component.propertyValue),
                    component.propertyFormula || null, component.propertyType || null, component.attributes || null, component.bindingToList || false,
                    component.key || null, component.entityKey || null, 
                    component.formulaImport ? Buffer.alloc(component.formulaImport?.length || 0, component.formulaImport) : null,
                ]);
            component.id = newEntry.ID;
        }
        await insertable.dispose();
        await transaction.commit();
        return components;
    } catch (e) {
        await transaction.rollback();
        throw e;
    }
}

export const saveComponents = async  (components: ApiComponent[]): Promise<ApiComponent[]> => {
    //******************************************************************* */
    //************************* Проверено ******************************* */
    //******************************************************************* */

    const db = new FirebirdNativeAdapter();
    const attachment = await db.connect();
    const transaction = await attachment.startTransaction();
    try {
        const sampleComponents = components.filter(c => !c.entityKey);   

        if (sampleComponents.length) {
            const samples = await getSampleComponents();
            sampleComponents.forEach(c => {
                const index = samples.findIndex(s => 
                    s.componentName === c.componentName &&
                    s.propertyName === c.propertyName
                );
                if (index >= 0) {
                    c.id = samples[index].id;
                    c.key = samples[index].key;
                }
            })
        }

        if (sampleComponents.length) console.log('SAVE COMPONENTS', `Измененено ${sampleComponents.length} комопнент(ов)`);
        
        const savable = await attachment.prepare(transaction, `
         INSERT INTO COMPONENTS (
            ID_ENTITY, COMPONENT_NAME, COMPONENT_DESCRIPTION, PROPERTY_NAME, 
            PROPERTY_DESCRIPTION, PROPERTY_VALUE, PROPERTY_FORMULA, PROPERTY_TYPE,
            ATTRIBUTES, BINDING_TO_LIST, KEY, ENTITY_KEY, FORMULA_IMPORT)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING ID;`);

        const editable = await attachment.prepare(transaction, `
            UPDATE COMPONENTS C SET
                C.ID_ENTITY = ?, C.COMPONENT_NAME = ?, C.COMPONENT_DESCRIPTION = ?, C.PROPERTY_NAME = ?, C.PROPERTY_DESCRIPTION = ?,
                C.PROPERTY_VALUE = ?, C.PROPERTY_FORMULA = ?, C.PROPERTY_TYPE = ?, C.ATTRIBUTES = ?, C.BINDING_TO_LIST = ?, C.KEY = ?, C.ENTITY_KEY = ?, C.FORMULA_IMPORT = ? 
            WHERE C.ID = ?`);


        for (const component of components) {
            if (component.id) {
                await editable.execute(transaction,
                    [
                        component.entityId || null, component.componentName || null, component.componentDescription || null,
                        component.propertyName || null, component.propertyDescription || null, String(component.propertyValue),
                        component.propertyFormula || null, component.propertyType || null, component.attributes || null, component.bindingToList || false,
                        component.key || null, component.entityKey || null,
                        component.formulaImport ? Buffer.alloc(component.formulaImport?.length || 0, component.formulaImport) : null,
                        component.id
                    ]);
            } else {
                const newEntry = await savable.executeSingletonAsObject<{ ID: number }>(transaction,
                    [
                        component.entityId || null, component.componentName || null, component.componentDescription || null,
                        component.propertyName || null, component.propertyDescription || null, String(component.propertyValue),
                        component.propertyFormula || null, component.propertyType || null, component.attributes || null, component.bindingToList || false,
                        component.key || null, component.entityKey || null, 
                        component.formulaImport ? Buffer.alloc(component.formulaImport?.length || 0, component.formulaImport) : null,
                    ]);
                component.id = newEntry.ID;
            }
        }

        await savable.dispose();
        await editable.dispose();
        await transaction.commit();
        return components;
    } catch (e) {
        await transaction.rollback();
        throw e;
    }
}


export const deleteComponentToKey = async (key: string):Promise<string | null> => {
    const db = new FirebirdNativeAdapter();
    const deletedKey = await db.executeAndReturning<{ KEY: string | null }>(`DELETE FROM COMPONENTS E WHERE E."KEY" = ? RETURNING "KEY"`, [key]);
    return deletedKey.KEY;
}


export const getSampleComponents = async (): Promise<ApiComponent[]> => {
    const db = new FirebirdAdapter();
    const result = await db.executeRequest<DbComponent>(`SELECT * FROM COMPONENTS C WHERE C.ID_ENTITY IS NULL`);
    return convertDbDataToObject(result);

}

export const getSapmpleComponentToName = async (name: string): Promise<ApiComponent[]> => {
    const db = new FirebirdAdapter();
    const result = await db.executeRequest<DbComponent>(`SELECT * FROM COMPONENTS C WHERE C.ID_ENTITY IS NULL AND C.COMPONENT_NAME = ?`, [name]);
    return convertDbDataToObject(result);
}

export const getPropertyToName = async (
  componentName: string,
  propertyName: string
): Promise<ApiComponent | null> => {
  const db = new FirebirdAdapter();
  const result = await db.executeRequest<DbComponent>(
    `SELECT * FROM COMPONENTS
    C WHERE C.ID_ENTITY IS NULL
    AND C.COMPONENT_NAME = ?
    AND C.PROPERTY_NAME = ?`,
    [componentName, propertyName]
  );
  if(result?.length) return null;
   const [property] = convertDbDataToObject(result);
   return property || null;
};

const convertDbDataToObject = (data: DbComponent[]): ApiComponent[] => {
    try {
        return data.map(d => {
            const component: ApiComponent = {
                id: d.ID || undefined,
                entityId: d.ID_ENTITY || undefined,
                componentName: d.COMPONENT_NAME,
                componentDescription: d.COMPONENT_DESCRIPTION,
                propertyName: d.PROPERTY_NAME,
                propertyDescription: d.PROPERTY_DESCRIPTION,
                propertyValue: d.PROPERTY_VALUE,
                propertyFormula: d.PROPERTY_FORMULA || undefined,
                propertyType: d.PROPERTY_TYPE as 'string' | 'number' | 'date',
                attributes: d.ATTRIBUTES || undefined,
                bindingToList: d.BINDING_TO_LIST || undefined,
                key: d.KEY,
                entityKey: d.ENTITY_KEY || undefined
            }
            return component;
        })
    } catch (e) {
        throw e;
    }
}