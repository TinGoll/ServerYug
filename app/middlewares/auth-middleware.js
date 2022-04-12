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
exports.authMiddleware = void 0;
const ApiError_1 = __importDefault(require("../exceptions/ApiError"));
const users_1 = require("../systems/users");
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authorizationHeader = req.headers.authorization;
        if (!authorizationHeader)
            return next(ApiError_1.default.UnauthorizedError());
        //const [bearer, accessToken] = authorizationHeader.split(' ');
        const accessToken = authorizationHeader;
        if (!accessToken)
            return next(ApiError_1.default.UnauthorizedError());
        const user = yield (0, users_1.getUserToToken)(accessToken);
        req.body.user = user;
        next();
    }
    catch (e) {
        return next(ApiError_1.default.UnauthorizedError());
    }
});
exports.authMiddleware = authMiddleware;
