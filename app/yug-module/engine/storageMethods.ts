import { ApiComponent, ApiEntity, PropertyType, PropertyValue } from "yug-entity-system-async"
import engine from ".";
import FirebirdNativeAdapter from "../data-base/adapters/FirebirdNativeAdapter";


export const insertEntities = async (entities: ApiEntity[]): Promise<ApiEntity[]> => {
    const db = new FirebirdNativeAdapter();
    const attachment = await db.connect();
    const transaction = await attachment.startTransaction();
    try {
        const prepare = await attachment.prepare(transaction, `
            INSERT INTO ENTITIES ("KEY", NAME, NOTE, "INDEX", "TYPE", CATEGORY, PARENT_KEY, SAMPLE_KEY)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING ID,DATE_CREATION, DATE_UPDATE`);
        for (const item of entities) {
            const entry = await prepare
                .executeSingletonAsObject<{ ID: number, DATE_CREATION: Date, DATE_UPDATE: Date}>(transaction, 
                    [item.key, item.name || null, item.note || null, item.index || 0, 
                        item.type || null, item.category || null, item.parentKey || null, item.sampleKey||null])
            item.id = entry.ID;
        }
        await prepare.dispose()
        await transaction.commit();
        return entities;
    } catch (e) {
        await transaction.rollback()
        throw e;
    }
}

export const insertComponents = async (components: ApiComponent[]): Promise<ApiComponent[]> => {
    const db = new FirebirdNativeAdapter();
    const attachment = await db.connect();
    const transaction = await attachment.startTransaction();
    try {
        const prepare = await attachment.prepare(transaction, `
            INSERT INTO components ("KEY", ENTITY_KEY, SAMPLE_KEY, "INDEX", COMPONENT_NAME, PROPERTY_NAME, COMPONENT_DESCRIPTION,
            PROPERTY_DESCRIPTION, PROPERTY_VALUE, PROPERTY_FORMULA, PROPERTY_TYPE, ATTRIBUTES, BINDING_TO_LIST)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING ID`);
        for (const item of components) {
            const entry = await prepare
                .executeSingletonAsObject<{ ID: number, }>(transaction, 
                    [item.key, item.entityKey || null, item.sampleKey || null, item.index || 0, item.componentName || null, item.propertyName||null,
                        item.componentDescription || null, item.propertyDescription || null,  String(item.propertyValue) || null, item.propertyFormula||null, 
                        item.propertyType || null, item.attributes || null, String(!!item.bindingToList),]);
            item.id = entry.ID;
        }
        await prepare.dispose()
        await transaction.commit();
        return components;
    } catch (e) {
        await transaction.rollback()
        throw e;
    }
}

export const loadingEntity = async (key: string): Promise<ApiEntity[]> => {
    const db = new FirebirdNativeAdapter();
    const attachment = await db.connect();
    const transaction = await attachment.startTransaction();
    try {
        console.log('\x1b[33m%s\x1b[0m',"LOADING", key);

        //console.log(key, engine.has(key), engine.entries());
        // Запрос в базу данных, на получение перечная сущностей. Запрашивается требуемая сущность и все ее зависимости.
        const recordSet = await attachment.executeQuery(transaction, 
            `WITH RECURSIVE ENTITY
                AS (SELECT * FROM ENTITIES WHERE ENTITIES."KEY" = GET_OVER_KEY(?)
                    UNION ALL
                    SELECT * FROM ENTITIES E
                    INNER JOIN ENTITY ON (E.PARENT_KEY = ENTITY."KEY"))
                SELECT ENT.*,
                    CMP.ID AS ID_COMPONENT, CMP."KEY" AS COMPONENT_KEY,
                    CMP.SAMPLE_KEY AS COMPONENT_SAMPLE_KEY, CMP.ENTITY_KEY,
                    CMP."INDEX" AS COMPONENT_INDEX, CMP.COMPONENT_NAME,
                    CMP.PROPERTY_NAME, CMP.COMPONENT_DESCRIPTION, CMP.PROPERTY_DESCRIPTION,
                    CMP.PROPERTY_VALUE, CMP.PROPERTY_FORMULA,
                    CMP.PROPERTY_TYPE, CMP.ATTRIBUTES, CMP.BINDING_TO_LIST
                FROM ENTITY ENT
                LEFT JOIN COMPONENTS CMP ON (CMP.ENTITY_KEY = ENT."KEY")
                ORDER BY ENT.ID, CMP.ID`, [key]);
        const result = await recordSet.fetchAsObject<EntityStorge>();
        await recordSet.close()
        await transaction.commit();
        return entityConverter(result);
    } catch (e) {
        await transaction.rollback()
        throw e;
    }

}

