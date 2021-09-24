const db = require('../dataBase');

const statusList = [];


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

const initStatuses = async () => {
    try {
        const statuses = await db.executeRequest(`select S.ID, S.STATUS_NUM, S.STATUS_DESCRIPTION from LIST_STATUSES S`);
        for (const status of statuses) {
            statusList.push(status);
        }
    } catch (error) {console.log('Error init Statuses', error);}
}

/*
 * Функции для возврата журналов 
 */

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
    isWorkPlan
}