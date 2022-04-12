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
Object.defineProperty(exports, "__esModule", { value: true });
//const _     = require('lodash');
class BarcodeController {
    requestForSecondBarcode(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // Получить данные по второму баркоду.
            // не нужен
            const barcode = req.params.barcode;
        });
    }
    setParametersExtraPack(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // Установка доп параметров.
            try {
            }
            catch (e) {
                next(e);
            }
        });
    }
}
exports.default = new BarcodeController();
