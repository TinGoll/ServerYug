"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferOrdersSchema = void 0;
const express_validator_1 = require("express-validator");
const transferOrdersSchema = [
    (0, express_validator_1.body)('idTransfer').exists({ checkFalsy: true, checkNull: true }).withMessage('Это поле обязательное: Передающий участок'),
    (0, express_validator_1.body)('idAccepted').exists({ checkFalsy: true, checkNull: true }).withMessage('Это поле обязательное: Принимающий участок')
];
exports.transferOrdersSchema = transferOrdersSchema;
