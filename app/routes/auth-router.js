"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("../controllers/auth-controller"));
const validate_request_schema_1 = __importDefault(require("../middlewares/validate-request-schema"));
const auth_schema_1 = require("../validators/auth-schema");
const router = (0, express_1.Router)();
/**----------------------------- */
const prefix = '/auth';
// Гет запросы
// router.get('/test');
// router.get('/test');
// router.get('/test');
// router.get('/test');
// router.get('/test');
// router.get('/test');
// router.get('/test');
// router.get('/test');
// router.get('/test');
// router.get('/test');
// Пост запросы
router.post(prefix + '/register', auth_schema_1.registerSchema, validate_request_schema_1.default, auth_controller_1.default.register); // Регистрация пользователя
router.post(prefix + '/login', auth_controller_1.default.login); // Вход в систему
router.post(prefix + '/login', auth_controller_1.default.logout); //Выход из системы (не реализовано)
// router.post('/refresh'); // Обновление токена (не реализовано)
router.post(prefix + '/get-login-data', auth_controller_1.default.getUserData);
// router.post('/test');
// router.post('/test');
// Делит запросы
// router.delete('/test');
// router.delete('/test');
// router.delete('/test');
// router.delete('/test');
// router.delete('/test');
/**----------------------------- */
exports.default = router;
