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
exports.createUser = exports.getUserToID = exports.getUser = exports.getAllUsers = exports.getUserToToken = void 0;
const User_1 = __importDefault(require("../entities/User"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ApiError_1 = __importDefault(require("../exceptions/ApiError"));
const settings_1 = __importDefault(require("../settings"));
const user_system_1 = __importDefault(require("./user-system"));
const getUserToToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!token)
            throw new Error();
        const decoded = jsonwebtoken_1.default.verify(token, settings_1.default.secretKey);
        const user = yield (0, exports.getUserToID)(decoded.userId);
        if (!user)
            throw new Error();
        if (!user.isOwner && user.permissionList.length == 0)
            yield user.refrash();
        return user;
    }
    catch (e) {
        throw ApiError_1.default.UnauthorizedError();
    }
});
exports.getUserToToken = getUserToToken;
const getAllUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const system = new user_system_1.default();
        const users = yield system.getAll();
        return users;
    }
    catch (e) {
        throw e;
    }
});
exports.getAllUsers = getAllUsers;
const getUser = (userName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const system = new user_system_1.default();
        const user = yield system.getToUserName(userName);
        return user;
    }
    catch (e) {
        throw e;
    }
});
exports.getUser = getUser;
const getUserToID = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const system = new user_system_1.default();
        const user = yield system.get(id);
        return user;
    }
    catch (e) {
        throw e;
    }
});
exports.getUserToID = getUserToID;
const createUser = (options) => {
    const user = new User_1.default({
        id: options.ID,
        password: options.MGMT_PASS,
        userName: options.NAME,
        firstName: options.FIRSTNAME,
        lastName: options.LASTNAME,
        middleName: options.MIDDLENAME,
        departament: options.DEPARTMENT,
        sectorId: options.ID_SECTOR,
        status: options.STATUS,
        location: options.LOCATION,
        permissionGroupId: options.PERMISSION_GROUP_ID,
        permissionGroupName: options.PERMISSION_GROUP,
        card: options.BANK_CARD,
        cardHolder: options.CARD_HOLDER,
        phone: options.PHONE
    });
    return user;
};
exports.createUser = createUser;
exports.default = {
    getUser: exports.getUser,
    getUserToID: exports.getUserToID,
    getAllUsers: exports.getAllUsers
};
