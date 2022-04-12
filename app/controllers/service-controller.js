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
const adopted_order_system_1 = require("../systems/adopted-order-system");
const order_plans_system_1 = require("../systems/order-plans-system");
const user_system_1 = __importDefault(require("../systems/user-system"));
class ServiceController {
    restartSystems(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const progress = [
                { name: 'Журнал планов', complited: false },
                { name: 'Журнал принятых', complited: false },
                { name: 'Пользователи', complited: false },
            ];
            try {
                /** Обновление планов. */
                const plans = new order_plans_system_1.OrderPlanSystem();
                yield plans.refrash();
                progress[0].complited = true;
                /** Обновление принятых */
                (0, adopted_order_system_1.clearAdoptedQueryHash)();
                progress[1].complited = true;
                /** Пользователи */
                const userSystem = new user_system_1.default();
                yield userSystem.refrash();
                progress[2].complited = true;
                res.status(200).json({ message: "Системы успешно перезагружены, hash - данные обновлены.", progress });
            }
            catch (e) {
                const error = ApiError_1.default.BadRequest(e.message, progress);
                next(error);
            }
        });
    }
}
exports.default = new ServiceController();
