"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.OrderPlanSystem = void 0;
const ApiError_1 = __importDefault(require("../exceptions/ApiError"));
const Firebird_1 = require("../firebird/Firebird");
const dtoConverter_1 = __importDefault(require("./dtoConverter"));
const extra_data_system_1 = __importStar(require("./extra-data-system"));
const search_keywords_1 = require("./search-keywords");
const users_1 = require("./users");
const virtualJournalsFun_1 = require("./virtualJournalsFun");
class OrderPlanSystem {
    constructor() {
        this.orders = [];
        this.dependenses = [];
        this.statuses = [];
        this.updateTime = 20; // Минуты
        this.defaultLimit = 25;
        this.lastUpdate = null; // Последнее обновление в мсек.
        this.keywords = search_keywords_1.orderKeywords;
        if (OrderPlanSystem.instance) {
            return OrderPlanSystem.instance;
        }
        OrderPlanSystem.instance = this;
    }
    getCommentToOrderId(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const system = new extra_data_system_1.default();
                const data = yield system.getCommentsToOrderId(id);
                return data;
            }
            catch (e) {
                throw e;
            }
        });
    }
    getDependenses() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!((_a = this.dependenses) === null || _a === void 0 ? void 0 : _a.length))
                    this.refrash();
                return this.dependenses;
            }
            catch (e) {
                throw e;
            }
        });
    }
    getData(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.isEmpty() || !this.lastUpdate || (this.lastUpdate + (this.updateTime * 60 * 1000)) < Date.now())
                    yield this.refrash();
                //console.log(options);
                const journalNameId = options === null || options === void 0 ? void 0 : options.id;
                const dependenses = this.dependenses.filter(d => d.journalNameId === Number(journalNameId));
                const orders = this.orders.filter(order => {
                    let check = false;
                    /** Фильтрация по id журнала, попажают только те участки, которые есть в журнале */
                    if (!journalNameId)
                        check = true;
                    /** Если профильщик - выходим */
                    if (order.isProfiler)
                        return false;
                    if (!order.sectorId)
                        return false;
                    for (const d of dependenses) {
                        if (order.sectorId === d.transfer) {
                            check = true;
                            break;
                        }
                    }
                    /** если запись есть в журнале, значит заказ уже передан следующему участку */
                    if (order.journalId && !order.locationSectorId)
                        check = false;
                    /** если текущая локация совпадает с сектором, то показываем рабочее время в этом участке или обновляем */
                    if (order.locationSectorId && order.sectorId === order.locationSectorId) {
                        //console.log(order.accepdedDate);
                        if (order.transferDate) {
                            order.workingTime = this.getWorkTime(order.transferDate);
                        }
                    }
                    else
                        order.workingTime = 0;
                    return check;
                });
                const extraSystem = new extra_data_system_1.default();
                const extraData = yield extraSystem.getAll();
                for (const o of orders) {
                    const comments = extraData.filter(e => { var _a; return e.orderId === o.id && ((_a = e.name) === null || _a === void 0 ? void 0 : _a.toUpperCase()) === extra_data_system_1.ExtraDataName.COMMENT.toUpperCase(); });
                    o.data.comments = comments;
                }
                if (!options)
                    return orders;
                return this.searchEngine(orders, options);
            }
            catch (e) {
                throw e;
            }
        });
    }
    searchEngine(orders, options) {
        try {
            let dateFirst = undefined;
            let dateSecond = undefined;
            const d1 = options === null || options === void 0 ? void 0 : options.d1;
            const d2 = options === null || options === void 0 ? void 0 : options.d2;
            const filter = (options === null || options === void 0 ? void 0 : options.filter) || '';
            if (d1 && d1 instanceof Date)
                dateFirst = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
            if (d2 && d2 instanceof Date)
                dateSecond = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
            const { queryKeys, keys } = this.getArrayOfKeywords(filter);
            if (!queryKeys.length && !keys.length && !dateFirst && !dateSecond)
                return orders;
            const filteredArray = orders.filter(order => {
                let check = true;
                const date = order.datePlan && order.datePlan instanceof Date ? new Date(order.datePlan.getFullYear(), order.datePlan.getMonth(), order.datePlan.getDate()).valueOf() : undefined;
                if (date && dateFirst)
                    if (!(date >= dateFirst.valueOf()))
                        return false;
                if (date && dateSecond)
                    if (!(date <= dateSecond.valueOf()))
                        return false;
                if (keys.length && check)
                    check = this.containsKeywords(order, keys);
                if (queryKeys.length && check)
                    check = this.containsWords(order, queryKeys);
                return check;
            });
            return filteredArray;
        }
        catch (e) {
            return [];
        }
    }
    containsKeywords(order, keys) {
        var _a, _b, _c, _d;
        try {
            for (const k of keys) {
                const now = new Date();
                const toDay = (_a = new Date(now.getFullYear(), now.getMonth(), now.getDate())) === null || _a === void 0 ? void 0 : _a.valueOf();
                if (k.toUpperCase() === 'Упакован'.toUpperCase() && order.statusId !== 7)
                    return false;
                if (k.toUpperCase() === 'Отгружен'.toUpperCase() && order.statusId !== 8)
                    return false;
                if (k.toUpperCase() === 'На сборке'.toUpperCase() && order.statusId !== 1)
                    return false;
                if (k.toUpperCase() === 'На шлифовке'.toUpperCase() && order.statusId !== 2)
                    return false;
                if (k.toUpperCase() === 'Покраска этап №1'.toUpperCase() && order.statusId !== 3)
                    return false;
                if (k.toUpperCase() === 'Патина этап №2'.toUpperCase() && order.statusId !== 4)
                    return false;
                if (k.toUpperCase() === 'Лак этап №3'.toUpperCase() && order.statusId !== 5)
                    return false;
                if (k.toUpperCase() === 'В упаковке'.toUpperCase() && order.statusId !== 6)
                    return false;
                if (k.toUpperCase() === 'Переданные'.toUpperCase()) {
                    if (order.locationSectorId != order.sectorId)
                        return false;
                }
                if (k.toUpperCase() === 'overdue'.toUpperCase()) {
                    if (((_b = order.datePlan) === null || _b === void 0 ? void 0 : _b.valueOf()) >= toDay)
                        return false;
                }
                if (k.toUpperCase() === 'forToday'.toUpperCase()) {
                    if (((_c = order.datePlan) === null || _c === void 0 ? void 0 : _c.valueOf()) != toDay)
                        return false;
                }
                if (k.toUpperCase() === 'forFuture'.toUpperCase()) {
                    if (((_d = order.datePlan) === null || _d === void 0 ? void 0 : _d.valueOf()) <= toDay)
                        return false;
                }
            }
            return true;
        }
        catch (e) {
            return false;
        }
    }
    containsWords(order, words) {
        var _a, _b;
        try {
            if (!words.length)
                return true;
            const comments = (_a = order === null || order === void 0 ? void 0 : order.data) === null || _a === void 0 ? void 0 : _a.comments;
            const extraData = (_b = order === null || order === void 0 ? void 0 : order.data) === null || _b === void 0 ? void 0 : _b.extraData;
            const fieldValues = [];
            for (const key in order) {
                if (Object.prototype.hasOwnProperty.call(order, key)) {
                    const element = order[key];
                    if (typeof element === 'string')
                        fieldValues.push(element);
                }
            }
            /** Поиск по комментариям */
            if (comments && (comments === null || comments === void 0 ? void 0 : comments.length)) {
                const txt = comments.map((c) => c.name + '_' + c.data).join('_').toUpperCase();
                fieldValues.push(txt);
            }
            /** Поиск по другим экстраданным */
            if (extraData && (extraData === null || extraData === void 0 ? void 0 : extraData.length)) {
                const txt = extraData.map((c) => c.name + '_' + c.data).join('_').toUpperCase();
                fieldValues.push(txt);
            }
            for (const word of words) {
                let check = false;
                for (const value of fieldValues) {
                    if (value.toUpperCase().includes(word.toUpperCase())) {
                        check = true;
                        break;
                    }
                }
                if (!check)
                    return false;
            }
            return true;
        }
        catch (e) {
            return false;
        }
    }
    refrash() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, Firebird_1.createItmDb)();
                try {
                    this.orders.splice(0, this.orders.length);
                    const dependensesDb = yield db.executeRequest('SELECT * FROM JOURNAL_DEP');
                    const ordersDb = yield db.executeRequest(this.getOrderQuery());
                    const users = yield (0, users_1.getAllUsers)();
                    const sectors = yield (0, virtualJournalsFun_1.getSectors)();
                    const statuses = yield this.getStatuses(db);
                    this.dependenses = dependensesDb.map(d => dtoConverter_1.default.convertDependenciesDbToDto(d));
                    this.orders = this.convertDbToDto(ordersDb, sectors, users, statuses);
                    this.orders = this.orders.sort((a, b) => {
                        var _a, _b;
                        const orderA = ((_a = (sectors.find(s => (s === null || s === void 0 ? void 0 : s.id) == a.sectorId))) === null || _a === void 0 ? void 0 : _a.orderBy) || 0;
                        const orderB = ((_b = (sectors.find(s => (s === null || s === void 0 ? void 0 : s.id) == b.sectorId))) === null || _b === void 0 ? void 0 : _b.orderBy) || 0;
                        if (orderA < orderB)
                            return -1;
                        if (orderA > orderB)
                            return 1;
                        return 0;
                    });
                    this.lastUpdate = Date.now();
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
    }
    isEmpty() {
        return !this.orders.length;
    }
    clear() {
        try {
            this.orders.splice(0, this.orders.length);
        }
        catch (e) {
            throw e;
        }
    }
    getStatuses(db) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.statuses.length)
                    return this.statuses;
                const statusesDb = yield db.executeRequest('SELECT * FROM JOURNAL_STATUSES S');
                const statuses = statusesDb.map(s => {
                    return {
                        id: s.ID, name: s.NAME, order: s.ORDER
                    };
                });
                this.statuses = [...statuses];
                return this.statuses;
            }
            catch (e) {
                throw e;
            }
        });
    }
    convertDbToDto(data, sectors, users, statuses) {
        try {
            const planOrders = data.map(d => {
                const status = statuses.find(s => s.id === d.ID_STATUS);
                const transfer = sectors.find(s => s.id === d.TRANSFER_ID);
                const accepted = sectors.find(s => s.id === d.ACCEPTED_ID);
                const location = sectors.find(s => s.id === d.LOCATION_ID);
                const accepdedEmployee = users.find(u => u.id === d.EMPLOYEE_ACCEPTED_ID);
                const transferEmployee = users.find(u => u.id === d.EMPLOYEE_TRANSFER_ID);
                const order = {
                    id: d.ID,
                    itmOrderNum: d.ITM_ORDERNUM,
                    fasadSquare: d.ORDER_FASADSQ || 0,
                    generalSquare: d.ORDER_GENERALSQ || 0,
                    statusOldNum: d.OLD_STATUS_NUM,
                    statusOldName: d.OLD_STATUS,
                    statusId: d.ID_STATUS,
                    status: (status === null || status === void 0 ? void 0 : status.name) || null,
                    client: d.CLIENT,
                    isProfiler: !!d.PROFILER,
                    isPrepaid: !!d.IS_PREPAID,
                    journalId: d.ID_JOURNAL,
                    journalNameId: d.ID_JOURNAL_NAMES,
                    transferDate: d.TRANSFER_DATE,
                    datePlan: d.DATE_PLAN,
                    sectorId: d.PLAN_SECTOR_ID,
                    sectorName: d.PLAN_SECTOR,
                    workerName: d.WORKER,
                    workingTime: 0,
                    transferSectorId: d.TRANSFER_ID,
                    accepdedSectorId: d.ACCEPTED_ID,
                    locationSectorId: d.LOCATION_ID,
                    transferEmployeeId: d.EMPLOYEE_TRANSFER_ID,
                    accepdedEmployeeId: d.EMPLOYEE_ACCEPTED_ID,
                    transferEmployee: (transferEmployee === null || transferEmployee === void 0 ? void 0 : transferEmployee.userName) || null,
                    accepdedEmployee: (accepdedEmployee === null || accepdedEmployee === void 0 ? void 0 : accepdedEmployee.userName) || null,
                    transferSector: (transfer === null || transfer === void 0 ? void 0 : transfer.name) || null,
                    accepdedSector: (accepted === null || accepted === void 0 ? void 0 : accepted.name) || null,
                    locationSector: (location === null || location === void 0 ? void 0 : location.name) || null,
                    data: {
                        comments: undefined
                    },
                };
                return order;
            });
            return planOrders;
        }
        catch (e) {
            throw e;
        }
    }
    getWorkTime(startDate) {
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
    }
    ;
    getArrayOfKeywords(str) {
        try {
            if (!str || str == '')
                throw ApiError_1.default.BadRequest("Нет данных.");
            const set = new Set();
            let filterStr = str.replace(/\s+/g, ' ').trim().toUpperCase();
            for (const k of this.keywords) {
                const regX = new RegExp(`${k.key.toUpperCase()}`, 'g');
                if (filterStr.match(regX)) {
                    set.add(k.value);
                    filterStr = filterStr.replace(regX, '').replace(/ +/g, ' ');
                }
            }
            const queryKeys = filterStr.replace(/,/g, " ").split(' ');
            return { queryKeys, keys: [...set] };
        }
        catch (e) {
            return {
                queryKeys: [],
                keys: []
            };
        }
    }
    getExtraDataQuery() {
        return `
            SELECT * FROM JOURNAL_DATA
        `;
    }
    getOrderQuery() {
        return `
            SELECT O.ID, O.ITM_ORDERNUM, O.ORDER_GENERALSQ, O.ORDER_FASADSQ, 
                O.ORDER_STATUS AS OLD_STATUS_NUM, O.CLIENT, O.PROFILER, O.IS_PREPAID,
                J.ID AS ID_JOURNAL, J.ID_JOURNAL_NAMES, J.TRANSFER_DATE,
                GET_STATUS_NAME_TO_NUM(O.ORDER_STATUS) AS OLD_STATUS,
                GET_JSTATUS_ID(O.ID) AS ID_STATUS,
                GET_SECTOR_ID_TO_OLD_SECTOR(P.DATE_DESCRIPTION) AS PLAN_SECTOR_ID,
                GET_SECTOR_NAME_TO_OLD_SECTOR(P.DATE_DESCRIPTION) AS PLAN_SECTOR,
                P.DATE_SECTOR AS WORKER, P.DATE3 AS DATE_PLAN,

                (SELECT FIRST 1 T.ID_SECTOR FROM JOURNAL_TRANS T WHERE T.ID_JOURNAL = J.ID AND T.MODIFER < 0) AS TRANSFER_ID,
                (SELECT FIRST 1 T.ID_SECTOR FROM JOURNAL_TRANS T WHERE T.ID_JOURNAL = J.ID AND T.MODIFER > 0) AS ACCEPTED_ID,

                (SELECT FIRST 1 T.ID_EMPLOYEE FROM JOURNAL_TRANS T WHERE T.ID_JOURNAL = J.ID AND T.MODIFER < 0) AS EMPLOYEE_TRANSFER_ID,
                (SELECT FIRST 1 T.ID_EMPLOYEE FROM JOURNAL_TRANS T WHERE T.ID_JOURNAL = J.ID AND T.MODIFER > 0) AS EMPLOYEE_ACCEPTED_ID,

                L.ID_SECTOR AS LOCATION_ID 
            FROM ORDERS_IN_PROGRESS O
                LEFT JOIN ORDERS_DATE_PLAN P ON (P.ORDER_ID = O.ID)
                LEFT JOIN JOURNALS J ON (J.ID_ORDER = O.ID AND EXISTS(
                    SELECT T2.ID FROM JOURNAL_TRANS T2  WHERE T2.ID_JOURNAL = J.ID AND 
                    T2.ID_SECTOR = GET_SECTOR_ID_TO_OLD_SECTOR(P.DATE_DESCRIPTION)
                ))
                LEFT JOIN LOCATION_ORDER L ON (L.ID_ORDER = O.ID AND L.ID_SECTOR = GET_SECTOR_ID_TO_OLD_SECTOR(P.DATE_DESCRIPTION))
                ORDER BY P.DATE3`;
        //LEFT JOIN LOCATION_ORDER L ON (L.ID_ORDER = O.ID AND L.ID_SECTOR = GET_SECTOR_ID_TO_OLD_SECTOR(P.DATE_DESCRIPTION)) - локация привязана к участку
    }
}
exports.OrderPlanSystem = OrderPlanSystem;
