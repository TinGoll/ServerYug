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
    C.ENTITY_KEY
 FROM CTE CT
LEFT JOIN COMPONENTS C ON (C.ID_ENTITY = CT.ID)`;

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
        CMP.BINDING_TO_LIST, CMP."KEY" AS COMPONENT_KEY, CMP.ENTITY_KEY

    FROM FIND_GRAND_PARENT FGB
    LEFT JOIN COMPONENTS CMP ON (CMP.ID_ENTITY = FGB.ID)
    WHERE FGB.ID_PARENT IS NULL
`


databaseQueryMap.set('get entity to key', getEntityToKey);
databaseQueryMap.set('find grandfather', findGrandfather);


const databaseQuery = (key: DatabaseQueryKey) => {
    return databaseQueryMap.get(key)||'';
}


type DatabaseQueryKey = typeof databasetQueryKeys[number]
const databasetQueryKeys = ['get entity to key', 'find grandfather'] as const;

export default databaseQuery;