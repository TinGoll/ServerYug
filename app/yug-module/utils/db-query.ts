const databaseQueryMap = new Map<DatabaseQueryKey, string>()
const getEntityToKey = `WITH RECURSIVE CTE
                    AS (SELECT *
                        FROM ENTITIES
                        WHERE ENTITIES."KEY" = ?
                        UNION ALL
                        SELECT *
                        FROM ENTITIES E
                        INNER JOIN CTE ON E.ID_PARENT = CTE.ID)
                    SELECT CT.*,
                        C.ID AS ID_COMPONENT,
                        C.ID_ENTITY,
                        C.COMPONENT_NAME,
                        C.COMPONENT_DESCRIPTION,
                        C.PROPERTY_NAME,
                        C.PROPERTY_DESCRIPTION,
                        C.PROPERTY_VALUE,
                        C.PROPERTY_FORMULA,
                        C.PROPERTY_TYPE,
                        C.ATTRIBUTES,
                        C.BINDING_TO_LIST,
                        C."KEY" AS COMPONENT_KEY,
                        C.ENTITY_KEY,
                        BLOB_CONVERT(C.FORMULA_IMPORT) AS FORMULA_IMPORT
                    FROM CTE CT
                    LEFT JOIN COMPONENTS C ON (C.ID_ENTITY = CT.ID)
                    ORDER BY C.ID_ENTITY, C.ID`;

const findGrandfather = `
    WITH RECURSIVE FIND_GRAND_PARENT
    AS (SELECT *
        FROM ENTITIES
        WHERE ENTITIES."KEY" = ?
        UNION ALL
        SELECT *
        FROM ENTITIES E
        INNER JOIN FIND_GRAND_PARENT ON (E.ID = FIND_GRAND_PARENT.ID_PARENT))
    SELECT FGB.*, CMP.ID AS ID_COMPONENT, CMP.ID_ENTITY, CMP.COMPONENT_NAME, CMP.COMPONENT_DESCRIPTION, CMP.PROPERTY_NAME,
        CMP.PROPERTY_DESCRIPTION, CMP.PROPERTY_VALUE, CMP.PROPERTY_FORMULA, CMP.PROPERTY_TYPE, CMP.ATTRIBUTES,
        CMP.BINDING_TO_LIST, CMP."KEY" AS COMPONENT_KEY, CMP.ENTITY_KEY, BLOB_CONVERT(CMP.FORMULA_IMPORT) AS FORMULA_IMPORT

    FROM FIND_GRAND_PARENT FGB
    LEFT JOIN COMPONENTS CMP ON (CMP.ID_ENTITY = FGB.ID)
    WHERE FGB.ID_PARENT IS NULL
`
const getSampleNames = `SELECT E.ID, E."KEY", E.PARENT_KEY, E.NAME, E.NOTE, E.CATEGORY FROM ENTITIES E WHERE E.ID_SAMPLE IS NULL`;
const getEntityCategories = `SELECT DISTINCT E.CATEGORY FROM ENTITIES E WHERE E.CATEGORY IS NOT NULL`
const getAllOrders = `SELECT E.ID, E."KEY", E.NAME, E.NOTE, E.CATEGORY,
                        C.COMPONENT_NAME, C.PROPERTY_NAME, C.COMPONENT_DESCRIPTION,
                        C.PROPERTY_DESCRIPTION, C.PROPERTY_VALUE
                    FROM ENTITIES E
                        LEFT JOIN COMPONENTS C ON (C.ID_ENTITY = E.ID)
                    WHERE E.ID_PARENT IS NULL AND
                        E.ID_SAMPLE IS NOT NULL`

databaseQueryMap.set('get entity categories', getEntityCategories);
databaseQueryMap.set('get sample names', getSampleNames);
databaseQueryMap.set('get entity to key', getEntityToKey);
databaseQueryMap.set('find grandfather', findGrandfather);
databaseQueryMap.set('get all orders', getAllOrders);


const databaseQuery = (key: DatabaseQueryKey) => {
    return databaseQueryMap.get(key)||'';
}

type DatabaseQueryKey = typeof databasetQueryKeys[number]
const databasetQueryKeys = ['get entity to key', 'find grandfather', 'get sample names', 'get entity categories', 'get all orders'] as const;

export default databaseQuery;