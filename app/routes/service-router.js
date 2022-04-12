"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const service_controller_1 = __importDefault(require("../controllers/service-controller"));
const router = (0, express_1.Router)();
/**----------------------------- */
const prefix = '/service';
// /api/service/restart
router.get(prefix + '/restart', service_controller_1.default.restartSystems);
exports.default = router;
