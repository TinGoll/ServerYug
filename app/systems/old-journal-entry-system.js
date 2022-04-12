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
exports.OldJournalEntry = void 0;
const Firebird_1 = require("../firebird/Firebird");
const date_format_parse_1 = require("date-format-parse");
const adopted_order_service_1 = __importDefault(require("../services/adopted-order-service"));
const extra_data_system_1 = require("./extra-data-system");
class OldJournalEntry {
    constructor() {
        this.sectors = [];
        this.statuses = [];
        if (OldJournalEntry.instance) {
            return OldJournalEntry.instance;
        }
        OldJournalEntry.instance = this;
    }
    push(tramsferOrders, atOrders, extraData, dependencies) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!dependencies.length)
                    return;
                switch ((_a = dependencies[0]) === null || _a === void 0 ? void 0 : _a.journalNameId) {
                    case 1:
                        break;
                    case 2:
                        break;
                    case 3:
                        break;
                    case 4:
                        /** Журнал упаковки/отгрузки */
                        yield this.pushToJournalPacking(tramsferOrders, extraData, dependencies);
                        break;
                    default:
                        break;
                }
            }
            catch (e) {
                console.log('Ошибка добавления заказа в старый журнал:', e);
            }
        });
    }
    pushOld() {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, Firebird_1.createItmDb)();
                try {
                    const adopedAll = yield adopted_order_service_1.default.getAdoptedOrders(4, [4], {
                        limit: 500
                    });
                    const adoped = {
                        orders: adopedAll.orders.filter(a => {
                            //console.log(a.accepted);
                            return a.accepted === 'Отгрузка';
                        }),
                        count: 0,
                        pages: 0
                    };
                    const extraData = [];
                    const dependencies = [{
                            accepted: 0, journalNameId: 0, id: 0, startStage: false, statusAfterOldId: 0, transfer: 0, statusAfterId: 8
                        }];
                    const orders = {
                        idTransfer: "",
                        idAccepted: "",
                        date: new Date(),
                        orders: [],
                        extraData: []
                    };
                    for (const torder of adoped.orders) {
                        const element = {
                            idOrder: torder.id,
                            comment: "",
                            completed: true
                        };
                        orders.orders.push(element);
                        const comments = !((_a = torder.data) === null || _a === void 0 ? void 0 : _a.comments) ? [] : (_b = torder.data.comments) === null || _b === void 0 ? void 0 : _b.map(c => {
                            const comm = {
                                orderId: c.orderId,
                                journalId: c.journalId,
                                group: "",
                                type: "",
                                name: c.name,
                                list: [],
                                data: c.data
                            };
                            return comm;
                        });
                        const other = !((_c = torder.data) === null || _c === void 0 ? void 0 : _c.extraData) ? [] : (_d = torder.data.extraData) === null || _d === void 0 ? void 0 : _d.map(c => {
                            const comm = {
                                orderId: c.orderId,
                                journalId: c.journalId,
                                group: "",
                                type: "",
                                name: c.name,
                                list: [],
                                data: c.data
                            };
                            return comm;
                        });
                        const edata = [...comments, ...other];
                        for (const d of edata) {
                            extraData.push(d);
                        }
                    }
                    //console.log(orders);
                    yield this.pushToJournalPacking(orders, extraData, dependencies);
                }
                catch (e) {
                    throw e;
                }
                finally {
                    db.detach();
                }
            }
            catch (e) {
                console.log('Ошибка добавления старых заказов в упаковку', e);
            }
        });
    }
    pushToJournalPacking(tramsferOrders, extraData, dependencies) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, Firebird_1.createItmDb)();
                try {
                    if (((_a = dependencies[0]) === null || _a === void 0 ? void 0 : _a.statusAfterId) === 7) {
                        const complitedUpack = yield db.executeRequest(`
                        SELECT J.ORDER_ID AS ID FROM JOURNAL_UPACK J WHERE J.ORDER_ID IN (${tramsferOrders.orders.map(o => o.idOrder).join(',')})
                    `);
                        /** Проверяем внесен ли в журнал, если да, то отменяем внесение */
                        for (const torder of tramsferOrders.orders) {
                            const id = complitedUpack.find(o => o.ID === torder.idOrder);
                            if (id)
                                torder.completed = false;
                        }
                        for (const torder of tramsferOrders.orders) {
                            if (torder.completed) {
                                const edata = extraData.filter(e => e.orderId === torder.idOrder);
                                const box = edata.find(e => { var _a; return ((_a = e.name) === null || _a === void 0 ? void 0 : _a.toUpperCase()) == extra_data_system_1.ExtraDataName.COUNT_BOX.toUpperCase(); });
                                const timePack = edata.find(e => { var _a; return ((_a = e.name) === null || _a === void 0 ? void 0 : _a.toUpperCase()) == extra_data_system_1.ExtraDataName.TIME_PACKING.toUpperCase(); });
                                const comments = edata.filter(e => { var _a; return ((_a = e.name) === null || _a === void 0 ? void 0 : _a.toUpperCase()) == extra_data_system_1.ExtraDataName.COMMENT.toUpperCase(); });
                                const DatePack = (timePack === null || timePack === void 0 ? void 0 : timePack.data) ? new Date(timePack === null || timePack === void 0 ? void 0 : timePack.data) : new Date();
                                const countBox = Number(box === null || box === void 0 ? void 0 : box.data);
                                const upackQuery = `INSERT INTO JOURNAL_UPACK (ORDER_ID, TIME_PACK, BOX_COUNT, COMMENT, PACK_TYPE, DELAY, TS, DATE_PACK)
                                        VALUES (${torder.idOrder}, '${(0, date_format_parse_1.format)(DatePack, 'HH:mm')}', ${countBox || 0}, '${comments.map(c => c.data).join(', ')}', 'Полностью', 0, CURRENT_TIMESTAMP, '${(0, date_format_parse_1.format)(DatePack, 'DD.MM.YYYY')}')`;
                                db.execute(upackQuery);
                                console.log(torder.idOrder, 'Добавлен в журнал упаковки');
                            }
                        }
                    }
                    if (((_b = dependencies[0]) === null || _b === void 0 ? void 0 : _b.statusAfterId) === 8) {
                        const complitedOut = yield db.executeRequest(`
                        SELECT J.ORDER_ID AS ID FROM JOURNAL_OUT J WHERE J.ORDER_ID IN (${tramsferOrders.orders.map(o => o.idOrder).join(',')})
                    `);
                        /** Проверяем внесен ли в журнал, если да, то отменяем внесение */
                        for (const torder of tramsferOrders.orders) {
                            const id = complitedOut.find(o => o.ID === torder.idOrder);
                            if (id)
                                torder.completed = false;
                        }
                        for (const torder of tramsferOrders.orders) {
                            if (torder.completed) {
                                const edata = extraData.filter(e => e.orderId === torder.idOrder);
                                const box = edata.find(e => { var _a; return ((_a = e.name) === null || _a === void 0 ? void 0 : _a.toUpperCase()) == extra_data_system_1.ExtraDataName.COUNT_BOX.toUpperCase(); });
                                const timeOut = edata.find(e => { var _a; return ((_a = e.name) === null || _a === void 0 ? void 0 : _a.toUpperCase()) == extra_data_system_1.ExtraDataName.DATE_OUT.toUpperCase(); });
                                const driver = edata.find(e => { var _a; return ((_a = e.name) === null || _a === void 0 ? void 0 : _a.toUpperCase()) == extra_data_system_1.ExtraDataName.DRIVER.toUpperCase(); });
                                const comments = edata.filter(e => { var _a; return ((_a = e.name) === null || _a === void 0 ? void 0 : _a.toUpperCase()) === extra_data_system_1.ExtraDataName.COMMENT.toUpperCase(); });
                                const DateOut = (timeOut === null || timeOut === void 0 ? void 0 : timeOut.data) ? new Date(timeOut === null || timeOut === void 0 ? void 0 : timeOut.data) : new Date();
                                const countBox = Number(box === null || box === void 0 ? void 0 : box.data);
                                db.execute(`INSERT INTO JOURNAL_OUT (ORDER_ID, DRIVER_NAME, PACK_TYPE, BOX_COUNT, COMMENT, TIME_STAMP, FACT_DATE_OUT)
                                        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, '${(0, date_format_parse_1.format)(DateOut, 'DD.MM.YYYY')}')`, [
                                    torder.idOrder,
                                    (driver === null || driver === void 0 ? void 0 : driver.data) || null,
                                    'Полностью',
                                    countBox || 0,
                                    comments.map(c => c.data).join(', ')
                                ]);
                                console.log(torder.idOrder, 'Добавлен в журнал отгрузки');
                            }
                        }
                    }
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
    getStatuses() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, Firebird_1.createItmDb)();
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
                finally {
                    db.detach();
                }
            }
            catch (e) {
                throw e;
            }
        });
    }
}
exports.OldJournalEntry = OldJournalEntry;
