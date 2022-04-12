"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const ApiError_1 = __importDefault(require("../exceptions/ApiError"));
const validateRequestSchema = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const error = ApiError_1.default.BadRequest('Не заполнены обязательные поля:', errors.array());
        next(error);
    }
    next();
};
exports.default = validateRequestSchema;
