import User from "../entities/User";
import { createItmDb } from "../firebird/Firebird";
import { IDeletable, IRefrashable, ISystem, ISystemOptions } from "../types/system-types";
import { PermissionDbDto, PermissionDto } from "../types/user";
import { DbUser } from "../types/user-types";

export default class UserSystem implements ISystem<User>, IRefrashable, IDeletable<User> {
    private static instance: UserSystem;
    private elementList: User[] = [];
    private ppermissionList: PermissionDto[] = [];

    constructor() {
        if (UserSystem.instance) {
            return UserSystem.instance;
        }
        UserSystem.instance = this;
    }

    async add(item: User): Promise<User> {
        try {
            await item.save();
            return item;
        } catch (e) {
            throw e;
        }
    }

    async getToUserName (userName: string) : Promise<User|null> {
        try {
            const db = await createItmDb();
            try {
                const condidate = this.elementList.find(item => item?.userName?.toUpperCase() == userName.toUpperCase());
                if (condidate) return condidate;
                const [res] = await db.executeRequest<DbUser>(`SELECT * FROM USER_DTOS E WHERE UPPER(E.NAME) = UPPER('${userName}')`);
                if (!res.ID) return null;

                const dto = User.convertDbToDto(res);
                const user = new User(dto);

                if (!user.isOwner) {
                    const permissionsDb = await db.executeRequest<PermissionDbDto>(
                        `SELECT L.ID, L.ID_PERMISSION, P.NAME, P.DESCRIPTIONS, P.CATEGORY, L.STATUS
                                FROM PERMISSION_LIST L
                                LEFT JOIN PERMISSIONS P ON (L.ID_PERMISSION = P.ID)
                            WHERE L.ID_PERMISSION_GROUP = ?`, [user.getPermissionGroupId()]);
                    const permissions = permissionsDb.map(p => User.convertPermissionDbToDto(p));
                    user.setPermissions(permissions);
                }
                this.elementList.push(user);
            return user;
            } catch (e) {
                throw e;
            } finally {
                db.detach();
            }
        } catch (e) {
            throw e;
        }
    }

    async get(id: number): Promise<User|null> {
        try {
            const db = await createItmDb();
            try {
                const condidate = this.elementList.find(item => item?.id == id);
                if (condidate) return condidate;
                const [res] = await db.executeRequest<DbUser>(`SELECT * FROM USER_DTOS E WHERE E.ID = ?`, [id]);
                if (!res.ID) return null;

                const dto = User.convertDbToDto(res);
                const user = new User(dto);

                if (!user.isOwner) {
                    const permissionsDb = await db.executeRequest<PermissionDbDto>(
                        `SELECT L.ID, L.ID_PERMISSION, P.NAME, P.DESCRIPTIONS, P.CATEGORY, L.STATUS
                                FROM PERMISSION_LIST L
                                LEFT JOIN PERMISSIONS P ON (L.ID_PERMISSION = P.ID)
                            WHERE L.ID_PERMISSION_GROUP = ?`, [user.getPermissionGroupId()]);
                    const permissions = permissionsDb.map(p => User.convertPermissionDbToDto(p));
                    user.setPermissions(permissions);
                }
                this.elementList.push(user);
                return user;
            } catch (error) {
                console.log('Ошибка getUser', error);
                return null;
            } finally {
                db.detach();
            } 
        } catch (e) {
            throw e;
        }
    }
    async getAll(options?: ISystemOptions): Promise<User[]> {
        try {
            if (!this.elementList.length) await this.refrash();
            return this.elementList;
        } catch (e) {
            throw e;
        }
    }
    isEmpty(): boolean {
        return !this.elementList.length;
    }
    clear(): void {
        try {
            this.elementList.splice(0, this.elementList.length);
        } catch (e) {
            throw e;
        }
    }
    async refrash(): Promise<void> {
        try {
            const db = await createItmDb();
            try {
                this.clear();
                const userDbDtos = await db.executeRequest<DbUser>(`SELECT * FROM USER_DTOS E`);
                const permissionDbDtos = await db.executeRequest<PermissionDbDto>(
                    `SELECT L.ID, L.ID_PERMISSION, P.NAME, P.DESCRIPTIONS, P.CATEGORY, L.STATUS
                        FROM PERMISSION_LIST L LEFT JOIN PERMISSIONS P ON (L.ID_PERMISSION = P.ID)`);

                const userDtos = userDbDtos.map(u => User.convertDbToDto(u));
                const permissionDtos = permissionDbDtos.map(p => User.convertPermissionDbToDto(p));

                const users: User[] = [];
                for (const d of userDtos) {
                    const user = new User(d);
                    if (!user.isOwner) {
                        const permissions = permissionDtos.filter(p => p.id == d.id);
                        user.setPermissions(permissions);
                    }
                    users.push(user);
                }
                this.elementList = [...users];
            } catch (e) {
                throw e;
            }
        } catch (e) {
            throw e;
        }  
    }
    delete(element: User): Promise<number|null> {
        throw new Error("Method not implemented.");
    }
   
}