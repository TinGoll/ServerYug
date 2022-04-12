"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const users_1 = __importDefault(require("./users"));
const virtualJournalsFun_1 = __importDefault(require("./virtualJournalsFun"));
const atOrderFun_1 = __importDefault(require("./atOrderFun"));
const links_1 = __importDefault(require("./links"));
exports.default = {
    users: users_1.default,
    jfunction: virtualJournalsFun_1.default,
    atfunction: atOrderFun_1.default,
    links: links_1.default
};
