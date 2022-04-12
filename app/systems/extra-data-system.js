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
exports.CommitActoin = exports.ExtraDataGroup = exports.ExtraDataName = void 0;
const extra_data_enums_1 = require("../enums/extra-data-enums");
const ApiError_1 = __importDefault(require("../exceptions/ApiError"));
const Firebird_1 = require("../firebird/Firebird");
const user_system_1 = __importDefault(require("./user-system"));
const virtualJournalsFun_1 = require("./virtualJournalsFun");
const events_1 = require("events");
var ExtraDataName;
(function (ExtraDataName) {
    ExtraDataName["COMMENT"] = "\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439";
    ExtraDataName["DRIVER"] = "\u0412\u043E\u0434\u0438\u0442\u0435\u043B\u044C";
    ExtraDataName["DATE_OUT"] = "\u0414\u0430\u0442\u0430 \u043E\u0442\u0433\u0440\u0443\u0437\u043A\u0438";
    ExtraDataName["TIME_PACKING"] = "\u0412\u0440\u0435\u043C\u044F \u0443\u043F\u0430\u043A\u043E\u0432\u043A\u0438";
    ExtraDataName["COUNT_BOX"] = "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0443\u043F\u0430\u043A\u043E\u0432\u043E\u043A";
})(ExtraDataName = exports.ExtraDataName || (exports.ExtraDataName = {}));
var ExtraDataGroup;
(function (ExtraDataGroup) {
    ExtraDataGroup["COMMENTS"] = "Comment";
    ExtraDataGroup["PACKING_DATA"] = "packing data";
    ExtraDataGroup["OUT_DATA"] = "out data";
})(ExtraDataGroup = exports.ExtraDataGroup || (exports.ExtraDataGroup = {}));
var CommitActoin;
(function (CommitActoin) {
    CommitActoin["NEW"] = "NEW";
    CommitActoin["DELETE"] = "DELETE";
    CommitActoin["EDIT"] = "EDIT";
})(CommitActoin = exports.CommitActoin || (exports.CommitActoin = {}));
class ExtraDataSystem {
    constructor() {
        this.elementList = [];
        this.extraDataList = [];
        if (ExtraDataSystem.instance) {
            const emmiter = new events_1.EventEmitter();
            this.emmiter = emmiter;
            return ExtraDataSystem.instance;
        }
        ExtraDataSystem.instance = this;
    }
    getEmmiter() {
        if (!this.emmiter)
            this.emmiter = new events_1.EventEmitter();
        this.emmiter.setMaxListeners(1000);
        return this.emmiter;
    }
    commit(action, payload) {
        try {
            const emmiter = this.getEmmiter();
            emmiter.emit('CommentAction', {
                action,
                payload
            });
        }
        catch (e) {
            throw e;
        }
    }
    getParametersExtraPack(barcodeTransfer, barcodeAccepted) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, Firebird_1.createItmDb)();
                const [transfer, accepted] = (_a = (yield db.executeRequest(`SELECT B.ID_SECTOR AS ID FROM SECTORS_BARCODE B WHERE B.BARCODE IN ('${barcodeTransfer}', '${barcodeAccepted}')`))) === null || _a === void 0 ? void 0 : _a.map(s => { return s.ID; });
                if (!transfer || !accepted)
                    throw new Error('Один из штрихкодов не определен или заблокирован.');
                const query = `SELECT E.DATA_GROUP, E.DATA_NAME, E.DATA_VALUE, E.DATA_TYPE FROM JOURNAL_EXTRA_PACK E
                           LEFT JOIN JOURNAL_DEP D ON (E.DEP_ID = D.ID)
                           WHERE D.ID_SECTOR_TRANSFER = ${transfer} AND D.ID_SECTOR_ACCEPTED = ${accepted}`;
                const result = yield db.executeRequest(query);
                db.detach();
                const extraData = [];
                if (!result.length)
                    return extraData;
                for (const d of result) {
                    const data = {
                        orderId: 0,
                        journalId: 0,
                        group: d.DATA_GROUP,
                        type: d.DATA_TYPE,
                        name: d.DATA_NAME,
                        list: [],
                        data: d.DATA_VALUE
                    };
                    const list = yield this.getListExtradataToName(data.name);
                    data.list = list;
                    extraData.push(data);
                }
                return extraData;
            }
            catch (e) {
                throw e;
            }
        });
    }
    getListExtradataToName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.extraDataList.length)
                    yield this.refrashListExtradataToName();
                const list = this.extraDataList
                    .filter(d => d.name.toUpperCase() == name.toUpperCase())
                    .sort((a, b) => {
                    const dataA = a === null || a === void 0 ? void 0 : a.value;
                    const dataB = b === null || b === void 0 ? void 0 : b.value;
                    return dataA === null || dataA === void 0 ? void 0 : dataA.localeCompare(dataB);
                })
                    .map(d => d.value);
                return list;
            }
            catch (e) {
                throw e;
            }
        });
    }
    refrashListExtradataToName() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, Firebird_1.createItmDb)();
                try {
                    const dataDb = yield db.executeRequest('SELECT * FROM JOURNAL_EXTRA_DATA_LISTS');
                    const list = dataDb.map(d => {
                        const data = {
                            id: d.ID,
                            name: d.LIST_NAME,
                            value: d.LIST_DATA
                        };
                        return data;
                    });
                    this.extraDataList = [...list];
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
    deleteItemInListExtraData(listName, item) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, Firebird_1.createItmDb)();
                const candidate = yield db.executeAndReturning('DELETE JOURNAL_EXTRA_DATA_LISTS D WHERE UPPER(D.LIST_NAME) = UPPER(?) AND UPPER(D.LIST_DATA) = UPPER(?) RETURNING ID;', [listName, item]);
                db.detach();
                if (!candidate.ID)
                    ApiError_1.default.BadRequest(`Запись ${listName} - ${item} не найдена в базе данных.`);
                return candidate.ID;
            }
            catch (e) {
                throw e;
            }
        });
    }
    addItemInListExtraData(listName, item) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, Firebird_1.createItmDb)();
                const [candidate] = yield db.executeRequest('SELECT * FROM JOURNAL_EXTRA_DATA_LISTS D WHERE UPPER(D.LIST_NAME) = UPPER(?) AND UPPER(D.LIST_DATA) = UPPER(?)', [listName, item]);
                if (candidate.ID) {
                    db.detach();
                    throw ApiError_1.default.BadRequest(`${listName} - ${item}, уже существует в списке.`);
                }
                yield db.execute(`INSERT INTO JOURNAL_EXTRA_DATA_LISTS (LIST_NAME, LIST_DATA) VALUES(?, ?)`, [listName.trim(), item.trim()]);
                db.detach();
            }
            catch (e) {
                throw e;
            }
        });
    }
    /*** Комменты */
    getCommentToId(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.getAll();
                const comment = data.find(d => { var _a; return ((_a = d.name) === null || _a === void 0 ? void 0 : _a.toUpperCase()) == ExtraDataName.COMMENT.toUpperCase() && d.id == id; });
                if (!comment)
                    return null;
                return comment;
            }
            catch (e) {
                throw e;
            }
        });
    }
    getCommentsToOrderId(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.getAll();
                const comments = data.filter(d => { var _a; return ((_a = d.name) === null || _a === void 0 ? void 0 : _a.toUpperCase()) == ExtraDataName.COMMENT.toUpperCase() && d.orderId == id; });
                return comments;
            }
            catch (e) {
                throw e;
            }
        });
    }
    addCommentToOrder(orderId, item) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                item.name = ExtraDataName.COMMENT;
                item.orderId = orderId;
                item.type = extra_data_enums_1.ExtraDataType.TEXT;
                item.group = ExtraDataGroup.COMMENTS;
                const comment = yield this.add(item);
                const emmiter = this.getEmmiter();
                this.commit(CommitActoin.NEW, comment);
                return comment;
            }
            catch (e) {
                throw e;
            }
        });
    }
    editComment(element) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.edit(element);
                this.commit(CommitActoin.EDIT, data);
                return data;
            }
            catch (e) {
                throw e;
            }
        });
    }
    deleteCommentToId(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.get(id);
                if (!data)
                    return null;
                const deleted = yield this.delete(data);
                this.commit(CommitActoin.DELETE, data);
                return deleted;
            }
            catch (e) {
                throw e;
            }
        });
    }
    edit(element) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, Firebird_1.createItmDb)();
                try {
                    if (!this.elementList.length)
                        yield this.refrash();
                    const index = this.elementList.findIndex(d => d.id == element.id);
                    if (index < 0)
                        throw ApiError_1.default.BadRequest("Элемент не найден.");
                    const dbdata = ExtraDataSystem.convertDtoToDb(element);
                    yield db.execute(`UPDATE JOURNAL_DATA D SET D.DATA_VALUE = ? WHERE D.ID = ?`, [dbdata.DATA_VALUE, dbdata.ID]);
                    const editElement = this.elementList[index];
                    if (editElement)
                        editElement.data = element.data;
                    return element;
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
    addToArray(items) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, Firebird_1.createItmDb)();
                const errors = [];
                const userSystem = new user_system_1.default();
                const users = yield userSystem.getAll();
                const sectors = yield (0, virtualJournalsFun_1.getSectors)();
                try {
                    for (const item of items) {
                        const dbdata = ExtraDataSystem.convertDtoToDb(item);
                        try {
                            const newEntry = yield db.executeAndReturning(`INSERT INTO JOURNAL_DATA (ID_JOURNAL, ID_SECTOR, ID_ORDER, ID_EMPLOYEE, DATA_GROUP, DATA_NAME, DATA_VALUE, DATA_TYPE)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING ID, TS`, [dbdata.ID_JOURNAL, dbdata.ID_SECTOR, dbdata.ID_ORDER, dbdata.ID_EMPLOYEE,
                                dbdata.DATA_GROUP, dbdata.DATA_NAME, dbdata.DATA_VALUE, dbdata.DATA_TYPE]);
                            if (!newEntry.ID)
                                throw ApiError_1.default.BadRequest("Ошибка записи extra data в базу данных.");
                            item.id = newEntry.ID;
                            item.ts = newEntry.TS;
                            item.userName = (_a = (users.find(u => u.id == item.employeeId))) === null || _a === void 0 ? void 0 : _a.userName;
                            item.sector = (_b = (sectors.find(s => s.id == item.sectorId))) === null || _b === void 0 ? void 0 : _b.name;
                            this.elementList.push(item);
                        }
                        catch (e) {
                            errors.push(e.message);
                            continue;
                        }
                    }
                    if (errors.length)
                        throw ApiError_1.default.BadRequest("Ошибка добавления дополнительных параметров", errors);
                    return items;
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
    add(item) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [newitem] = yield this.addToArray([item]);
                return newitem;
            }
            catch (e) {
                throw e;
            }
        });
    }
    get(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.isEmpty())
                    yield this.refrash();
                const data = this.elementList.find(d => d.id == id);
                if (!data)
                    return null;
                return data;
            }
            catch (e) {
                throw e;
            }
        });
    }
    getAll(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.isEmpty())
                    yield this.refrash();
                return this.elementList;
            }
            catch (e) {
                throw e;
            }
        });
    }
    isEmpty() {
        return !this.elementList.length;
    }
    clear() {
        try {
            this.elementList.splice(0, this.elementList.length);
        }
        catch (e) {
            throw e;
        }
    }
    delete(element) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, Firebird_1.createItmDb)();
                try {
                    const deletedEntry = yield db.executeAndReturning(`DELETE FROM JOURNAL_DATA D WHERE D.ID = ? RETURNING ID`, [element.id]);
                    const index = this.elementList.findIndex(d => d.id == deletedEntry.ID);
                    if (index >= 0)
                        this.elementList.splice(index, 1);
                    return deletedEntry.ID || null;
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
    refrash() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, Firebird_1.createItmDb)();
                try {
                    const dataDb = yield db.executeRequest(`SELECT * FROM EXTRA_DATA_VIEW`);
                    const data = dataDb.map(d => ExtraDataSystem.convertDbToDto(d));
                    this.elementList = [...data];
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
    static convertDbToDto(data) {
        const res = {
            id: data.ID || undefined,
            journalId: data.ID_JOURNAL || undefined,
            sectorId: data.ID_SECTOR || undefined,
            orderId: data.ID_ORDER || undefined,
            employeeId: data.ID_EMPLOYEE || undefined,
            group: data.DATA_GROUP || undefined,
            name: data.DATA_NAME || undefined,
            data: data.DATA_VALUE || undefined,
            type: data.DATA_TYPE || undefined,
            userName: data.EMPLOYEE || undefined,
            sector: data.SECTOR || undefined,
            ts: data.TS || undefined,
        };
        return res;
    }
    static convertDtoToDb(data) {
        const res = {
            ID: data.id || null,
            ID_JOURNAL: data.journalId || null,
            ID_SECTOR: data.sectorId || null,
            ID_ORDER: data.orderId || null,
            ID_EMPLOYEE: data.employeeId || null,
            DATA_GROUP: data.group || null,
            DATA_NAME: data.name || null,
            DATA_VALUE: data.data || null,
            DATA_TYPE: data.type || null,
            TS: data.ts || null
        };
        return res;
    }
}
exports.default = ExtraDataSystem;
