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
const dataBase_1 = __importDefault(require("../dataBase"));
const ApiError_1 = __importDefault(require("../exceptions/ApiError"));
const Firebird_1 = require("../firebird/Firebird");
const links_1 = __importDefault(require("../systems/links"));
const virtualJournalsFun_1 = require("../systems/virtualJournalsFun");
class User {
    constructor(options) {
        this.isOwner = false;
        this.permissionList = [];
        this.setDto(options);
    }
    delete(element) {
        throw new Error('Method not implemented.');
    }
    setDto(options) {
        this.id = options.id;
        this.userName = options.userName;
        this.password = options.password;
        this.departament = options.departament;
        this.sectorId = options.sectorId;
        this.status = options.status;
        this.location = options.location;
        this.permissionGroupId = options.permissionGroupId;
        this.permissionGroupName = options.permissionGroupName;
        this.firstName = options.firstName;
        this.lastName = options.lastName;
        this.middleName = options.middleName;
        this.card = options.card;
        this.cardHolder = options.cardHolder;
        this.phone = options.phone;
        this.isOwner = options.isOwner || false;
    }
    getId() {
        return this.id || null;
    }
    getPasword() {
        return this.password || null;
    }
    getUserName() {
        return this.userName || null;
    }
    getToken() {
        return this.token || null;
    }
    getPermissions() {
        return this.permissionList || [];
    }
    getFirstName() {
        return this.firstName || null;
    }
    getLastName() {
        return this.lastName || null;
    }
    getMiddleName() {
        return this.middleName || null;
    }
    getSector() {
        throw new Error('Method not implemented.');
    }
    getLocation() {
        return this.location || null;
    }
    getCard() {
        return this.card || null;
    }
    getCardHolder() {
        return this.location || null;
    }
    getPhone() {
        return this.phone || null;
    }
    getDepartament() {
        return this.departament || null;
    }
    setPasword(value) {
        this.password = value;
        return this;
    }
    setUserName(value) {
        this.userName = value;
        return this;
    }
    setToken(value) {
        this.token = value;
        return this;
    }
    setPermissions(permissions) {
        this.permissionList = [...permissions];
        return this;
    }
    setFirstName(value) {
        this.firstName = value;
        return this;
    }
    setLastName(value) {
        this.lastName = value;
        return this;
    }
    setMiddleName(value) {
        this.middleName = value;
        return this;
    }
    setSector(value) {
        throw new Error('Method not implemented.');
    }
    setLocation(value) {
        this.location = value;
        return this;
    }
    setCard(value) {
        this.card = value;
        return this;
    }
    setCardHolder(value) {
        this.cardHolder = value;
        return this;
    }
    setPhone(value) {
        this.phone = value;
        return this;
    }
    getDto() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sectors = yield (0, virtualJournalsFun_1.getSectors)();
                const sector = sectors.find(s => s.id == this.sectorId);
                const permissionList = this.getPermissions();
                const userLinks = yield links_1.default.getLinks(this);
                const loginData = {
                    token: this.token || '',
                    userId: this.id || 0,
                    user: {
                        userName: this.userName || '',
                        firstName: this.firstName,
                        lastName: this.lastName,
                        middleName: this.middleName,
                        isOwner: this.isOwner,
                        sectorId: this.sectorId || 0,
                        sectorName: (sector === null || sector === void 0 ? void 0 : sector.name) || '',
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
    getPermissionGroupId() {
        if (!this.permissionGroupId)
            return 1;
        return this.permissionGroupId;
    }
    permissionGroupIdreload() {
        return __awaiter(this, void 0, void 0, function* () {
            const [res] = yield dataBase_1.default.executeRequest(`select E.PERMISSION_GROUP_ID from EMPLOYERS E where E.ID = ${this.id}`);
            this.permissionGroupId = (res === null || res === void 0 ? void 0 : res.PERMISSION_GROUP_ID) || 1; // Присваиваем "гость" если группа не задана в БД.
        });
    }
    permissionCompare(permissionName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.isOwner && this.permissionList.length == 0)
                    yield this.refrash();
                if (this.isOwner)
                    return true;
                for (const permission of this.permissionList)
                    if (String(permission.name).toUpperCase() == String(permissionName).toUpperCase())
                        return !!permission.status;
                return false;
            }
            catch (error) {
                console.log(error);
                return false;
            }
        });
    }
    refrash() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, Firebird_1.createItmDb)();
                const [dtoDb] = yield db.executeRequest(`SELECT * FROM USER_DTOS U WHERE U.ID = ${this.getId()}`);
                if (!dtoDb)
                    throw ApiError_1.default.BadRequest("Пользователь не сохранен в базу данных.");
                const dto = User.convertDbToDto(dtoDb);
                this.setDto(dto);
                if (!dto.isOwner) {
                    const permissionsDb = yield db.executeRequest(`SELECT L.ID, L.ID_PERMISSION, P.NAME, P.DESCRIPTIONS, P.CATEGORY, L.STATUS
                        FROM PERMISSION_LIST L
                        LEFT JOIN PERMISSIONS P ON (L.ID_PERMISSION = P.ID)
                    WHERE L.ID_PERMISSION_GROUP = ?`, [this.getPermissionGroupId()]);
                    const permissions = permissionsDb.map(p => User.convertPermissionDbToDto(p));
                    this.permissionList = [...permissions];
                }
                db.detach();
            }
            catch (e) {
                throw e;
            }
        });
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, Firebird_1.createItmDb)();
                if (!this.id) {
                    const newEntry = yield db.executeAndReturning(`INSERT INTO EMPLOYERS (NAME, MGMT_PASS, DEPARTMENT, LOCATION, FIRSTNAME, LASTNAME, MIDDLENAME, PERMISSION_GROUP_ID)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    RETURNING ID;`, [this.getUserName(), this.getPasword(), this.getDepartament(),
                        this.getLocation(), this.getFirstName(), this.getLastName(), this.getMiddleName(), this.getPermissionGroupId()]);
                    if (!newEntry.ID)
                        throw new Error("Ошибка создания пользователя");
                    return this;
                }
                else {
                    yield db.execute(`UPDATE EMPLOYERS E SET
                                    E.NAME = ?, E.MGMT_PASS = ?, E.DEPARTMENT = ?, E.LOCATION = ?, E.FIRSTNAME = ?, E.LASTNAME = ?, E.MIDDLENAME = ?, E.PERMISSION_GROUP_ID = ?
                                    WHERE E.ID = ?`, [this.getUserName(), this.getPasword(), this.getDepartament(),
                        this.getLocation(), this.getFirstName(), this.getLastName(),
                        this.getMiddleName(), this.getPermissionGroupId(), this.getId()]);
                    db.detach();
                    return this;
                }
            }
            catch (e) {
                throw e;
            }
        });
    }
    static convertPermissionDbToDto(data) {
        const dto = {
            id: data.ID,
            permissionId: data.ID_PERMISSION,
            name: data.NAME,
            description: data.DESCRIPTIONS,
            category: data.CATEGORY,
            status: data.STATUS
        };
        return dto;
    }
    static convertDbToDto(data) {
        try {
            const dto = {
                id: data.ID || undefined,
                firstName: data.FIRSTNAME || undefined,
                lastName: data.LASTNAME || undefined,
                middleName: data.MIDDLENAME || undefined,
                userName: data.NAME || '',
                password: data.MGMT_PASS || undefined,
                sectorId: data.ID_SECTOR || undefined,
                departament: data.DEPARTMENT || undefined,
                status: data.STATUS || undefined,
                location: data.LOCATION || undefined,
                permissionGroupId: data.PERMISSION_GROUP_ID || undefined,
                permissionGroupName: data.PERMISSION_GROUP || undefined,
                card: data.BANK_CARD || undefined,
                cardHolder: data.CARD_HOLDER || undefined,
                phone: data.PHONE || undefined,
                isOwner: !!data.OWNER || false
            };
            return dto;
        }
        catch (e) {
            throw e;
        }
    }
}
exports.default = User;
