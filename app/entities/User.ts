import { throttle } from 'lodash';
import db from '../dataBase';
import ApiError from '../exceptions/ApiError';
import { createItmDb } from '../firebird/Firebird';
import links from '../systems/links';
import { getSectors } from '../systems/virtualJournalsFun';

import { ILoginData } from '../types/auth-types';
import { IDeletable, IRefrashable, ISavable } from '../types/system-types';
import { PermissionDbDto, PermissionDto, UserDto } from '../types/user';
import { DbUser, IUser } from '../types/user-types';


export default class User implements IUser,  ISavable<User>, IDeletable<User>, IRefrashable {
    id?: number;
    firstName?: string;
    lastName?: string;
    middleName?: string;

    userName?: string;
    password?: string;

    sectorId?: number;
    departament?: string;

    status?: number;
    location?: string;

    permissionGroupId?: number;
    permissionGroupName?: string;

    card?: string;
    cardHolder?: string;
    phone?: string;

    isOwner: boolean = false;
    token?: string;

    permissionList: PermissionDto[] = [];
 
    constructor (options: UserDto) {
        this.setDto(options);
    }
    delete(element: User): Promise<{ id: number; }> {
        throw new Error('Method not implemented.');
    }
    private setDto(options: UserDto): void {
        this.id                     = options.id;
        this.userName               = options.userName;
        this.password               = options.password;
        this.departament            = options.departament;
        this.sectorId               = options.sectorId;
        this.status                 = options.status;
        this.location               = options.location;
        this.permissionGroupId      = options.permissionGroupId;
        this.permissionGroupName    = options.permissionGroupName;
        this.firstName              = options.firstName;
        this.lastName               = options.lastName;
        this.middleName             = options.middleName;
        this.card                   = options.card;
        this.cardHolder             = options.cardHolder;
        this.phone                  = options.phone;
        this.isOwner                = options.isOwner || false;
    }
    getId(): number | null {
        return this.id||null;
    }
    getPasword(): string | null {
        return this.password||null;
    }
    getUserName(): string | null {
        return this.userName||null;
    }
    getToken(): string | null {
        return this.token||null;
    }
    getPermissions(): PermissionDto[] {
        return this.permissionList||[];
    }
    getFirstName(): string | null {
        return this.firstName||null;
    }
    getLastName(): string | null {
        return this.lastName||null;
    }
    getMiddleName(): string | null {
        return this.middleName||null;
    }
    getSector(): string | null {
        throw new Error('Method not implemented.');
    }
    getLocation(): string | null {
        return this.location||null;
    }
    getCard(): string | null {
        return this.card||null;
    }
    getCardHolder(): string | null {
        return this.location||null;
    }
    getPhone(): string | null {
        return this.phone||null;
    }
    getDepartament (): string | null {
        return this.departament||null;
    }

    setPasword(value: string): User {
        this.password = value;
        return this;
    }
  
    setUserName(value: string): User {
        this.userName = value;
        return this;
    }
    setToken(value: string): User {
        this.token = value;
        return this;
    }
    setPermissions(permissions: PermissionDto[]): User {
        this.permissionList = [...permissions];
        return this;
    }
    setFirstName(value: string): User {
        this.firstName = value;
        return this;
    }
    setLastName(value: string): User {
        this.lastName = value;
        return this;
    }
    setMiddleName(value: string): User {
        this.middleName = value;
        return this;
    }
    setSector(value: string): User {
        throw new Error('Method not implemented.');
    }
    setLocation(value: string): User {
        this.location = value;
        return this;
    }
    setCard(value: string): User {
        this.card = value;
        return this;
    }
    setCardHolder(value: string): User {
        this.cardHolder = value;
        return this;
    }
    setPhone(value: string): User {
        this.phone = value;
        return this;
    }
    
    async getDto (): Promise<ILoginData> {
        try {
            const sectors = await getSectors()
            const sector = sectors.find(s => s.id == this.sectorId);
            const permissionList = this.getPermissions()
            const userLinks         = await links.getLinks(this);
            const loginData: ILoginData = {
            token: this.token||'',
            userId: this.id||0,
            user: {
                userName:       this.userName||'', 
                firstName:      this.firstName, 
                lastName:       this.lastName, 
                middleName:     this.middleName, 
                isOwner:        this.isOwner,
                sectorId:       this.sectorId||0,
                sectorName:     sector?.name||'', 
                permissionList  ,
                links:          userLinks
            }
        }
        return loginData;
        } catch (e) {
            throw e;
        }
    }

    getPermissionGroupId (): number {
        if (!this.permissionGroupId) return 1;
        return this.permissionGroupId;
    }

