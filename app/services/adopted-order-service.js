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
const ApiError_1 = __importDefault(require("../exceptions/ApiError"));
const Firebird_1 = require("../firebird/Firebird");
const date_format_parse_1 = require("date-format-parse");
const adopted_order_system_1 = require("../systems/adopted-order-system");
const search_keywords_1 = require("../systems/search-keywords");
const extra_data_system_1 = __importStar(require("../systems/extra-data-system"));
const dtoConverter_1 = __importDefault(require("../systems/dtoConverter"));
class AdoptedOrderService {
    constructor() {
        this.defaultLimit = 50; // Лимит по умолчанию.
        this.updateTime = 20; // Минуты
        /**
         *  1	На сборке
            2	На шлифовке
            3	Покраска этап №1
            4	Патина этап №2
            5	Лак этап №3
            6	В упаковке
            7	Упакован
            8	Отгружен
    
         */
        this.keywords = search_keywords_1.orderKeywords;
    }
    getAdoptedOrders(httpQueryId, journalNamesId, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, Firebird_1.createItmDb)();
                try {
                    let isUpdate = true;
                    const hashData = (0, adopted_order_system_1.getAdoptedQueryHash)(httpQueryId);
                    const extraDataSystem = new extra_data_system_1.default();
                    const extraData = yield extraDataSystem.getAll();
                    let newHashData;
                    if (hashData && (hashData === null || hashData === void 0 ? void 0 : hashData.time) + (this.updateTime * 60 * 1000) > Date.now()) {
                        isUpdate = false;
                        newHashData = hashData;
                    }
                    else {
                        newHashData = {
                            httpQueryId: httpQueryId,
                            noFiltredorders: [],
                            time: Date.now()
                        };
                    }
                    if (isUpdate) {
                        if (!(journalNamesId === null || journalNamesId === void 0 ? void 0 : journalNamesId.length))
                            throw ApiError_1.default.BadRequest("Нет журналов для отображения.");
                        const dependensesDb = yield db.executeRequest('SELECT * FROM JOURNAL_DEP');
                        const dependenses = dependensesDb.map(d => dtoConverter_1.default.convertDependenciesDbToDto(d));
                        const sectorDeps = dependenses
                            .filter(d => {
                            const jd = journalNamesId.find(j => j == d.journalNameId);
                            return jd;
                        })
                            .map(d => d.transfer);
                        const queryOrders = `SELECT O.ID, J.ID AS JOURNAL_ID, J.ID_JOURNAL_NAMES, O.ITM_ORDERNUM, O.CLIENT, O.MANAGER, O.ORDER_FASADSQ,
                                                J.TRANSFER_DATE,
                                                GET_STATUS_NAME(GET_JSTATUS_ID(O.ID)) AS STATUS,
                                                GET_JSTATUS_ID(O.ID) AS STATUS_ID,
                                                GET_EMP_NAME(T.ID_EMPLOYEE) AS EMPLOYEE,
                                                GET_SECTOR_NAME(T.ID_SECTOR) AS SECTOR,
                                                T.ID_EMPLOYEE,
                                                T.ID_SECTOR,
                                                T.MODIFER,
                                                J.TS

                                        FROM JOURNALS J
                                        LEFT JOIN JOURNAL_TRANS T ON (T.ID_JOURNAL = J.ID)
                                        LEFT JOIN ORDERS O ON (O.ID = J.ID_ORDER)
                                        WHERE EXISTS(
                                            SELECT *
                                            FROM JOURNAL_TRANS
                                            WHERE ID_SECTOR IN (${[...new Set(sectorDeps)].join(',')}) AND ID_JOURNAL = J.ID
                                        )
                                        ORDER BY J.TRANSFER_DATE desc`;
                        const ordersDb = yield db.executeRequest(queryOrders);
                        const transferOrders = ordersDb.map(order => this.convertAdoptedOrderDbToDto(order));
                        const noFiltredorders = transferOrders
                            .filter(order => {
                            const jId = journalNamesId.find(j => j == order.journalNamesId);
                            return jId && order.modifer < 0;
                        })
                            .map(order => {
                            const accepted = transferOrders.find(o => o.journalId == order.journalId && o.modifer > 0);
                            /***  */
                            const transferedJournalEntry = transferOrders.find(o => {
                                return o.sectorId == order.sectorId && o.modifer > 0;
                            });
                            const transfered = transferOrders.find(order => order.journalId == (transferedJournalEntry === null || transferedJournalEntry === void 0 ? void 0 : transferedJournalEntry.journalId) && order.modifer < 0);
                            const o = {
                                id: order.id,
                                journalId: order.journalId,
                                itmOrderNum: order.itmOrderNum,
                                transfer: order.sector || 'Не определен',
                                employeeTransfer: order.employee || 'Не определен',
                                client: order.client,
                                manager: order.manager,
                                accepted: (accepted === null || accepted === void 0 ? void 0 : accepted.sector) || 'Не определен',
                                employeeAccepted: (accepted === null || accepted === void 0 ? void 0 : accepted.employee) || 'Не определен',
                                statusOld: "Не используется",
                                status: order.status || 'Не определен',
                                statusId: order.statusId,
                                fasadSquare: order.fasadSquare || 0,
                                date: order.transferDate,
                                workTime: this.getWorkTime(transfered === null || transfered === void 0 ? void 0 : transfered.transferDate, order.transferDate),
                                transfered: (transfered === null || transfered === void 0 ? void 0 : transfered.sector) || undefined,
                                transferedData: (transfered === null || transfered === void 0 ? void 0 : transfered.transferDate) || undefined,
                                data: {
                                    comments: undefined,
                                    extraData: undefined
                                },
                            };
                            return o;
                        });
                        newHashData.noFiltredorders = noFiltredorders;
                        (0, adopted_order_system_1.setAdoptedQueryHash)(Object.assign({}, newHashData));
                    }
                    if (!(newHashData === null || newHashData === void 0 ? void 0 : newHashData.noFiltredorders.length)) {
                        (0, adopted_order_system_1.clearAdoptedQueryHash)(httpQueryId);
                        return { orders: [], count: 0, pages: 0 };
                    }
                    const limit = (options === null || options === void 0 ? void 0 : options.limit) || this.defaultLimit;
                    const page = (options === null || options === void 0 ? void 0 : options.page) || 1;
                    const filtredOrders = this.insertExtraData(this.searchEngine(newHashData === null || newHashData === void 0 ? void 0 : newHashData.noFiltredorders, options), extraData);
                    const count = filtredOrders.length;
                    const pageCount = filtredOrders.length ? Math.ceil(count / limit) : 1;
                    const pages = pageCount <= 0 ? 1 : pageCount;
                    const orders = filtredOrders.slice((page - 1 < 0 ? 0 : page - 1) * limit, (limit * (page < 0 ? 1 : page)));
                    return { orders, count: count, pages };
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
    convertAdoptedOrderDbToDto(data) {
        const result = {
            id: data.ID,
            journalId: data.JOURNAL_ID,
            itmOrderNum: data.ITM_ORDERNUM,
            client: data.CLIENT,
            manager: data.MANAGER,
            fasadSquare: data.ORDER_FASADSQ || 0,
            transferDate: data.TRANSFER_DATE,
            status: data.STATUS || '',
            statusId: data.STATUS_ID,
            employee: data.EMPLOYEE,
            sector: data.SECTOR,
            employeeId: data.ID_EMPLOYEE,
            sectorId: data.ID_SECTOR,
            modifer: data.MODIFER,
            ts: data.TS,
            journalNamesId: data.ID_JOURNAL_NAMES
        };
        return result;
    }
    insertExtraData(orders, extraData) {
        try {
            for (const order of orders) {
                const comments = extraData.filter(d => { var _a; return ((_a = d.name) === null || _a === void 0 ? void 0 : _a.toUpperCase()) == extra_data_system_1.ExtraDataName.COMMENT.toUpperCase() && d.orderId == order.id; });
                const otherData = extraData.filter(d => { var _a; return d.journalId == order.journalId && ((_a = d.name) === null || _a === void 0 ? void 0 : _a.toUpperCase()) != extra_data_system_1.ExtraDataName.COMMENT.toUpperCase(); });
                if (order.id == 8586) {
                    console.log(extraData.filter(d => d.orderId == 8586));
                }
                order.data.comments = comments;
                order.data.extraData = otherData;
            }
            return orders;
        }
        catch (e) {
            throw e;
        }
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
            if (!queryKeys.length && !dateFirst && !dateSecond) {
                return orders;
            }
            const filteredArray = orders.filter(o => {
                var _a, _b, _c, _d;
                const date = o.date && o.date instanceof Date ? new Date(o.date.getFullYear(), o.date.getMonth(), o.date.getDate()).valueOf() : undefined;
                if (date && dateFirst)
                    if (!(date >= dateFirst.valueOf()))
                        return false;
                if (date && dateSecond)
                    if (!(date <= dateSecond.valueOf()))
                        return false;
                for (const k of keys) {
                    if (k.toUpperCase() === 'Упакован'.toUpperCase() && o.statusId !== 7)
                        return false;
                    if (k.toUpperCase() === 'Отгружен'.toUpperCase() && o.statusId !== 8)
                        return false;
                    if (k.toUpperCase() === 'На сборке'.toUpperCase() && o.statusId !== 1)
                        return false;
                    if (k.toUpperCase() === 'На шлифовке'.toUpperCase() && o.statusId !== 2)
                        return false;
                    if (k.toUpperCase() === 'Покраска этап №1'.toUpperCase() && o.statusId !== 3)
                        return false;
                    if (k.toUpperCase() === 'Патина этап №2'.toUpperCase() && o.statusId !== 4)
                        return false;
                    if (k.toUpperCase() === 'Лак этап №3'.toUpperCase() && o.statusId !== 5)
                        return false;
                    if (k.toUpperCase() === 'В упаковке'.toUpperCase() && o.statusId !== 6)
                        return false;
                }
                const str = `${o.itmOrderNum}_${o.manager}_${o.transfer}_${o.accepted}_${o.client}
                    _${o.employeeTransfer || ''}_${o.employeeAccepted || ''}
                    _${o.status || ''}_${o.statusOld || ''}_${o.fasadSquare}_${(0, date_format_parse_1.format)(o.date, 'DD.MM.YYYY')}
                    _${((_b = (_a = o.data) === null || _a === void 0 ? void 0 : _a.comments) === null || _b === void 0 ? void 0 : _b.map(c => c.data).join('_')) || ''}
                    _${((_d = (_c = o.data) === null || _c === void 0 ? void 0 : _c.extraData) === null || _d === void 0 ? void 0 : _d.map(e => e.data).join('_')) || ''}`.toUpperCase();
                for (const k of queryKeys)
                    if (!str.includes(k.toUpperCase()))
                        return false;
                return true;
            });
            return filteredArray;
        }
        catch (e) {
            throw e;
        }
    }
    getArrayOfKeywords(str) {
        try {
            if (!str || str == '')
                throw ApiError_1.default.BadRequest("Нет данных.");
            const keys = [];
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
    getWorkTime(startDate, endDate) {
        //console.log(startDate, endDate);
        if (!startDate || !endDate)
            return 0;
        const oneDayMS = (24 * 60 * 60 * 1000);
        const nowMS = endDate.valueOf();
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
        //console.log(res);
        return (res < 0 ? 0 : res);
    }
    ;
}
exports.default = new AdoptedOrderService();
