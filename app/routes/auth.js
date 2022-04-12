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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const settings_1 = __importDefault(require("../settings"));
const dataBase_1 = __importDefault(require("../dataBase"));
const express_validator_1 = require("express-validator");
const virtualJournalsFun_1 = __importDefault(require("../systems/virtualJournalsFun"));
const User_1 = __importDefault(require("../entities/User"));
const links_1 = __importDefault(require("../systems/links"));
const users_1 = __importDefault(require("../systems/users"));
const ApiError_1 = __importDefault(require("../exceptions/ApiError"));
const router = (0, express_1.Router)();
router.post('', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
    }
    catch (error) {
    }
}));
// /api/auth/register
router.post('/register', [
    (0, express_validator_1.check)('login', 'Поле "имя пользователя" не должно быть пустым').exists(),
    (0, express_validator_1.check)('pass', 'Поле "пароль" не должно быть пустым').exists()
], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let lastName = '', firstName = '', middleName = '';
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty())
            return res.status(400).json({ errors: errors.array(), message: 'Некорректные данные при регистрации.' });
        const _a = req.body, { fio, gender, telephone, login: userName, pass: password, otherData } = _a, other = __rest(_a, ["fio", "gender", "telephone", "login", "pass", "otherData"]);
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
        let candidate = yield users_1.default.getUser(userName);
        if (candidate)
            throw ApiError_1.default.BadRequest('Такой пользователь уже существует.');
        candidate = new User_1.default({
            userName,
            password,
            departament: 'Офис',
            status: 1,
            permissionGroupId: 1,
            firstName,
            lastName,
            middleName
        });
        const result = yield candidate.save();
        if (!result)
            ApiError_1.default.BadRequest('Во время регистрации возникла ошибка, обратись к администратору.');
        return res.status(201).json({ message: `Пользователь ${firstName || userName} успешно зарегистрирован.` });
    }
    catch (e) {
        next(e);
    }
}));
// /api/auth/login
router.post('/login', [
    (0, express_validator_1.check)('userName', 'Поле "имя пользователя" не должно быть пустым').exists(),
    (0, express_validator_1.check)('password', 'Поле "пароль" не должно быть пустым').exists()
], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const { userName, password, barcode } = req.body;
        let user;
        if (barcode) {
            const query = `
                    select B.ID_EMPLOYERS, B.ID_SECTOR, coalesce(B.STATUS_BARCODE, 0) as STATUS
                    from SECTORS_BARCODE B
                    where upper(B.BARCODE) = upper('${barcode}')`;
            const [code] = yield dataBase_1.default.executeRequest(query);
            if (!code)
                return res.status(400).json({ errors: ['Barcode is not found'], message: `Не корректный штрих - код.` });
            if (!code.ID_EMPLOYERS || !code.ID_SECTOR || code.ID_SECTOR == 14)
                return res.status(400).json({ errors: ['Barcode not activated'], message: `Карточка не активирована, обратитесь к администрации.` });
            if (parseInt(code.STATUS) != 0)
                return res.status(400).json({ errors: ['Card blocked'], message: `Карточка заблокирована, обратитесь к администрации.` });
            user = yield users_1.default.getUserToID(code.ID_EMPLOYERS);
            if (!user)
                return res.status(400).json({ errors: ['User is not found'], message: `Пользователь по данному штрихкоду не найден.` });
        }
        else {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty())
                return res.status(400).json({ errors: errors.array(), message: `Ошибка авторизации:\n${errors.array().join('\n')}` });
            user = yield users_1.default.getUser(userName);
            if (!user)
                return res.status(400).json({ errors: ['User is not found'], message: `Пользователя ${userName} не существует.` });
            const isMatch = yield bcryptjs_1.default.compare(user.getPasword(), password);
            if (!isMatch)
                return res.status(400).json({ errors: ['Wrong password'], message: 'Неверный пароль.' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, settings_1.default.secretKey, { expiresIn: '10h' });
        //console.log(token)
        //user.setToken(token);
        yield user.refrash();
        const sectorName = (_b = (yield virtualJournalsFun_1.default.getSectors()).find(s => s.id == (user === null || user === void 0 ? void 0 : user.sectorId))) === null || _b === void 0 ? void 0 : _b.name;
        const userLinks = yield links_1.default.getLinks(user);
        const permissionList = yield user.getPermissions();
        return res.status(200).json({ token, userId: user.id,
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
            } });
    }
    catch (e) {
        next(e);
    }
}));
exports.default = router;
