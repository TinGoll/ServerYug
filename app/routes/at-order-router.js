"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const at_order_controller_1 = __importDefault(require("../controllers/at-order-controller"));
const auth_middleware_1 = require("../middlewares/auth-middleware");
const router = (0, express_1.Router)();
/**----------------------------- */
const prefix = '/at-order';
// Гет запросы
router.get(prefix + '/data', at_order_controller_1.default.getBarcodes);
router.get(prefix + '/journal-names', at_order_controller_1.default.getJournalNames);
router.get(prefix + '/salary-transactions/:idJournal', auth_middleware_1.authMiddleware, at_order_controller_1.default.getSalaryTransactionToIdJournal); // Требует токен
router.get(prefix + '/salary-report/:idtransaction', auth_middleware_1.authMiddleware, at_order_controller_1.default.getSalaryReportToId); // требует токен
router.get(prefix + '/preliminary-calculation/:idJournal', auth_middleware_1.authMiddleware, at_order_controller_1.default.getPreliminaryCalculationToIdJournal); // требует токен
//router.get('/test');
//router.get('/test');
//router.get('/test');
//router.get('/test');
//router.get('/test');
//router.get('/test');
//router.get('/test');
//router.get('/test');
// Пост запросы
router.post(prefix + '/add', auth_middleware_1.authMiddleware); // требует токен
//router.post('/test');
//router.post('/test');
//router.post('/test');
//router.post('/test');
//router.post('/test');
//router.post('/test');
//router.post('/test');
//router.post('/test');
// Патчь запросы
router.patch(prefix + '/close-billing-period', auth_middleware_1.authMiddleware); // требует токен
// Делит запросы
//router.delete('/test');
//router.delete('/test');
//router.delete('/test');
//router.delete('/test');
//router.delete('/test');
/**----------------------------- */
exports.default = router;
