"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = __importDefault(require("./auth"));
const atOrder_1 = __importDefault(require("./atOrder"));
const journals_1 = __importDefault(require("./journals"));
const users_1 = __importDefault(require("./users"));
const extraData_1 = __importDefault(require("./extraData"));
exports.default = {
    auth: auth_1.default,
    atOrder: atOrder_1.default,
    journals: journals_1.default,
    users: users_1.default,
    extraData: extraData_1.default
};