export const loadingComponents = async (): Promise<ApiComponent[]> => {
    return [];
}

const createCondition = (where?: { id?: Array<number>, keys?: Array<string>, categories?: Array<string>, }, sample?: boolean): string => {
    let condition = "";
    const conditions: string[] = []
    if (sample) {
        conditions.push(`CONDITION.SAMPLE_KEY is null`)
    } 
    if (where?.id && where?.id?.length) {
        conditions.push(`CONDITION.ID IN (${where?.id.join(", ")})`)
    }
    if (where?.keys && where?.keys?.length) {
        conditions.push(`CONDITION."KEY" IN (${where?.keys.join(", ")})`)
    }
    if (where?.categories && where?.categories?.length) {
        conditions.push(`CONDITION.CATEGORY IN (${where?.categories.join(", ")})`)
    }
    if (conditions.length) {
        condition = `and (${conditions.join("\nand ")})`
    }
    return condition;
}

export const loadingEntities = async ({ where, sample }: { where?: { id?: Array<number>, keys?: Array<string>, categories?: Array<string>, }, sample?: boolean }): Promise<ApiEntity[]> => {
    const db = new FirebirdNativeAdapter();
    const attachment = await db.connect();
    const transaction = await attachment.startTransaction();
    try {
        const recordSet = await attachment.executeQuery(transaction,
            `WITH RECURSIVE ENTITY
                AS (SELECT * FROM ENTITIES  WHERE  EXISTS (
                select CONDITION."KEY"
                from ENTITIES CONDITION where
                    get_over_key(CONDITION."KEY") = ENTITIES."KEY" 
                    ${createCondition(where, sample)})
                UNION ALL
                SELECT * FROM ENTITIES E
                INNER JOIN ENTITY ON (E.PARENT_KEY = ENTITY."KEY"))
                SELECT ENT.*,
                    CMP.ID AS ID_COMPONENT, CMP."KEY" AS COMPONENT_KEY,
                    CMP.SAMPLE_KEY AS COMPONENT_SAMPLE_KEY, CMP.ENTITY_KEY,
                    CMP."INDEX" AS COMPONENT_INDEX, CMP.COMPONENT_NAME,
                    CMP.PROPERTY_NAME, CMP.COMPONENT_DESCRIPTION, CMP.PROPERTY_DESCRIPTION,
                    CMP.PROPERTY_VALUE, CMP.PROPERTY_FORMULA,
                    CMP.PROPERTY_TYPE, CMP.ATTRIBUTES, CMP.BINDING_TO_LIST
                FROM ENTITY ENT
                LEFT JOIN COMPONENTS CMP ON (CMP.ENTITY_KEY = ENT."KEY")
                ORDER BY ENT.ID, CMP.ID`, []);
        const result = await recordSet.fetchAsObject<EntityStorge>();
        await recordSet.close()
        await transaction.commit();
        return entityConverter(result);
    } catch (e) {
        await transaction.rollback()
        throw e;
    }
}

