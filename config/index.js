"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const port_1 = __importDefault(require("./port"));
const express_1 = __importDefault(require("./express"));
const routesOrders_1 = __importDefault(require("./routesOrders"));
const routersAuth_1 = __importDefault(require("./routersAuth"));
const routesAtOrder_1 = __importDefault(require("./routesAtOrder"));
const routesJournals_1 = __importDefault(require("./routesJournals"));
const routesUsers_1 = __importDefault(require("./routesUsers"));
const routerExtraData_1 = __importDefault(require("./routerExtraData"));
const settingsDB_1 = __importDefault(require("./.firebirdDB/settingsDB"));
exports.default = {
    port: port_1.default,
    express: express_1.default,
    routesOrders: routesOrders_1.default,
    routersAuth: routersAuth_1.default,
    routesAtOrder: routesAtOrder_1.default,
    routesJournals: routesJournals_1.default,
    routesUsers: routesUsers_1.default,
    routesExtraData: routerExtraData_1.default,
    configDb: settingsDB_1.default
};