    async permissionGroupIdreload (): Promise<void> {
        const [res] = await db.executeRequest(`select E.PERMISSION_GROUP_ID from EMPLOYERS E where E.ID = ${this.id}`);
        this.permissionGroupId = res?.PERMISSION_GROUP_ID || 1; // Присваиваем "гость" если группа не задана в БД.
    }
    
    async permissionCompare (permissionName: string): Promise<boolean> {
        try {
            if (!this.isOwner && this.permissionList.length == 0) await this.refrash(); 
            if (this.isOwner) return true;
            for (const permission of this.permissionList) 
                if (String(permission.name).toUpperCase() == String(permissionName).toUpperCase()) return !!permission.status; 
            return false;
        } catch (error) {
            console.log(error);
            return false;
        }
    }


    async refrash(): Promise<void> {
        try {
            const db = await createItmDb();
            const [dtoDb] = await db.executeRequest<DbUser>(`SELECT * FROM USER_DTOS U WHERE U.ID = ${this.getId()}`);
            if (!dtoDb) throw ApiError.BadRequest("Пользователь не сохранен в базу данных.")
            const dto = User.convertDbToDto(dtoDb);
            this.setDto(dto);
            if (!dto.isOwner) {
                const permissionsDb = await db.executeRequest<PermissionDbDto>(
                    `SELECT L.ID, L.ID_PERMISSION, P.NAME, P.DESCRIPTIONS, P.CATEGORY, L.STATUS
                        FROM PERMISSION_LIST L
                        LEFT JOIN PERMISSIONS P ON (L.ID_PERMISSION = P.ID)
                    WHERE L.ID_PERMISSION_GROUP = ?`, [this.getPermissionGroupId()]);
                const permissions: PermissionDto[] = permissionsDb.map(p => User.convertPermissionDbToDto(p));
                this.permissionList = [...permissions];
            }
             db.detach();
        } catch (e) {
            throw e;
        }
    }

    async save (): Promise<User> {
        try {
            const db = await createItmDb();
            if (!this.id) {
                const newEntry = await db.executeAndReturning<{ID: number}>(
                `INSERT INTO EMPLOYERS (NAME, MGMT_PASS, DEPARTMENT, LOCATION, FIRSTNAME, LASTNAME, MIDDLENAME, PERMISSION_GROUP_ID)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    RETURNING ID;`, 
                [this.getUserName(), this.getPasword(), this.getDepartament(), 
                    this.getLocation(), this.getFirstName(), this.getLastName(), this.getMiddleName(), this.getPermissionGroupId()]);
                if (!newEntry.ID) throw new Error("Ошибка создания пользователя");
                return this;
            }else {
                await db.execute(`UPDATE EMPLOYERS E SET
                                    E.NAME = ?, E.MGMT_PASS = ?, E.DEPARTMENT = ?, E.LOCATION = ?, E.FIRSTNAME = ?, E.LASTNAME = ?, E.MIDDLENAME = ?, E.PERMISSION_GROUP_ID = ?
                                    WHERE E.ID = ?`,
                    [this.getUserName(), this.getPasword(), this.getDepartament(), 
                        this.getLocation(), this.getFirstName(), this.getLastName(), 
                        this.getMiddleName(), this.getPermissionGroupId(), this.getId()]);
                db.detach();
                return this;
            }
        } catch (e) {
            throw e;
        }
    }

    static convertPermissionDbToDto (data: PermissionDbDto) : PermissionDto {
        const dto: PermissionDto = {
                id: data.ID,
                permissionId: data.ID_PERMISSION,
                name: data.NAME,
                description: data.DESCRIPTIONS,
                category: data.CATEGORY,
                status: data.STATUS
        }
        return dto;
    }

    static convertDbToDto (data: DbUser) : UserDto {
        try {
            const dto: UserDto = {
                id: data.ID||undefined,
                firstName: data.FIRSTNAME||undefined,
                lastName: data.LASTNAME||undefined,
                middleName: data.MIDDLENAME||undefined,
                userName: data.NAME||'',
                password: data.MGMT_PASS||undefined,
                sectorId: data.ID_SECTOR||undefined,
                departament:data.DEPARTMENT||undefined,
                status: data.STATUS||undefined,
                location: data.LOCATION||undefined,
                permissionGroupId: data.PERMISSION_GROUP_ID||undefined,
                permissionGroupName: data.PERMISSION_GROUP||undefined,
                card: data.BANK_CARD||undefined,
                cardHolder: data.CARD_HOLDER||undefined,
                phone: data.PHONE||undefined,
                isOwner: !!data.OWNER|| false
            }
            return dto;
        } catch (e) {
            throw e;
        }
    }
}