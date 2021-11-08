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
            const plan = arrPlans.find(p => p.dateDescription.toUpperCase() == name.toUpperCase());
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
        const res = await db.executeRequest(`select S.ID, S.NAME, S.ORDER_BY from SECTORS S`);
        for (const sector of res.map(s => {
            return {
                id: s.ID,
                name: s.NAME,
                orderBy: s.ORDER_BY
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

const workTime = (startDate) => {
    const oneDayMS = (24 * 60 * 60 * 1000);
    const nowMS = Date.now();
    let tempMS = startDate.valueOf();
    let weekends = 0;
    let workDay = 0;
    let lastDay = new Date();
    while (tempMS < nowMS) {
        const currentDate = new Date(tempMS);
        lastDay = currentDate;
        if (!(currentDate.getDay() % 6 == 0))
            workDay++;
        else
            weekends++;
        tempMS += oneDayMS;
    }
    if (!((new Date(nowMS)).getDay() % 6 == 0))
        workDay--;
    else
        weekends--;
    const res = workDay * oneDayMS + (nowMS - lastDay.valueOf());
    return (res < 0 ? 0 : res);
};


const getJournalToId = async (id) => {
    try {
        const sectorsDep = await db.executeRequest(`SELECT DISTINCT D.ID_SECTOR_TRANSFER FROM JOURNAL_DEP D WHERE D.ID_JOURNAL_NAME = ${id}`);
        if (!sectorsDep.length) return null;
        const orderComments = await db.executeRequest(`SELECT DISTINCT 
                                                        O.ID as ORDER_ID, D.ID AS DATA_ID, D.ID_SECTOR,
                                                        GET_SECTOR_NAME(D.ID_SECTOR) AS SECTOR, D.ID_EMPLOYEE,
                                                        GET_EMP_NAME(D.ID_EMPLOYEE) AS EMP_NAME, D.DATA_GROUP,
                                                        D.DATA_NAME, D.DATA_VALUE
                                                    FROM ORDERS_IN_PROGRESS O
                                                    LEFT JOIN JOURNAL_DATA D ON (D.ID_ORDER = O.ID)
                                                    WHERE D.ID IS NOT NULL AND D.DATA_GROUP = 'Comment'`
        );
        const query = `
                SELECT DISTINCT
                    ORD.ID, ORD.ITM_ORDERNUM, ORD.ORDER_GENERALSQ, ORD.ORDER_FASADSQ,
                    COALESCE((
                        SELECT FIRST 1 EMP.NAME
                        FROM JOURNAL_TRANS TR
                        LEFT JOIN EMPLOYERS EMP ON (EMP.ID = TR.ID_EMPLOYEE)
                        WHERE TR.ID_JOURNAL = J.ID AND TR.MODIFER > 0
                    ), ORD.DATE_SECTOR, 'Не определен') AS DATE_SECTOR,

                    ORD.ID_NEW_SECTOR, GET_SECTOR_NAME(ORD.ID_NEW_SECTOR) S_NAME,
                    ORD.DATE3 AS DATE_PLAN, GET_SECTOR_NAME(L.ID_SECTOR) AS LOCATION, J.ID AS J_ID , J.TRANSFER_DATE
                FROM
                    (SELECT DISTINCT O.ID, O.ITM_ORDERNUM, O.ORDER_GENERALSQ, O.ORDER_FASADSQ, O.ORDER_STATUS, S.ID_NEW_SECTOR, P.DATE3, P.DATE_SECTOR
                    FROM ORDERS_IN_PROGRESS O
                    LEFT JOIN ORDERS_DATE_PLAN P ON (P.ORDER_ID = O.ID)
                    LEFT JOIN SECTORS_OLD S ON (P.DATE_DESCRIPTION = S.NAME_OLD_SECTOR)
                    WHERE S.ID_NEW_SECTOR IN (${sectorsDep.map(s => s.ID_SECTOR_TRANSFER).join(', ')})) ORD

                LEFT JOIN LOCATION_ORDER L ON (L.ID_ORDER = ORD.ID AND ORD.ID_NEW_SECTOR = L.ID_SECTOR)
                LEFT JOIN JOURNALS J ON
                    (J.ID_ORDER = ORD.ID AND EXISTS (
                        SELECT T.ID FROM JOURNAL_TRANS T
                        WHERE T.ID_JOURNAL = J.ID AND
                        T.ID_SECTOR = ORD.ID_NEW_SECTOR AND
                        (T.MODIFER <0 OR (L.ID_SECTOR IS NOT NULL))
                    )
                )
                WHERE (J.ID IS NULL OR (L.ID_SECTOR IS NOT NULL))
                ORDER BY ORD.DATE3
                `;
        let journal = [];
        const res = await db.executeRequest(query); // Получаем данные из базы
        /** Обработка дынных **/
        // Получение секторов.
        if (!sectorsList.length) initSectors();
        let sectors = _.uniqBy(res, obj => obj.ID_NEW_SECTOR).map(s => {
            return {id: s.ID_NEW_SECTOR, name: s.S_NAME, overdue: [], forToday: [], forFuture: []}
        });
        if (!sectorsList.length) await initSectors();
        sectors = sectors.sort((a, b) => {
            const orderA = (sectorsList.find(s => s?.name == a?.name))?.orderBy || 0;
            const orderB = (sectorsList.find(s => s?.name == b?.name))?.orderBy || 0;
            if (orderA < orderB) return -1;
            if (orderA > orderB) return 1;
            return 0;
        });

        for (const sector of sectors) {
            const orders = _.uniqWith(res.filter(o => o.ID_NEW_SECTOR == sector.id)
                .map(o => {
                    return {
                        id:                 o.ID, 
                        itmOrderNum:        o.ITM_ORDERNUM,
                        sectorId:           o.ID_NEW_SECTOR, 
                        sectorName:         o.S_NAME,
                        nameSectorInOrder:  o.DATE_SECTOR,
                        datePlan:           o.DATE_PLAN, 
                        fasadSquare:        o.ORDER_FASADSQ, 
                        generalSquare:      o.ORDER_GENERALSQ,
                        workingTime:        o.TRANSFER_DATE ? workTime(o.TRANSFER_DATE) : 0,
                        data:  {
                            comments: []
                        }
                    }
                }), _.isEqual);
                for (const order of orders) {
                    order.data.comments = orderComments
                    .filter(c => c.ORDER_ID == order.id)
                    .map(c => {
                        return {id: c.DATA_ID, sector: c.SECTOR, userId: c.ID_EMPLOYEE, userName: c.EMP_NAME, text: c.DATA_VALUE}
                    }) 
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