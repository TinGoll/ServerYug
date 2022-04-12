"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const express_1 = require("express");
const users_1 = __importStar(require("../systems/users"));
/********************************* */
// /api/users/
const router = (0, express_1.Router)();
// Getters
/********************************************/
// Получение всех пользователей, нужен токен
router.get('/', // /api/users
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Проверка токена, получение пользователя.
        const user = yield (0, users_1.getUserToToken)(req.get('Authorization'));
        // Конец проверки токена.
        // Разграничить по правам.
        return res.json({ users: yield users_1.default.getAllUsers() });
    }
    catch (e) {
        next(e);
    }
}));
// Получение пользователя по id,  нужен токен
router.get('/:id', // /api/users/:id 
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Проверка токена, получение пользователя.
        const user = yield (0, users_1.getUserToToken)(req.get('Authorization'));
        // Конец проверки токена.
        const userId = req.params.id; // id запрашиваемого пользователя.
    }
    catch (e) {
        next(e);
    }
}));
// Получение списка прав пользователя по id, нужен токен.
router.get('/get-permissions/:id', // /api/users/get-permissions/:id
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Проверка токена, получение пользователя.
        const user = yield (0, users_1.getUserToToken)(req.get('Authorization'));
        // Конец проверки токена.
        const userId = req.params.id; // id запрашиваемого пользователя.
    }
    catch (e) {
        next(e);
    }
}));
exports.default = router;