export const loadingEntityLists = async ({
  componentNames,
  notes,
  categories,
  names,
  sample,
  infertility = true,
}: {
  categories?: string[];
  names?: string[];
  notes?: string[];
  componentNames?: string[];
  sample?: boolean;
  infertility?: boolean;
}): Promise<ApiEntity[]> => {
  const db = new FirebirdNativeAdapter();
  const attachment = await db.connect();
  const transaction = await attachment.startTransaction();
  try {
    const queryArray: string[] = [];
    let condition = ``;

    if (
      componentNames &&
      Array.isArray(componentNames) &&
      componentNames.length
    ) {
        const componentNamesQuery = `CMP.COMPONENT_NAME IN (${componentNames
        .map((q) => "'" + q + "'")
        .join(", ")})`;
      queryArray.push(componentNamesQuery);
    }

    if (notes && Array.isArray(notes) && notes.length) {
      const notesQuery = `ENT.NOTE IN (${notes
        .map((q) => "'" + q + "'")
        .join(", ")})`;
      queryArray.push(notesQuery);
    }

    if (categories && Array.isArray(categories) && categories.length) {
      const categoriesQuery = `ENT.CATEGORY IN (${categories
        .map((q) => "'" + q + "'")
        .join(", ")})`;
      queryArray.push(categoriesQuery);
    }

    if (names && Array.isArray(names) && names.length) {
      const namesQuery = `ENT.NAME IN (${names
        .map((q) => "'" + q + "'")
        .join(", ")})`;
      queryArray.push(namesQuery);
    }

    if (sample) {
      queryArray.push(`ENT.SAMPLE_KEY IS NOT NULL`);
    }

    if (queryArray.length) {
      condition = queryArray.join(`\nAND `);
    }

    const query = `
         SELECT ENT.*,  
             CMP.ID AS ID_COMPONENT, CMP."KEY" AS COMPONENT_KEY, CMP.SAMPLE_KEY AS COMPONENT_SAMPLE_KEY, CMP.ENTITY_KEY,
             CMP."INDEX" AS COMPONENT_INDEX, CMP.COMPONENT_NAME, CMP.PROPERTY_NAME, CMP.COMPONENT_DESCRIPTION, CMP.PROPERTY_DESCRIPTION,
             CMP.PROPERTY_VALUE, CMP.PROPERTY_FORMULA, CMP.PROPERTY_TYPE, CMP.ATTRIBUTES, CMP.BINDING_TO_LIST FROM ENTITIES ENT
         LEFT JOIN COMPONENTS CMP ON (CMP.ENTITY_KEY = ENT."KEY")
            ${condition === "" ? "" : "WHERE"}
            ${condition}
         `;

      console.log(query);
    
    const recordSet = await attachment.executeQuery(transaction, query, []);
    const result = await recordSet.fetchAsObject<EntityStorge>();
    await recordSet.close();
    await transaction.commit();
    return entityConverter(result);
  } catch (e) {
    await transaction.rollback();
    throw e;
  }
};

export const loadComponents = async (params: { sample?: boolean }): Promise<ApiComponent[]> => {
    const db = new FirebirdNativeAdapter();
    // Реализовать фильтр по компонентам в случае необходимости.
    const result = await db.executeRequest<ComponentStorge>(`SELECT * FROM COMPONENTS C WHERE C.ENTITY_KEY IS NULL`);
    const res = result.map(data => {
        const cmp: ApiComponent = {
            id: data.ID || 0,
            key: data.KEY || "",
            index: data.INDEX || 0,
            sampleKey: data.SAMPLE_KEY || undefined,
            entityKey: data.ENTITY_KEY || undefined,
            componentName: data.COMPONENT_NAME || "",
            componentDescription: data.COMPONENT_DESCRIPTION || "",
            propertyName: data.PROPERTY_NAME || "",
            propertyDescription: data.PROPERTY_DESCRIPTION || "",
            propertyValue: data.PROPERTY_VALUE || "",
            propertyType: (<PropertyType>data.PROPERTY_TYPE) || "string",
            propertyFormula: data.PROPERTY_FORMULA || undefined,
            attributes: data.ATTRIBUTES || undefined,
            bindingToList: data.BINDING_TO_LIST || false,
            indicators: {},
        }
        return cmp;
    })
    return res;
}

export const deleteEntities = async (keys: string[]): Promise<string[]> => {
    if (!keys.length) return keys;
    const db = new FirebirdNativeAdapter();
    const attachment = await db.connect();
    const transaction = await attachment.startTransaction();
    try {
        const prepare = await attachment.prepare(transaction, 
            `DELETE FROM ENTITIES E WHERE E."KEY" IN (${keys.map(k => "?").join(",")})`);
        await prepare.execute(transaction, [...keys]);
        await prepare.dispose();
        transaction.commit();
        return keys;
    } catch (e) {
        await transaction.rollback()
        throw e;
    }
}

