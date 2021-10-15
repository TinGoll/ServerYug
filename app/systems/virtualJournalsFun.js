const db                        = require('../dataBase');
const _                         = require('lodash');
const users                     = require('../systems/users');
const {format}                  = require('date-format-parse');

const statusList = [];  // Статусы
const sectorsList = []; // Сектора
const userList = [];    // Пользователи

// Права журнала
const journals = [
    {id: 1, name: 'Журнал сборки', j: [1]},
    {id: 2, name: 'Журнал шлифовки', j: [2]},
    {id: 3, name: 'Журнал лакировки', j: [3]},
    {id: 4, name: 'Журнал упаковки', j: [4]},
    {id: 5, name: 'Журнал бухгалтера', j: [1, 2, 3, 4]}
]

const permissions = [
    {name: 'Journals [get-journals] get all', data: [...journals]},         // Все журналы
    {name: 'Journals [get-journals] get sborka', data: [journals[0]]},      // Журнал сборки
    {name: 'Journals [get-journals] get shlif', data: [journals[1]]},       // Журнал Шлифовки
    {name: 'Journals [get-journals] get lak', data: [journals[2]]},         // Журнал лакировки
    {name: 'Journals [get-journals] get upak', data: [journals[3]]},        // Журнал упаковки
    {name: 'Journals [get-journals] get buhgalter', data: [journals[4]]}    // Журнал Бухгалтера
];

//Получение списка прав
const permissionSet = async (user) => {
    try {
        const set = new Set();
        for (let i = 0; i < permissions.length; i++) {
            if (await user.permissionCompare(permissions[i].name)) {
                for (const j of permissions[i].data) 
                        if (!set.has(j)) set.add(j);
            }
        }
        return [...set];
    } catch (error) {
        return [];
    } 
}
//Функции журналов

const getIdSectorArrToNameOldSector = async (oldname) => {
    try {
        const query = `select O.ID_NEW_SECTOR
                    from SECTORS_OLD O
                    where upper(O.NAME_OLD_SECTOR) = upper('${oldname}')`;
        const sectors = await db.executeRequest(query); 
        return sectors.map(s=>s.ID_NEW_SECTOR);
    } catch (error) {throw error;}
    
}   
const getNameOldSectorArrToIdNewSector = async (idNew) => {
    try {
        const query = `select O.NAME_OLD_SECTOR
                    from SECTORS_OLD O
                    where O.ID_NEW_SECTOR = ${idNew}`;
        const sectors = await db.executeRequest(query); 
        return sectors.map(s=>s.NAME_OLD_SECTOR);
    } catch (error) {throw error}
}
const getPlansToOrderId = async (orderId) => {
    try {
        const query = `select P.ORDER_ID, P.DATE_SECTOR, P.DATE_DESCRIPTION, P.comment, P.DATE1, P.DATE2, P.DATE3
                    from ORDERS_DATE_PLAN P
                    where P.ORDER_ID = ${orderId}`;
        return await db.executeRequest(query);
    } catch (error) {throw error;}
}
const isWorkPlan = (arrSectorNames, arrPlans) => {
    try {
        for (const name of arrSectorNames) {
            const plan = arrPlans.find(p => p.DATE_DESCRIPTION.toUpperCase() == name.toUpperCase());
            if (plan) return true;
        }
        return false;
    } catch (error) {return false}
}
const getStatusNumOldToIdStatusOld = async (idStatus) => {
    if (statusList.length == 0) await initStatuses();
    const status = statusList.find(s => s.ID == idStatus);
    return status ? status.STATUS_NUM : undefined;
}
// Инициализация статусов
const initStatuses = async () => {
    try {
        const statuses = await db.executeRequest(`select S.ID, S.STATUS_NUM, S.STATUS_DESCRIPTION from LIST_STATUSES S`);
        for (const status of statuses) 
            statusList.push(status)
        return statusList;
    } catch (error) {
        console.log('Error init Statuses', error);
        return statusList;
    }
}
// Инициализация секторов
const initSectors = async () => {
    try {
        const res = await db.executeRequest(`select S.ID, S.NAME from SECTORS S`);
        for (const sector of res.map(s => {
            return {
                id: s.ID,
                name: s.NAME
            }
        })) {
            sectorsList.push(sector);
        }
        return sectorsList;
    } catch (error) {
        console.log(error);
        return sectorsList;
    }
    
}

const getStatuses = async () => {
    if (statusList.length) return statusList;
    return await initStatuses ();
}

// Получение списка секторов
const getSectors = async () => {
        if (sectorsList.length) return sectorsList;
        return await initSectors();
}

/*
 * Функции для возврата журналов 
 */

