"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const ApiError_1 = __importDefault(require("../exceptions/ApiError"));
const errorMiddleware = (err, req, res, next) => {
    console.log('error middlewares: ' + req.originalUrl, err.message);
    if (err instanceof ApiError_1.default) {
        return res.status(err.status).json({ message: err.message, errors: err.errors });
    }
    return res.status(500).json({ message: ` Непредвиденная ошибка: ${err.message}` });
};
exports.errorMiddleware = errorMiddleware;
