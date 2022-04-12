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
const auth_service_1 = __importDefault(require("../services/auth-service"));
const ApiError_1 = __importDefault(require("../exceptions/ApiError"));
const users_1 = __importStar(require("../systems/users"));
class AuthController {
    /** Регистрация нового пользователя */
    register(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = req.body;
                const loginData = yield auth_service_1.default.registration(data);
                res.status(201).json(loginData);
            }
            catch (e) {
                next(e);
            }
        });
    }
    /** Вход в систему */
    login(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userName, password, barcode } = req.body;
                const loginData = yield auth_service_1.default.login(userName, password, barcode);
                res.status(200).json(loginData);
            }
            catch (e) {
                next(e);
            }
        });
    }
    /** Выход из системы */
    logout(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                throw ApiError_1.default.BadRequest("Функция не реализована.");
            }
            catch (e) {
                next(e);
            }
        });
    }
    getUserData(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.body.id;
                // Проверка токена, получение пользователя.
                const user = yield (0, users_1.getUserToToken)(req.get('Authorization'));
                // Конец проверки токена.
                let loginData = {};
                if (id) {
                    if (user.id != Number(id) && !user.isOwner)
                        throw ApiError_1.default.Forbidden();
                    const candidate = yield users_1.default.getUserToID(Number(id));
                    if (!candidate)
                        throw ApiError_1.default.NotFound(["Запрашиваемый пользователь не найден"]);
                    loginData = yield candidate.getDto();
                }
                else {
                    loginData = yield user.getDto();
                }
                res.status(200).json(loginData);
            }
            catch (e) {
                next(e);
            }
        });
    }
}
exports.default = new AuthController();
