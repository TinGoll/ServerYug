"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const extra_data_controller_1 = __importDefault(require("../controllers/extra-data-controller"));
const auth_middleware_1 = require("../middlewares/auth-middleware");
const router = (0, express_1.Router)();
// Пост запросы
//  /api/extra-data/get
/**
 * {
 *      "barcodeTransfer": "barcode",
 *      "barcodeAccepted": "barcode"
 * }
 */
// /api/extra-data/get
router.post('/get', extra_data_controller_1.default.getParametersExtraPack);
// /api/extra-data/add
router.post('/add', auth_middleware_1.authMiddleware, extra_data_controller_1.default.addData);
router.patch('');
// /api/extra-data/delete
router.delete('/delete', auth_middleware_1.authMiddleware, extra_data_controller_1.default.deleteData);
// /extra-data/comments/order/:id
// /extra-data/comments/add
// /extra-data/comments/edit
// /extra-data/comments/delete/:id
// /extra-data/comments/connect
router.get('/comments/order/:id', extra_data_controller_1.default.getCommentToOrderId);
router.post('/comments/add', extra_data_controller_1.default.addComment);
router.patch('/comments/edit', extra_data_controller_1.default.editComment);
router.delete('/comments/delete/:id', extra_data_controller_1.default.deleteComment);
router.post('/comments/connect', extra_data_controller_1.default.connect);
exports.default = router;
