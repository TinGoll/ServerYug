"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const express_1 = require("express");
const dataBase_1 = __importDefault(require("../dataBase"));
const virtualJournalsFun_1 = __importStar(require("../systems/virtualJournalsFun"));
const lodash_1 = __importDefault(require("lodash"));
const users_1 = require("../systems/users");
const ApiError_1 = __importDefault(require("../exceptions/ApiError"));
const adopted_order_service_1 = __importDefault(require("../services/adopted-order-service"));
const order_plans_system_1 = require("../systems/order-plans-system");
const extra_data_system_1 = __importDefault(require("../systems/extra-data-system"));
// /api/journals/
const router = (0, express_1.Router)();
// /api/journals/order-report - запрос для EXCEL, отчет по участкам по дате.
router.get('/order-report/:date', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const date = req.params.date;
        if (!date)
            throw new Error('Некорректная дата');
        const query = `
                  SELECT DISTINCT O.ID, O.ITM_ORDERNUM, COALESCE(GET_SECTOR_NAME(S.ID_NEW_SECTOR), P.DATE_DESCRIPTION) AS SECTOR, 
                        P.DATE3 AS DATE_PLAN, GET_SECTOR_NAME(L.ID_SECTOR) AS LOCATION
                    FROM ORDERS O
                    LEFT JOIN ORDERS_DATE_PLAN P ON (P.ORDER_ID = O.ID)
                    LEFT JOIN SECTORS_OLD S ON (UPPER(S.NAME_OLD_SECTOR) = UPPER(P.DATE_DESCRIPTION))
                    LEFT JOIN SECTORS S2 ON (S.ID_NEW_SECTOR = S2.ID)
                    LEFT JOIN LOCATION_ORDER L ON (L.ID_ORDER = O.ID AND L.ID_SECTOR = S.ID_NEW_SECTOR)
                    WHERE P.DATE3 = '${date}'
                    ORDER BY S2.ORDER_BY`;
        const result = yield dataBase_1.default.executeRequest(query);
        const sectors = lodash_1.default.uniqWith(result
            .filter(s => {
            var _a, _b, _c, _d;
            if (((_a = s.SECTOR) === null || _a === void 0 ? void 0 : _a.toUpperCase()) == 'Колеровка'.toUpperCase())
                return false;
            if (((_b = s.SECTOR) === null || _b === void 0 ? void 0 : _b.toUpperCase()) == 'Шлифовка Станок'.toUpperCase())
                return false;
            if (((_c = s.SECTOR) === null || _c === void 0 ? void 0 : _c.toUpperCase()) == 'Склад упакованных заказов'.toUpperCase())
                return false;
            if (((_d = s.SECTOR) === null || _d === void 0 ? void 0 : _d.toUpperCase()) == 'Упаковка профиля'.toUpperCase())
                return false;
            return true;
        })
            .map(s => {
            return { name: s.SECTOR, orders: [] };
        }), lodash_1.default.isEqual);
        for (const sector of sectors) {
            sector.orders = result
                .filter(o => { var _a, _b; return ((_a = o.SECTOR) === null || _a === void 0 ? void 0 : _a.toUpperCase()) == ((_b = sector.name) === null || _b === void 0 ? void 0 : _b.toUpperCase()); })
                .map(o => o.ITM_ORDERNUM);
        }
        return res.status(200).json({ sectors });
    }
    catch (e) {
        next(e);
    }
}));
/**Перенести в отдельный роутер */
// /api/journals/get-journals
router.get('/get-journals', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const defaultError = 'Ошибка получения списка журналов.';
    try {
        // Проверка токена, получение пользователя.
        const user = yield (0, users_1.getUserToToken)(req.get('Authorization'));
        // Конец проверки токена.
        const journals = yield virtualJournalsFun_1.default.permissionSet(user);
        if (journals.length == 0)
            throw ApiError_1.default.BadRequest(defaultError, ['Список журналов пуст.']);
        return res.json({ journals: journals.filter(j => j.id != 5) }); // Удаляем из списка журнал бухгалтера
    }
    catch (e) {
        next(e);
    }
}));
// /api/journals/set-comment
router.post('/set-comment', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Проверка токена, получение пользователя.
        const user = yield (0, users_1.getUserToToken)(req.get('Authorization'));
        // Конец проверки токена.
        const comment = req.body;
        // Если ID коммента существует, изменяем существующий
        const system = new extra_data_system_1.default();
        if (comment.dataId) {
            if (!comment.text || comment.text == '') {
                // Если поле текстпустое - удаляем коммент.
                const isDeleted = yield system.deleteCommentToId(comment.dataId);
                return res.status(200).json({ id: isDeleted });
            }
            // Если не пустое, обновляем коммент.
            const editComment = yield system.editComment(comment);
            if (editComment) {
                return res.status(201).json({ dataId: editComment.id });
            }
        }
        // Если ID коммента 0 - добавляем новый.
        const newComment = yield system.addCommentToOrder(comment.orderId, comment);
        const planSystem = new order_plans_system_1.OrderPlanSystem();
        planSystem.refrash();
        return res.status(201).json({ dataId: newComment === null || newComment === void 0 ? void 0 : newComment.id });
    }
    catch (e) {
        next(e);
    }
}));
// /api/journals/adopted
router.get('/adopted/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // console.time('FirstWay');
        const limit = req.query._limit;
        const page = req.query._page;
        const id = req.params.id;
        const d1 = req.query._d1;
        const d2 = req.query._d2;
        const filter = req.query._filter;
        const dateFirst = d1 ? convertToDate(d1, "dd/mm/yyyy") : undefined;
        const dateSecond = d2 ? convertToDate(d2, "dd/mm/yyyy") : undefined;
        if (!id)
            throw ApiError_1.default.BadRequest("Некорректный Id журнала.");
        // Проверка токена, получение пользователя.
        const user = yield (0, users_1.getUserToToken)(req.get('Authorization'));
        // Конец проверки токена.
        // Проверка прав
        const journals = yield virtualJournalsFun_1.default.permissionSet(user);
        const journal = journals.find(j => j.id == id);
        if (!journal)
            throw ApiError_1.default.Forbidden(['У тебя нет прав на получение данных этого журнала. Обратись а администатору.']);
        const jnamesId = journal.j;
        const data = yield adopted_order_service_1.default.getAdoptedOrders(id, jnamesId, {
            limit, page, filter, d1: dateFirst, d2: dateSecond
        });
        // console.timeEnd('FirstWay');
        return res.json(Object.assign({}, data));
    }
    catch (e) {
        next(e);
    }
}));
router.get('/get-sectors', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Проверка токена, получение пользователя.
        const user = yield (0, users_1.getUserToToken)(req.get('Authorization'));
        // Конец проверки токена.
        const id = req.query._id;
        const sectors = yield (0, virtualJournalsFun_1.getSectors)();
        const filtredSectorId = [];
        if (id) {
            const system = new order_plans_system_1.OrderPlanSystem();
            const dependenses = yield system.getDependenses();
            for (const d of dependenses) {
                if (d.journalNameId === Number(id))
                    filtredSectorId.push(d.transfer);
            }
        }
        res.status(200).json([...sectors
                .filter(s => {
                let chek = true;
                if (filtredSectorId.length) {
                    chek = false;
                    for (const f of filtredSectorId) {
                        if (f == s.id) {
                            chek = true;
                            break;
                        }
                    }
                }
                return chek && s.id != 13 && s.id != 14;
            })
                .map(s => { return { id: s.id, name: s.name }; })]);
    }
    catch (e) {
        next(e);
    }
}));
router.get('/plan-orders', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Проверка токена, получение пользователя.
        const user = yield (0, users_1.getUserToToken)(req.get('Authorization'));
        // Конец проверки токена.
        const id = req.query._id;
        const name = req.query._name;
        const sectorId = req.query._idsector;
        const limit = req.query._limit;
        const page = req.query._page;
        const d1 = req.query._d1;
        const d2 = req.query._d2;
        const filter = req.query._filter;
        const dateFirst = d1 ? convertToDate(d1, "dd/mm/yyyy") : undefined;
        const dateSecond = d2 ? convertToDate(d2, "dd/mm/yyyy") : undefined;
        const system = new order_plans_system_1.OrderPlanSystem();
        const result = yield system.getData({
            id: Number(id) === 6 ? undefined : id,
            limit,
            page,
            d1: dateFirst,
            d2: dateSecond,
            filter
        });
        const allOrders = result
            .filter(o => {
            if (!sectorId)
                return true;
            return Number(o.sectorId) == Number(sectorId);
        })
            .map(o => {
            var _a;
            const order = {
                id: o.id,
                itmOrderNum: o.itmOrderNum,
                sectorId: o.sectorId,
                sectorName: o.sectorName,
                nameSectorInOrder: o.accepdedEmployee || o.workerName,
                datePlan: o.datePlan,
                fasadSquare: o.fasadSquare,
                generalSquare: o.generalSquare,
                workingTime: o.workingTime,
                status: o.status || undefined,
                data: {
                    comments: (_a = o.data) === null || _a === void 0 ? void 0 : _a.comments
                }
            };
            return order;
        });
        let orders = new Array();
        orders = allOrders;
        res.status(200).json([...orders]);
    }
    catch (e) {
        next(e);
    }
}));
router.get('/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const defaultError = 'Ошибка получения журнала.';
    try {
        const id = req.params.id;
        const limit = req.query._limit;
        const page = req.query._page;
        const d1 = req.query._d1;
        const d2 = req.query._d2;
        const filter = req.query._filter;
        const dateFirst = d1 ? convertToDate(d1, "dd/mm/yyyy") : undefined;
        const dateSecond = d2 ? convertToDate(d2, "dd/mm/yyyy") : undefined;
        // Проверка токена, получение пользователя.
        const user = yield (0, users_1.getUserToToken)(req.get('Authorization'));
        // Конец проверки токена.
        const journals = yield virtualJournalsFun_1.default.permissionSet(user);
        const allowed = journals.find(j => j.id == id);
        if (!allowed)
            throw ApiError_1.default.Forbidden(['У тебя нет прав на получение данного журнала. Обратись а администатору.']);
        // Проверка прав завершена.
        let journal = [];
        if (!id)
            throw ApiError_1.default.BadRequest(defaultError, ['Некорректный идентификатор журнала.']);
        const orderPlanSystem = new order_plans_system_1.OrderPlanSystem();
        const orders = yield orderPlanSystem.getData({
            id: Number(id) === 6 ? undefined : id,
            limit,
            page,
            d1: dateFirst,
            d2: dateSecond,
            filter
        });
        const sectors = yield (0, virtualJournalsFun_1.getSectors)();
        const sectorsId = [...new Set(orders.map(o => o.sectorId))];
        for (const sectorId of sectorsId) {
            if (!sectorId)
                continue;
            const s = sectors.find(s => s.id === sectorId);
            const sectorOrders = orders.filter(o => o.sectorId === sectorId);
            const sector = {
                id: sectorId,
                name: s === null || s === void 0 ? void 0 : s.name,
                overdue: [],
                forToday: [],
                forFuture: []
            };
            const now = new Date();
            const toDay = (_a = new Date(now.getFullYear(), now.getMonth(), now.getDate())) === null || _a === void 0 ? void 0 : _a.valueOf();
            sector.overdue = sectorOrders.filter(o => { var _a; return ((_a = o.datePlan) === null || _a === void 0 ? void 0 : _a.valueOf()) < toDay; }).map(o => {
                //if (o.workingTime) console.log(o);
                var _a;
                const order = {
                    id: o.id,
                    itmOrderNum: o.itmOrderNum,
                    sectorId: o.sectorId,
                    sectorName: o.sectorName,
                    nameSectorInOrder: o.accepdedEmployee || o.workerName,
                    datePlan: o.datePlan,
                    fasadSquare: o.fasadSquare,
                    generalSquare: o.generalSquare,
                    workingTime: o.workingTime,
                    data: {
                        comments: (_a = o.data) === null || _a === void 0 ? void 0 : _a.comments
                    }
                };
                return order;
            }); // Просроченые
            sector.forToday = sectorOrders.filter(o => { var _a; return ((_a = o.datePlan) === null || _a === void 0 ? void 0 : _a.valueOf()) == toDay; }).map(o => {
                var _a;
                const order = {
                    id: o.id,
                    itmOrderNum: o.itmOrderNum,
                    sectorId: o.sectorId,
                    sectorName: o.sectorName,
                    nameSectorInOrder: o.accepdedEmployee || o.workerName,
                    datePlan: o.datePlan,
                    fasadSquare: o.fasadSquare,
                    generalSquare: o.generalSquare,
                    workingTime: o.workingTime,
                    data: {
                        comments: (_a = o.data) === null || _a === void 0 ? void 0 : _a.comments
                    }
                };
                return order;
            }); // На сегодня
            sector.forFuture = sectorOrders.filter(o => { var _a; return ((_a = o.datePlan) === null || _a === void 0 ? void 0 : _a.valueOf()) > toDay; }).map(o => {
                var _a;
                const order = {
                    id: o.id,
                    itmOrderNum: o.itmOrderNum,
                    sectorId: o.sectorId,
                    sectorName: o.sectorName,
                    nameSectorInOrder: o.accepdedEmployee || o.workerName,
                    datePlan: o.datePlan,
                    fasadSquare: o.fasadSquare,
                    generalSquare: o.generalSquare,
                    workingTime: o.workingTime,
                    data: {
                        comments: (_a = o.data) === null || _a === void 0 ? void 0 : _a.comments
                    }
                };
                return order;
            }); // Будущие
            journal.push(sector);
        }
        //if (!journal.length) throw ApiError.BadRequest(defaultError, ['Такой журнал не существует.']);
        return res.json({ journal });
    }
    catch (e) {
        next(e);
    }
}));
const convertToDate = (date, format) => {
    var normalized = date.replace(/[^a-zA-Z0-9]/g, '-');
    var normalizedFormat = format.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
    var formatItems = normalizedFormat.split('-');
    var dateItems = normalized.split('-');
    var monthIndex = formatItems.indexOf("mm");
    var dayIndex = formatItems.indexOf("dd");
    var yearIndex = formatItems.indexOf("yyyy");
    var hourIndex = formatItems.indexOf("hh");
    var minutesIndex = formatItems.indexOf("ii");
    var secondsIndex = formatItems.indexOf("ss");
    var today = new Date();
    var year = yearIndex > -1 ? dateItems[yearIndex] : today.getFullYear();
    var month = monthIndex > -1 ? dateItems[monthIndex] - 1 : today.getMonth() - 1;
    var day = dayIndex > -1 ? dateItems[dayIndex] : today.getDate();
    var hour = hourIndex > -1 ? dateItems[hourIndex] : today.getHours();
    var minute = minutesIndex > -1 ? dateItems[minutesIndex] : today.getMinutes();
    var second = secondsIndex > -1 ? dateItems[secondsIndex] : today.getSeconds();
    return new Date(year, month, day, hour, minute, second);
};
exports.default = router;
