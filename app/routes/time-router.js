"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const time_controller_1 = __importDefault(require("../controllers/time-controller"));
const router = (0, express_1.Router)();
/**----------------------------- */
const prefix = '/time';
router.get(prefix + '/', time_controller_1.default.getCurrentTime);
exports.default = router;
