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
const User_1 = __importDefault(require("../entities/User"));
const ApiError_1 = __importDefault(require("../exceptions/ApiError"));
const users_1 = __importStar(require("../systems/users"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const settings_1 = __importDefault(require("../settings"));
const links_1 = __importDefault(require("../systems/links"));
const virtualJournalsFun_1 = __importDefault(require("../systems/virtualJournalsFun"));
const Firebird_1 = require("../firebird/Firebird");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class AuthService {
    /** Регистрация нового пользователя */
    registration(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { fio, gender, telephone, login: userName, pass: password, otherData } = options;
                let lastName = '', firstName = '', middleName = '';
                const [item1, item2, item3] = fio.split(' ');
                if (item1 && !item2) {
                    firstName = item1;
                }
                else if (item1 && item2 && !item3) {
                    firstName = item2;
                    lastName = item1;
                }
                else {
                    lastName = item1;
                    firstName = item2;
                    middleName = item3;
                }
                const candidate = yield users_1.default.getUser(userName);
                if (candidate)
                    throw ApiError_1.default.BadRequest('Такой пользователь уже существует.');
                const user = new User_1.default({
                    userName,
                    password,
                    departament: 'Офис',
                    status: 1,
                    permissionGroupId: 1,
                    firstName,
                    lastName,
                    middleName
                });
                const res = yield user.save();
                if (!res)
                    ApiError_1.default.BadRequest('Ошибка сохранения пользователя.');
                const loginData = yield this.getLoginData(user);
                return loginData;
            }
            catch (e) {
                throw e;
            }
        });
    }
    /** Вход в систему */
    login(userName, password, barcode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, Firebird_1.createItmDb)();
                if (barcode) {
                    const [code] = yield db.executeRequest(`
                    select B.ID_EMPLOYERS, B.ID_SECTOR, coalesce(B.STATUS_BARCODE, 0) as STATUS
                    from SECTORS_BARCODE B where upper(B.BARCODE) = upper(?)`, [barcode]);
                    db.detach();
                    if (!code)
                        throw ApiError_1.default.BadRequest("Некорректный штрих - код.");
                    if (!code.ID_EMPLOYERS || !code.ID_SECTOR || code.ID_SECTOR == 14)
                        throw ApiError_1.default.BadRequest("Карточка не активирована, обратитесь к администрации.");
                    if (code.STATUS != 0)
                        throw ApiError_1.default.BadRequest("Карточка заблокирована, обратитесь к администрации.");
                    const candidateBarcode = yield (0, users_1.getUserToID)(code.ID_EMPLOYERS);
                    if (!candidateBarcode)
                        throw ApiError_1.default.BadRequest("Пользователь по данному штрих - коду не найден.");
                    const loginDataToBarcode = yield this.getLoginData(candidateBarcode);
                    return loginDataToBarcode;
                }
                if (!userName)
                    throw ApiError_1.default.BadRequest("Некорректное имя пользователя.");
                const user = yield (0, users_1.getUser)(userName);
                if (!user)
                    throw ApiError_1.default.BadRequest(`Пользователя ${userName} не существует.`);
                const isMatch = yield bcryptjs_1.default.compare(user === null || user === void 0 ? void 0 : user.getPasword(), password);
                if (!isMatch)
                    throw ApiError_1.default.BadRequest(`Неверный пароль.`);
                const loginData = yield this.getLoginData(user);
                return loginData;
            }
            catch (e) {
                throw e;
            }
        });
    }
    /** Выход из системы */
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
            }
            catch (e) {
                throw e;
            }
        });
    }
    /** Обновление токена */
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
            }
            catch (e) {
                throw e;
            }
        });
    }
    getLoginData(user) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!user || !user.id)
                    throw ApiError_1.default.UnauthorizedError();
                const token = jsonwebtoken_1.default.sign({ userId: user.id }, settings_1.default.secretKey, { expiresIn: '10h' });
                yield user.refrash();
                const sectorName = (_a = (yield virtualJournalsFun_1.default.getSectors()).find(s => s.id == (user === null || user === void 0 ? void 0 : user.sectorId))) === null || _a === void 0 ? void 0 : _a.name;
                const userLinks = yield links_1.default.getLinks(user);
                const permissionList = user.getPermissions();
                const loginData = {
                    token,
                    userId: user === null || user === void 0 ? void 0 : user.id,
                    user: {
                        userName: user.userName,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        middleName: user.middleName,
                        isOwner: user.isOwner,
                        sectorId: user.sectorId,
                        sectorName,
                        permissionList,
                        links: userLinks
                    }
                };
                return loginData;
            }
            catch (e) {
                throw e;
            }
        });
    }
}
exports.default = new AuthService();
