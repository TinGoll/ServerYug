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
const atOrder_1 = __importDefault(require("../query/atOrder"));
const Firebird_1 = require("../firebird/Firebird");
class AtOrderService {
    /**
     * Возвращает массив штрих-кодов.
     * @returns BarcodesDb[]
     */
    getBarcodes() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = atOrder_1.default.get('get_barcodes');
                const db = yield (0, Firebird_1.createItmDb)();
                const barcode = yield db.executeRequest(query);
                db.detach();
                return barcode;
            }
            catch (e) {
                throw e;
            }
        });
    }
    /**
     *
     * @returns
     */
    getJournalNames() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = atOrder_1.default.get('get_barcodes');
                const db = yield (0, Firebird_1.createItmDb)();
                const barcode = yield db.executeRequest(query);
                db.detach();
                return barcode;
            }
            catch (e) {
                throw e;
            }
        });
    }
}
exports.default = new AtOrderService();