const getJournalToId = async (id) => {
    try {
        const query = `
        SELECT DISTINCT O.ID, O.ITM_ORDERNUM, S.ID AS SECTOR_ID, S.NAME AS SECTOR, P.DATE_SECTOR,
                P.DATE3 AS DATE_PLAN, STATUS.ID AS STATUS_ID,
                STATUS.STATUS_NUM, STATUS.STATUS_DESCRIPTION,
                O.ORDER_GENERALSQ, O.ORDER_FASADSQ,
                JD.ID_SECTOR as DATA_SECTOR_ID , JD.ID_EMPLOYEE as DATA_EMPLOYEE_ID, JD.ID as DATA_ID, JD.DATA_GROUP, JD.DATA_NAME, JD.DATA_VALUE

        FROM ORDERS_IN_PROGRESS O
        LEFT JOIN ORDERS_DATE_PLAN P ON (P.ORDER_ID = O.ID)
        LEFT JOIN JOURNALS J ON (J.ID_ORDER = O.ID)
        LEFT JOIN SECTORS_OLD SO ON (UPPER(TRIM(P.DATE_DESCRIPTION)) = UPPER(TRIM(SO.NAME_OLD_SECTOR)))
        LEFT JOIN SECTORS S ON (SO.ID_NEW_SECTOR = S.ID)
        LEFT JOIN LIST_STATUSES STATUS ON (O.ORDER_STATUS = STATUS.STATUS_NUM)
        LEFT JOIN JOURNAL_DATA JD ON (JD.ID_ORDER = O.ID)

        WHERE J.ID IS NULL AND
            EXISTS(SELECT D.ID
                    FROM JOURNAL_DEP D
                    WHERE  D.ID_SECTOR_TRANSFER = S.ID AND
                            (D.ID_STATUS = STATUS.ID or (D.ID_STATUS is null) ) AND
                            D.ID_JOURNAL_NAME IN (${id})
            )
        order by P.DATE3
        `;
        const journal = [];
        const res = await db.executeRequest(query); // Получаем данные из базы
        /** Обработка дынных **/
        // Получение секторов.
        if (!sectorsList.length) initSectors();
        const sectors = _.uniqBy(res, obj => obj.SECTOR_ID).map(s => {
            return {id: s.SECTOR_ID, name: s.SECTOR, overdue: [], forToday: [], forFuture: []}
        });
        // 
        for (const sector of sectors) {
            const orders = _.uniqWith(res.filter(o => o.SECTOR_ID == sector.id)
                .map(o => {
                    return {
                        id:                 o.ID, 
                        itmOrderNum:        o.ITM_ORDERNUM,
                        sectorId:           o.SECTOR_ID, 
                        sectorName:         o.SECTOR,
                        nameSectorInOrder:  o.DATE_SECTOR,
                        datePlan:           o.DATE_PLAN, 
                        fasadSquare:        o.ORDER_FASADSQ, 
                        generalSquare:      o.ORDER_GENERALSQ,
                        data:           {
                            comments: []
                        }
                    }
                }), _.isEqual);
                for (const order of orders) {
                    order.data.comments = await Promise.all(res
                        .filter(o => o.ID == order.id && o.DATA_GROUP?.toUpperCase() == 'Comment'.toUpperCase())
                        .map(async (o) => {
                            
                            const listSectors = await getSectors();
                            const user = await users.getUserToID(o.DATA_EMPLOYEE_ID);
                            let sector = listSectors.find(s => s.id == o.DATA_SECTOR_ID);
                            if (!sector) sector = listSectors.find(s => s.id == user.sectorId);
                            return {id: o.DATA_ID, sector: sector?.name, userId: o.DATA_EMPLOYEE_ID, userName: user?.userName, text: o.DATA_VALUE}
                        }));
                }
            
            const now = new Date();
            const toDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).valueOf();
            sector.overdue = orders.filter(o => o.datePlan.valueOf() < toDay); // Просроченые
            sector.forToday = orders.filter(o => o.datePlan.valueOf() == toDay); // На сегодня
            sector.forFuture = orders.filter(o => o.datePlan.valueOf() > toDay); // Будущие
            journal.push(sector)
        }
        return journal;
    } catch (error) {throw error;}
}

const journalSborka = async () => {
    try {

        let query = `select * from REPORT_SBORKA (1);`
        const overdue = await db.executeRequest(query);
        query = `select * from REPORT_SBORKA (2);`
        const forToday = await db.executeRequest(query);
        query = `select * from REPORT_SBORKA (3);`
        const forFuture = await db.executeRequest(query);

        return {overdue, forToday, forFuture}
    } catch (error) {
        throw error;
    }
}

module.exports = {
    journalSborka,
    getIdSectorArrToNameOldSector,
    getNameOldSectorArrToIdNewSector,
    getStatusNumOldToIdStatusOld,
    getPlansToOrderId,
    isWorkPlan,
    permissionSet,
    getJournalToId,
    getSectors,
    getStatuses,
    journals,
    permissions
}