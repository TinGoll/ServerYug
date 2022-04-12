"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertJournalDataDbToDto = exports.getSectors = exports.getStatuses = void 0;
const dataBase_1 = __importDefault(require("../dataBase"));
const lodash_1 = __importDefault(require("lodash"));
const Firebird_1 = require("../firebird/Firebird");
const statusList = []; // Статусы
const sectorsList = []; // Сектора
const userList = []; // Пользователи
// Права журнала
const journals = [
    { id: 1, name: 'Журнал сборки', j: [1] },
    { id: 2, name: 'Журнал шлифовки', j: [2] },
    { id: 3, name: 'Журнал лакировки', j: [3] },
    { id: 4, name: 'Журнал упаковки', j: [4] },
    { id: 5, name: 'Журнал бухгалтера', j: [1, 2, 3, 4] },
    { id: 6, name: 'Общий журнал', j: [1, 2, 3, 4] },
    { id: 7, name: 'Жунал нижнего цеха', j: [7] },
];
const permissions = [
    { name: 'Journals [get-journals] get all', data: [...journals] },
    { name: 'Journals [get-journals] get sborka', data: [journals[0]] },
    { name: 'Journals [get-journals] get shlif', data: [journals[1]] },
    { name: 'Journals [get-journals] get lak', data: [journals[2]] },
    { name: 'Journals [get-journals] get upak', data: [journals[3]] },
    { name: 'Journals [get-journals] get buhgalter', data: [journals[4]] },
    { name: 'Journals [get-journals] get general', data: [journals[5]] },
    { name: 'Journals [get-journals] get lower factory', data: [journals[6]] } // Жунал нижнего цеха
];
const sectorsDefault = [5, 23, 24]; //Упаковка, склад отгруженных, отгрузка
//Получение списка прав
const permissionSet = (user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const set = new Set();
        for (let i = 0; i < permissions.length; i++) {
            if (yield user.permissionCompare(permissions[i].name)) {
                for (const j of permissions[i].data)
                    if (!set.has(j))
                        set.add(j);
            }
        }
        return [...set];
    }
    catch (error) {
        return [];
    }
});
//Функции журналов
const getIdSectorArrToNameOldSector = (oldname) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = `select O.ID_NEW_SECTOR
                    from SECTORS_OLD O
                    where upper(O.NAME_OLD_SECTOR) = upper('${oldname}')`;
        const sectors = yield dataBase_1.default.executeRequest(query);
        return sectors.map(s => s.ID_NEW_SECTOR);
    }
    catch (error) {
        throw error;
    }
});
const getNameOldSectorArrToIdNewSector = (idNew) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = `select O.NAME_OLD_SECTOR
                    from SECTORS_OLD O
                    where O.ID_NEW_SECTOR = ${idNew}`;
        const sectors = yield dataBase_1.default.executeRequest(query);
        return sectors.map(s => s.NAME_OLD_SECTOR);
    }
    catch (error) {
        throw error;
    }
});
const getOldAndNewSectors = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield (0, Firebird_1.createItmDb)();
        try {
            const resDb = yield db.executeRequest('SELECT O.ID_NEW_SECTOR, O.NAME_OLD_SECTOR FROM SECTORS_OLD O');
            const res = resDb.map(r => {
                return { newId: r.ID_NEW_SECTOR, oldName: r.NAME_OLD_SECTOR };
            });
            return res;
        }
        catch (e) {
            throw e;
        }
        finally {
            db.detach();
        }
    }
    catch (e) {
        throw e;
    }
});
const getPlansToOrderId = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = `select P.ORDER_ID, P.DATE_SECTOR, P.DATE_DESCRIPTION, P.COMMENT, P.DATE1, P.DATE2, P.DATE3
                    from ORDERS_DATE_PLAN P where P.ORDER_ID = ${orderId}`;
        return (yield dataBase_1.default.executeRequest(query));
    }
    catch (error) {
        throw error;
    }
});
const isWorkPlan = (arrSectorNames, arrPlans) => {
    try {
        for (const name of arrSectorNames) {
            const plan = arrPlans.find(p => p.dateDescription.toUpperCase() == name.toUpperCase());
            if (plan)
                return true;
        }
        return false;
    }
    catch (error) {
        return false;
    }
};
const getStatusNumOldToIdStatusOld = (idStatus) => __awaiter(void 0, void 0, void 0, function* () {
    if (statusList.length == 0)
        yield initStatuses();
    const status = statusList.find(s => s.ID == idStatus);
    return status === null || status === void 0 ? void 0 : status.STATUS_NUM;
});
// Инициализация статусов
const initStatuses = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const statuses = yield dataBase_1.default.executeRequest(`select S.ID, S.STATUS_NUM, S.STATUS_DESCRIPTION from LIST_STATUSES S`);
        for (const status of statuses)
            statusList.push(status);
        return statusList;
    }
    catch (error) {
        console.log('Error init Statuses', error);
        return statusList;
    }
});
// Инициализация секторов
const initSectors = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield dataBase_1.default.executeRequest(`select S.ID, S.NAME, S.ORDER_BY from SECTORS S`);
        for (const sector of res.map(s => {
            return {
                id: s.ID,
                name: s.NAME,
                orderBy: s.ORDER_BY
            };
        })) {
            sectorsList.push(sector);
        }
        return sectorsList;
    }
    catch (error) {
        console.log(error);
        return sectorsList;
    }
});
const getStatuses = () => __awaiter(void 0, void 0, void 0, function* () {
    if (statusList.length)
        return statusList;
    return (yield initStatuses());
});
exports.getStatuses = getStatuses;
// Получение списка секторов
const getSectors = () => __awaiter(void 0, void 0, void 0, function* () {
    if (sectorsList.length)
        return sectorsList;
    return (yield initSectors());
});
exports.getSectors = getSectors;
/*
 * Функции для возврата журналов
 */
