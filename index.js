"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const error_middleware_1 = require("./app/middlewares/error-middleware");
const index_1 = __importDefault(require("./config/index"));
const auth_router_1 = __importDefault(require("./app/routes/auth-router"));
const time_router_1 = __importDefault(require("./app/routes/time-router"));
const service_router_1 = __importDefault(require("./app/routes/service-router"));
const order_plans_system_1 = require("./app/systems/order-plans-system");
const extra_data_system_1 = __importDefault(require("./app/systems/extra-data-system"));
const app = (0, express_1.default)();
index_1.default.express(app);
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, PATCH, DELETE');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS, POST, PATCH, PUT, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});
app.use(express_1.default.static(__dirname + "/public"));
app.use('/api', auth_router_1.default); // Авторизация и создание новых пользователей.
app.use('/api', time_router_1.default); // Получение времени
app.use('/api', service_router_1.default); // Сервисный роутер, для перезагрузки или отчистки кеша
//config.routersAuth(app, '/api');
index_1.default.routesAtOrder(app, '/api');
index_1.default.routesJournals(app, '/api');
index_1.default.routesUsers(app, '/api');
index_1.default.routesExtraData(app, '/api');
index_1.default.routesOrders(app);
// Обработка ошибок.
app.use(error_middleware_1.errorMiddleware);
app.listen(index_1.default.port, () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Обновляем системы...');
        const planSystem = new order_plans_system_1.OrderPlanSystem();
        yield planSystem.refrash();
        const extraDataSystem = new extra_data_system_1.default();
        yield extraDataSystem.refrash();
        console.log('Обновление сисемы завершено.');
    }
    catch (e) {
        console.log('Ошибка обновления системы', e);
    }
    console.log(`Сервер запущен на порту ${index_1.default.port}`);
}));


