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
const ApiError_1 = __importDefault(require("../exceptions/ApiError"));
const Firebird_1 = require("../firebird/Firebird");
const extra_data_system_1 = __importDefault(require("../systems/extra-data-system"));
const at_order_service_1 = __importDefault(require("./at-order-service"));
class ExtraDataService {
    getParametersExtraPack(barcodeTransfer, barcodeAccepted) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const errors = [];
                let transfer = undefined;
                let accepted = undefined;
                const db = yield (0, Firebird_1.createItmDb)();
                const extraDataSystem = new extra_data_system_1.default();
                const [candidateA, candidateB] = yield db.executeRequest(`SELECT B.ID_SECTOR AS ID, GET_SECTOR_NAME(B.ID_SECTOR) AS NAME, B.BARCODE FROM SECTORS_BARCODE B 
                    WHERE UPPER(B.BARCODE) IN ('${barcodeTransfer === null || barcodeTransfer === void 0 ? void 0 : barcodeTransfer.toUpperCase()}', '${barcodeAccepted === null || barcodeAccepted === void 0 ? void 0 : barcodeAccepted.toUpperCase()}')`);
                db.detach();
                if ((candidateA === null || candidateA === void 0 ? void 0 : candidateA.BARCODE.toUpperCase()) === (barcodeTransfer === null || barcodeTransfer === void 0 ? void 0 : barcodeTransfer.toUpperCase())) {
                    transfer = candidateA;
                    accepted = candidateB;
                }
                else {
                    transfer = candidateB;
                    accepted = candidateA;
                }
                const [dep, rdep] = yield at_order_service_1.default.dependenciesValidator(transfer === null || transfer === void 0 ? void 0 : transfer.ID, accepted === null || accepted === void 0 ? void 0 : accepted.ID);
                if (!dep.length) {
                    if (rdep.length) {
                        errors.push(`Участок "${transfer === null || transfer === void 0 ? void 0 : transfer.NAME}" не может передавать заказы участку "${accepted === null || accepted === void 0 ? void 0 : accepted.NAME}". Однако, участок "${accepted === null || accepted === void 0 ? void 0 : accepted.NAME}", может передавать участку "${transfer === null || transfer === void 0 ? void 0 : transfer.NAME}". Попробуйте изменить порядок сканирования карт.`);
                    }
                    else {
                        errors.push(`Участок "${transfer === null || transfer === void 0 ? void 0 : transfer.NAME}" не может передавать заказы участку "${accepted === null || accepted === void 0 ? void 0 : accepted.NAME}".`);
                    }
                }
                if (!transfer || !accepted)
                    throw ApiError_1.default.BadRequest('Оштбка.', ['Один из штрихкодов не определен или заблокирован, либо использована одна и та же карта.']);
                if (errors.length)
                    throw ApiError_1.default.BadRequest("Ошибка.", errors);
                const extraData = yield extraDataSystem.getParametersExtraPack(barcodeTransfer, barcodeAccepted);
                for (const data of extraData) {
                    const list = yield extraDataSystem.getListExtradataToName(data.name);
                    data.list = list;
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
                const extraDataSystem = new extra_data_system_1.default();
                const list = yield extraDataSystem.getListExtradataToName(name);
                return list;
            }
            catch (e) {
                throw e;
            }
        });
    }
}
exports.default = new ExtraDataService();
