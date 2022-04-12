"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const express_validator_1 = require("express-validator");
const registerSchema = [
    (0, express_validator_1.body)('userName').exists({ checkFalsy: true, checkNull: true }).withMessage('Это поле обязательное: Имя'),
    (0, express_validator_1.body)('password').exists({ checkFalsy: true, checkNull: true }).withMessage('Это поле обязательное:  Фамилия')
];
exports.registerSchema = registerSchema;
const loginSchema = [
    (0, express_validator_1.body)('userName').exists({ checkFalsy: true, checkNull: true }).withMessage('Это поле обязательное: Имя'),
    (0, express_validator_1.body)('password').exists({ checkFalsy: true, checkNull: true }).withMessage('Это поле обязательное:  Фамилия')
];
exports.loginSchema = loginSchema;
