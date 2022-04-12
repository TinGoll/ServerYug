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
const User_1 = __importDefault(require("../entities/User"));
const Firebird_1 = require("../firebird/Firebird");
class UserSystem {
    constructor() {
        this.elementList = [];
        this.ppermissionList = [];
        if (UserSystem.instance) {
            return UserSystem.instance;
        }
        UserSystem.instance = this;
    }
    add(item) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield item.save();
                return item;
            }
            catch (e) {
                throw e;
            }
        });
    }
    getToUserName(userName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, Firebird_1.createItmDb)();
                try {
                    const condidate = this.elementList.find(item => { var _a; return ((_a = item === null || item === void 0 ? void 0 : item.userName) === null || _a === void 0 ? void 0 : _a.toUpperCase()) == userName.toUpperCase(); });
                    if (condidate)
                        return condidate;
                    const [res] = yield db.executeRequest(`SELECT * FROM USER_DTOS E WHERE UPPER(E.NAME) = UPPER('${userName}')`);
                    if (!res.ID)
                        return null;
                    const dto = User_1.default.convertDbToDto(res);
                    const user = new User_1.default(dto);
                    if (!user.isOwner) {
                        const permissionsDb = yield db.executeRequest(`SELECT L.ID, L.ID_PERMISSION, P.NAME, P.DESCRIPTIONS, P.CATEGORY, L.STATUS
                                FROM PERMISSION_LIST L
                                LEFT JOIN PERMISSIONS P ON (L.ID_PERMISSION = P.ID)
                            WHERE L.ID_PERMISSION_GROUP = ?`, [user.getPermissionGroupId()]);
                        const permissions = permissionsDb.map(p => User_1.default.convertPermissionDbToDto(p));
                        user.setPermissions(permissions);
                    }
                    this.elementList.push(user);
                    return user;
                }
                catch (e) {
                    throw e;
                }
                finally {
                    db.detach();
                }
            }
            catch (e) {
                throw e;
            }
        });
    }
    get(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, Firebird_1.createItmDb)();
                try {
                    const condidate = this.elementList.find(item => (item === null || item === void 0 ? void 0 : item.id) == id);
                    if (condidate)
                        return condidate;
                    const [res] = yield db.executeRequest(`SELECT * FROM USER_DTOS E WHERE E.ID = ?`, [id]);
                    if (!res.ID)
                        return null;
                    const dto = User_1.default.convertDbToDto(res);
                    const user = new User_1.default(dto);
                    if (!user.isOwner) {
                        const permissionsDb = yield db.executeRequest(`SELECT L.ID, L.ID_PERMISSION, P.NAME, P.DESCRIPTIONS, P.CATEGORY, L.STATUS
                                FROM PERMISSION_LIST L
                                LEFT JOIN PERMISSIONS P ON (L.ID_PERMISSION = P.ID)
                            WHERE L.ID_PERMISSION_GROUP = ?`, [user.getPermissionGroupId()]);
                        const permissions = permissionsDb.map(p => User_1.default.convertPermissionDbToDto(p));
                        user.setPermissions(permissions);
                    }
                    this.elementList.push(user);
                    return user;
                }
                catch (error) {
                    console.log('Ошибка getUser', error);
                    return null;
                }
                finally {
                    db.detach();
                }
            }
            catch (e) {
                throw e;
            }
        });
    }
    getAll(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.elementList.length)
                    yield this.refrash();
                return this.elementList;
            }
            catch (e) {
                throw e;
            }
        });
    }
    isEmpty() {
        return !this.elementList.length;
    }
    clear() {
        try {
            this.elementList.splice(0, this.elementList.length);
        }
        catch (e) {
            throw e;
        }
    }
    refrash() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, Firebird_1.createItmDb)();
                try {
                    this.clear();
                    const userDbDtos = yield db.executeRequest(`SELECT * FROM USER_DTOS E`);
                    const permissionDbDtos = yield db.executeRequest(`SELECT L.ID, L.ID_PERMISSION, P.NAME, P.DESCRIPTIONS, P.CATEGORY, L.STATUS
                        FROM PERMISSION_LIST L LEFT JOIN PERMISSIONS P ON (L.ID_PERMISSION = P.ID)`);
                    const userDtos = userDbDtos.map(u => User_1.default.convertDbToDto(u));
                    const permissionDtos = permissionDbDtos.map(p => User_1.default.convertPermissionDbToDto(p));
                    const users = [];
                    for (const d of userDtos) {
                        const user = new User_1.default(d);
                        if (!user.isOwner) {
                            const permissions = permissionDtos.filter(p => p.id == d.id);
                            user.setPermissions(permissions);
                        }
                        users.push(user);
                    }
                    this.elementList = [...users];
                }
                catch (e) {
                    throw e;
                }
            }
            catch (e) {
                throw e;
            }
        });
    }
    delete(element) {
        throw new Error("Method not implemented.");
    }
}
exports.default = UserSystem;
