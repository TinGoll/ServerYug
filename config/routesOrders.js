"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const orders_1 = __importDefault(require("../app/pools/orders"));
exports.default = (app, url = '') => {
    app.get("/orders", orders_1.default.getAllOrders);
    app.get("/orders/:id", orders_1.default.getOneOrder);
    app.get("/orders/exists/:id", orders_1.default.orderExists);
    app.get("/testimage", orders_1.default.getImageTest);
    app.get("/orders/sample/:id", orders_1.default.getSampleForOrder);
    app.get("/lists", orders_1.default.getDataHeaderForCreateOrder);
    app.get("/test", orders_1.default.getTest);
};