export const deleteComponents = async (keys: string[]): Promise<string[]> => {
    if (!keys.length) return keys;
    const db = new FirebirdNativeAdapter();
    const attachment = await db.connect();
    const transaction = await attachment.startTransaction();
    try {
        const prepare = await attachment.prepare(transaction,
            `DELETE FROM COMPONENTS C WHERE C."KEY" IN (${keys.map(k => "?").join(",")})`);
        await prepare.execute(transaction, [...keys]);
        await prepare.dispose();
        transaction.commit();
        return keys;
    } catch (e) {
        await transaction.rollback()
        throw e;
    }
}

export const updateEntities = async (entities: ApiEntity[]): Promise<ApiEntity[]> => {
    const db = new FirebirdNativeAdapter();
    const attachment = await db.connect();
    const transaction = await attachment.startTransaction();

    try {
        const prepare = await attachment.prepare(transaction,
            `UPDATE ENTITIES E SET
            E.NAME = ?, E.NOTE = ?, E."INDEX" = ?, E."TYPE" = ?,
            E.CATEGORY = ?, E.PARENT_KEY = ?, E.SAMPLE_KEY = ?,
            E.DATE_UPDATE = CURRENT_TIMESTAMP WHERE E.ID = ?
            RETURNING DATE_UPDATE;`);
        for (const item of entities) {
            console.log('updateEntities', item);
            const entry = await prepare.executeSingletonAsObject<{ DATE_UPDATE: Date}>(transaction, [
                item.name || null, item.note || null, item.index || 0, item.type || null,
                item.category || null, item.parentKey || null, item.sampleKey||null,
                item.id
            ]);
            
        }
       
        await prepare.dispose();
        transaction.commit();
        return entities;
    } catch (e) {
        await transaction.rollback()
        throw e;
    }
}

export const updateComponents = async (components: ApiComponent[], caller: string): Promise<ApiComponent[]> => {
    console.log('\x1b[42m%s\x1b[0m', caller, 'updateComponents', components);

    if (!components.length){
        return components;
    }

    const db = new FirebirdNativeAdapter();
    const attachment = await db.connect();
    const transaction = await attachment.startTransaction();
    try {
        const prepare = await attachment.prepare(transaction,
            `UPDATE COMPONENTS C SET
                C.ENTITY_KEY = ?,       
                C.SAMPLE_KEY = ?, 
                C."INDEX" = ?,
                C.COMPONENT_NAME = ?, 
                C.PROPERTY_NAME = ?, 
                C.COMPONENT_DESCRIPTION = ?,
                C.PROPERTY_DESCRIPTION = ?, 
                C.PROPERTY_VALUE = ?, 
                C.PROPERTY_FORMULA = ?,
                C.PROPERTY_TYPE = ?, 
                C.ATTRIBUTES = ?, 
                C.BINDING_TO_LIST = ?
            WHERE C.ID = ?`);

        for (const item of components) {
            await prepare.execute(transaction, [
                item.entityKey || null, 
                item.sampleKey || null, 
                item.index||0,
                item.componentName || null, 
                item.propertyName || null, 
                item.componentDescription||null,
                item.propertyDescription || null, 
                String(item.propertyValue) || null, 
                item.propertyFormula||null, 
                item.propertyType || null, 
                item.attributes || null, 
                String(!!item.bindingToList),
                item.id
            ]);
        }
        await prepare.dispose();
        transaction.commit();
        return components;
    } catch (e) {
        await transaction.rollback()
        console.log('\x1b[41m%s\x1b[0m', (e as Error).message);
        throw e;
    }
}

/**
 * Конвертер данных из хранилища, в данные ApiEntity
 * @param data данные запроса в виде EntityStorge 
 * @returns ApiEntity[];
 */
