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
exports.createExtraData = exports.deleteItemInListExtraData = exports.addItemInListExtraData = exports.getListExtradataToName = exports.getParametersExtraPack = void 0;
const dataBase_1 = __importDefault(require("../dataBase"));
const Firebird_1 = require("../firebird/Firebird");
const ApiError_1 = __importDefault(require("../exceptions/ApiError"));
//const _     = require('lodash');
const getParametersExtraPack = (barcodeTransfer, barcodeAccepted) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
                group: d.DATA_GROUP || undefined,
                type: d.DATA_TYPE || undefined,
                name: d.DATA_NAME || undefined,
                list: [],
                data: d.DATA_VALUE || undefined,
            };
            const list = yield (0, exports.getListExtradataToName)(data.name);
            data.list = list;
            extraData.push(data);
        }
        return extraData;
    }
    catch (e) {
        throw e;
    }
});
exports.getParametersExtraPack = getParametersExtraPack;
const getListExtradataToName = (name) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // as DATA - обязательно.
        const list = [];
        const db = yield (0, Firebird_1.createItmDb)();
        const res = yield db.executeRequest(`SELECT * FROM JOURNAL_EXTRA_DATA_LISTS D WHERE UPPER(D.LIST_NAME) = UPPER(?)`, [name]);
        db.detach();
        const sortedArr = res.sort((a, b) => {
            const dataA = a === null || a === void 0 ? void 0 : a.LIST_DATA;
            const dataB = b === null || b === void 0 ? void 0 : b.LIST_DATA;
            return dataA === null || dataA === void 0 ? void 0 : dataA.localeCompare(dataB);
        });
        for (const d of sortedArr) {
            list.push(d.LIST_DATA);
        }
        return list;
    }
    catch (e) {
        throw e;
    }
});
exports.getListExtradataToName = getListExtradataToName;
/** Добавление нового парамметра */
const addItemInListExtraData = (listName, item) => __awaiter(void 0, void 0, void 0, function* () {
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
exports.addItemInListExtraData = addItemInListExtraData;
const deleteItemInListExtraData = (listName, item) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield (0, Firebird_1.createItmDb)();
        const candidate = yield db.executeAndReturning('DELETE JOURNAL_EXTRA_DATA_LISTS D WHERE UPPER(D.LIST_NAME) = UPPER(?) AND UPPER(D.LIST_DATA) = UPPER(?) RETURNING ID;', [listName, item]);
        db.detach();
        if (!candidate.ID)
            ApiError_1.default.BadRequest(`Запись ${listName} - ${item} не найдена в базе данных.`);
    }
    catch (e) {
        throw e;
    }
});
exports.deleteItemInListExtraData = deleteItemInListExtraData;
const createExtraData = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
    }
    catch (e) {
        throw e;
    }
});
exports.createExtraData = createExtraData;
const setExtraData = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!data.length)
            return 0;
        const query = `EXECUTE BLOCK RETURNS (AMOUNT INTEGER) AS DECLARE VARIABLE C INTEGER = 0; BEGIN\n${data.map(d => {
            const txt = ((d === null || d === void 0 ? void 0 : d.journalId) && (d === null || d === void 0 ? void 0 : d.group) && (d === null || d === void 0 ? void 0 : d.name) && (d === null || d === void 0 ? void 0 : d.data)) ?
                `INSERT INTO JOURNAL_DATA (ID_ORDER, ID_JOURNAL, DATA_GROUP, DATA_NAME, DATA_VALUE, DATA_TYPE) values (${(d === null || d === void 0 ? void 0 : d.orderId) || null}, ${d === null || d === void 0 ? void 0 : d.journalId}, '${d === null || d === void 0 ? void 0 : d.group}', '${d === null || d === void 0 ? void 0 : d.name}', '${d === null || d === void 0 ? void 0 : d.data}', '${d.type}'); :C = :C+1;\n`
                : '';
            return txt;
        }).join('')}:AMOUNT = :C; SUSPEND; END;`;
        const [res] = (yield dataBase_1.default.executeRequest(query));
        return res === null || res === void 0 ? void 0 : res.AMOUNT;
    }
    catch (e) {
        throw new Error('Ошибка установки дополнительных параметров');
    }
});
exports.default = setExtraData;