const workTime = (startDate) => {
    if (!startDate)
        return 0;
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
const getJournalToId = (id, sect = []) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const sectorsDep = yield dataBase_1.default.executeRequest(`SELECT DISTINCT D.ID_SECTOR_TRANSFER FROM JOURNAL_DEP D WHERE D.ID_JOURNAL_NAME = ${id}`);
        if (sect.length) {
            for (const s of sect) {
                sectorsDep.push({ ID_SECTOR_TRANSFER: s });
            }
        }
        if (!sectorsDep.length)
            return [];
        const orderComments = yield dataBase_1.default.executeRequest(`
                                                    SELECT DISTINCT 
                                                        O.ID as ORDER_ID, D.ID AS DATA_ID, D.ID_SECTOR,
                                                        GET_SECTOR_NAME(D.ID_SECTOR) AS SECTOR, D.ID_EMPLOYEE,
                                                        GET_EMP_NAME(D.ID_EMPLOYEE) AS EMP_NAME, D.DATA_GROUP,
                                                        D.DATA_NAME, D.DATA_VALUE
                                                    FROM ORDERS_IN_PROGRESS O
                                                    LEFT JOIN JOURNAL_DATA D ON (D.ID_ORDER = O.ID)
                                                    WHERE D.ID IS NOT NULL AND D.DATA_GROUP = 'Comment'`);
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
                    WHERE (O.PROFILER != 1 OR (O.PROFILER IS NULL)) AND S.ID_NEW_SECTOR IN (${sectorsDep.map(s => s.ID_SECTOR_TRANSFER).join(', ')})) ORD
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
                ORDER BY ORD.DATE3`;
        let journal = [];
        const res = yield dataBase_1.default.executeRequest(query); // Получаем данные из базы
        /** Обработка дынных **/
        // Получение секторов.
        if (!sectorsList.length)
            initSectors();
        let sectors = lodash_1.default.uniqBy(res, obj => obj.ID_NEW_SECTOR).map(s => {
            return { id: s.ID_NEW_SECTOR, name: s.S_NAME, overdue: [], forToday: [], forFuture: [] };
        });
        if (!sectorsList.length)
            yield initSectors();
        sectors = sectors.sort((a, b) => {
            var _a, _b;
            const orderA = ((_a = (sectorsList.find(s => (s === null || s === void 0 ? void 0 : s.name) == (a === null || a === void 0 ? void 0 : a.name)))) === null || _a === void 0 ? void 0 : _a.orderBy) || 0;
            const orderB = ((_b = (sectorsList.find(s => (s === null || s === void 0 ? void 0 : s.name) == (b === null || b === void 0 ? void 0 : b.name)))) === null || _b === void 0 ? void 0 : _b.orderBy) || 0;
            if (orderA < orderB)
                return -1;
            if (orderA > orderB)
                return 1;
            return 0;
        });
        for (const sector of sectors) {
            const orders = lodash_1.default.uniqWith(res.filter(o => o.ID_NEW_SECTOR == sector.id)
                .map(o => {
                return {
                    id: o.ID,
                    itmOrderNum: o.ITM_ORDERNUM,
                    sectorId: o.ID_NEW_SECTOR,
                    sectorName: o.S_NAME,
                    nameSectorInOrder: o.DATE_SECTOR,
                    datePlan: o.DATE_PLAN,
                    fasadSquare: o.ORDER_FASADSQ,
                    generalSquare: o.ORDER_GENERALSQ,
                    workingTime: o.TRANSFER_DATE ? workTime(o.TRANSFER_DATE) : 0,
                    data: {
                        comments: []
                    }
                };
            }), lodash_1.default.isEqual);
            for (const order of orders) {
                order.data.comments = orderComments
                    .filter(c => c.ORDER_ID == order.id)
                    .map(c => {
                    return { id: c.DATA_ID, sector: c.SECTOR, userId: c.ID_EMPLOYEE, userName: c.EMP_NAME, text: c.DATA_VALUE };
                });
            }
            const now = new Date();
            const toDay = (_a = new Date(now.getFullYear(), now.getMonth(), now.getDate())) === null || _a === void 0 ? void 0 : _a.valueOf();
            sector.overdue = orders.filter(o => { var _a; return ((_a = o.datePlan) === null || _a === void 0 ? void 0 : _a.valueOf()) < toDay; }); // Просроченые
            sector.forToday = orders.filter(o => { var _a; return ((_a = o.datePlan) === null || _a === void 0 ? void 0 : _a.valueOf()) == toDay; }); // На сегодня
            sector.forFuture = orders.filter(o => { var _a; return ((_a = o.datePlan) === null || _a === void 0 ? void 0 : _a.valueOf()) > toDay; }); // Будущие
            journal.push(sector);
        }
        return journal;
    }
    catch (error) {
        throw error;
    }
});
const convertJournalDataDbToDto = (data) => {
    try {
        const eData = {
            id: data.ID,
            journalId: data.ID_JOURNAL,
            sectorId: data.ID_SECTOR,
            orderId: data.ID_ORDER,
            employeeId: data.ID_EMPLOYEE,
            type: data.DATA_TYPE,
            group: data.DATA_GROUP,
            name: data.DATA_NAME,
            data: data.DATA_VALUE
        };
        return eData;
    }
    catch (e) {
        throw e;
    }
};
exports.convertJournalDataDbToDto = convertJournalDataDbToDto;
const journalSborka = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let query = `select * from REPORT_SBORKA (1);`;
        const overdue = yield dataBase_1.default.executeRequest(query);
        query = `select * from REPORT_SBORKA (2);`;
        const forToday = yield dataBase_1.default.executeRequest(query);
        query = `select * from REPORT_SBORKA (3);`;
        const forFuture = yield dataBase_1.default.executeRequest(query);
        return { overdue, forToday, forFuture };
    }
    catch (error) {
        throw error;
    }
});
exports.default = {
    journalSborka,
    getIdSectorArrToNameOldSector,
    getNameOldSectorArrToIdNewSector,
    getStatusNumOldToIdStatusOld,
    getOldAndNewSectors,
    getPlansToOrderId,
    isWorkPlan,
    permissionSet,
    getJournalToId,
    getSectors: exports.getSectors,
    getStatuses: exports.getStatuses,
    journals,
    permissions
};