const entityConverter = (data: EntityStorge[]): ApiEntity[] => {
    const entities = [...new Set(data.map(d => d.KEY))]
        .reduce<ApiEntity[]>((acc, key) => {
        const itemDb = data.find(d => d.KEY === key);
        if (itemDb) {
            const components = data.filter(d => d.ENTITY_KEY === key)
                .map(C => {
                    const cmp: ApiComponent = {
                        id: C.ID_COMPONENT!,
                        key: C.COMPONENT_KEY!,
                        index: C.COMPONENT_INDEX!,
                        componentName: C.COMPONENT_NAME!,
                        componentDescription: C.COMPONENT_DESCRIPTION || "",
                        propertyName: C.PROPERTY_NAME!,
                        propertyDescription: C.PROPERTY_DESCRIPTION||"",
                        propertyValue: (<PropertyValue>C.PROPERTY_VALUE || ""),
                        propertyType: (<PropertyType>C.PROPERTY_TYPE||"string"),
                        indicators: {}, 
                        attributes: C.ATTRIBUTES||"",
                        bindingToList: C.BINDING_TO_LIST ||false,
                        entityKey: C.ENTITY_KEY||undefined,
                        previousValue: undefined,
                        propertyFormula: C.PROPERTY_FORMULA||undefined,
                        sampleKey: C.COMPONENT_SAMPLE_KEY||undefined
                    }
                    return cmp;
                });
            const apiEntity: ApiEntity = {
                id: itemDb.ID,
                key: itemDb.KEY,
                name: itemDb.NAME,
                index: itemDb.INDEX,
                category: itemDb.CATEGORY || undefined,
                note: itemDb.NOTE || undefined,
                parentKey: itemDb.PARENT_KEY || undefined, 
                sampleKey: itemDb.SAMPLE_KEY ||undefined,
                type: itemDb.TYPE || undefined,
                components: [...components],
                indicators: {}
            } 
            return [...acc, apiEntity]
        }
        return acc
    }, [])
    return entities;
}

interface EntityStorge {
    ID: number;
    KEY: string;
    NAME: string;
    NOTE: string | null;
    INDEX: number;
    TYPE: string | null;
    CATEGORY: string | null;
    PARENT_KEY: string | null;
    SAMPLE_KEY: string | null;
    DATE_CREATION: Date;
    DATE_UPDATE: Date;

    ID_COMPONENT: number | null;
    COMPONENT_KEY: string | null;
    COMPONENT_SAMPLE_KEY: string | null;
    ENTITY_KEY: string | null;
    COMPONENT_INDEX: number | null;
    COMPONENT_NAME: string | null;
    COMPONENT_DESCRIPTION: string | null;
    PROPERTY_NAME: string | null;
    PROPERTY_DESCRIPTION: string | null;
    PROPERTY_VALUE: string | null;
    PROPERTY_FORMULA: string | null;
    PROPERTY_TYPE: string | null;
    ATTRIBUTES: string | null;
    BINDING_TO_LIST: boolean | null;
}

interface ComponentStorge {

    ID: number | null;
    KEY: string | null;
    SAMPLE_KEY: string | null;
    ENTITY_KEY: string | null;
    INDEX: number | null;
    COMPONENT_NAME: string | null;
    COMPONENT_DESCRIPTION: string | null;
    PROPERTY_NAME: string | null;
    PROPERTY_DESCRIPTION: string | null;
    PROPERTY_VALUE: string | null;
    PROPERTY_FORMULA: string | null;
    PROPERTY_TYPE: string | null;
    ATTRIBUTES: string | null;
    BINDING_TO_LIST: boolean | null;
}

/**
 *  ID                     INTEGER NOT NULL,
    "KEY"                  VARCHAR(128) NOT NULL,
    ENTITY_KEY             VARCHAR(128),
    SAMPLE_KEY             VARCHAR(128),
    "INDEX"                SMALLINT DEFAULT 0,
    COMPONENT_NAME         VARCHAR(256),
    PROPERTY_NAME          VARCHAR(256),
    COMPONENT_DESCRIPTION  VARCHAR(256),
    PROPERTY_DESCRIPTION   VARCHAR(256),
    PROPERTY_VALUE         VARCHAR(2048),
    PROPERTY_FORMULA       VARCHAR(8100),
    PROPERTY_TYPE          VARCHAR(64),
    ATTRIBUTES             VARCHAR(256),
    BINDING_TO_LIST        BOOLEAN DEFAULT FALSE
 */
