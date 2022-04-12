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
const ApiError_1 = __importDefault(require("../exceptions/ApiError"));
const extra_data_system_1 = __importDefault(require("../systems/extra-data-system"));
const users_1 = require("../systems/users");
class ExtraDataController {
    connect(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const system = new extra_data_system_1.default();
                const extraEmmiter = system.getEmmiter();
                extraEmmiter.once('CommentAction', (commit) => {
                    var _a;
                    const action = req.body.action;
                    const orderId = req.body.orderId;
                    if (action && (action === null || action === void 0 ? void 0 : action.toUpperCase()) != ((_a = commit.action) === null || _a === void 0 ? void 0 : _a.toUpperCase()))
                        return null;
                    if (orderId && commit.payload.orderId != Number(orderId))
                        return;
                    res.status(200).json(commit);
                });
            }
            catch (e) {
                throw e;
            }
        });
    }
    addData(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, data } = req.body;
                if (!name || !data)
                    throw ApiError_1.default.BadRequest('Для добаления элемента списка, нужно заполнить поля "name" и поле "data"');
                const system = new extra_data_system_1.default();
                yield system.addItemInListExtraData(name, data);
                res.status(201).json({ ok: true });
            }
            catch (e) {
                next(e);
            }
        });
    }
    deleteData(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, data } = req.body;
                if (!name || !data)
                    throw ApiError_1.default.BadRequest('Для добаления элемента списка, нужно заполнить поля "name" и поле "data"');
                const system = new extra_data_system_1.default();
                const id = yield system.addItemInListExtraData(name, data);
                res.status(200).json({ id });
            }
            catch (e) {
                next(e);
            }
        });
    }
    getParametersExtraPack(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // Получение дополнительных параметров, в зависимости от  передающей и принимающей стороны.
            try {
                const { barcodeTransfer, barcodeAccepted } = req.body;
                if (!barcodeTransfer || !barcodeAccepted)
                    throw ApiError_1.default.BadRequest('Для получения параметров, необходимо указать передающий и принимающий участок.');
                const system = new extra_data_system_1.default();
                const extraData = yield system.getParametersExtraPack(barcodeTransfer, barcodeAccepted);
                res.status(200).json(extraData);
            }
            catch (e) {
                next(e);
            }
        });
    }
    /** Комментарии */
    /** Получить все комментарии по id заказа */
    getCommentToOrderId(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                if (!id)
                    throw ApiError_1.default.BadRequest("Некорректный id заказа.");
                const system = new extra_data_system_1.default();
                const comments = yield system.getCommentsToOrderId(Number(id));
                res.status(200).json({ comments });
            }
            catch (e) {
                next(e);
            }
        });
    }
    addComment(req, res, next) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Проверка токена, получение пользователя.
                const user = yield (0, users_1.getUserToToken)(req.get('Authorization'));
                // Конец проверки токена.
                const { journalId, orderId, group, name, data, type, userName, sector, ts, list } = (_a = req.body) === null || _a === void 0 ? void 0 : _a.comment;
                const system = new extra_data_system_1.default();
                if (!orderId)
                    throw ApiError_1.default.BadRequest("В объекте не задан orderId");
                const employeeId = user.getId() || undefined;
                const sectorId = user.sectorId;
                const comment = yield system.addCommentToOrder(orderId, { journalId, sectorId, orderId, employeeId, group,
                    name, data, type, userName, sector, ts, list });
                res.status(200).json({ comment });
            }
            catch (e) {
                next(e);
            }
        });
    }
    editComment(req, res, next) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id, journalId, sectorId, orderId, employeeId, group, name, data, type, userName, sector, ts, list } = (_a = req.body) === null || _a === void 0 ? void 0 : _a.comment;
                if (!id)
                    throw ApiError_1.default.BadRequest("Не указан id комментария.");
                const system = new extra_data_system_1.default();
                const comment = yield system.editComment({ id, journalId, sectorId, orderId, employeeId, group,
                    name, data, type, userName, sector, ts, list });
                res.status(200).json({ comment });
            }
            catch (e) {
                next(e);
            }
        });
    }
    deleteComment(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                ;
                if (!id)
                    throw ApiError_1.default.BadRequest("Не корректный id, предоставь id в формате {id: number}");
                const system = new extra_data_system_1.default();
                const deleted = yield system.deleteCommentToId(Number(id));
                res.status(200).json({ id: deleted });
            }
            catch (e) {
                next(e);
            }
        });
    }
}
exports.default = new ExtraDataController();
