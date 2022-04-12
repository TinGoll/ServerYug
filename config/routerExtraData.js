"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = __importDefault(require("../app/routes"));
exports.default = (app, url) => {
    app.use(`${url}/extra-data`, routes_1.default.extraData);
};
