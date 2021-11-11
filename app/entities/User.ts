import db from '../dataBase';
import { PermissionDbDto, PermissionDto, UserDto } from '../types/user';

export default class User {
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
    token?: string = '';
    permissionList: PermissionDto[] = [];
 

    constructor (options: UserDto) {
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
        
    }

    setPasword (password: string): void {this.password = password;}
    getPasword (): string | undefined {return this.password;}
    getPermission (): PermissionDto[] {return this.permissionList;}

    setToken (token: string): void {this.token = token;} 
    getToken (): string | undefined {return this.token;}
    getpermissionGroupId (): number {
        if (!this.permissionGroupId) return 1;
        return this.permissionGroupId;
    }
    async permissionGroupIdreload (): Promise<void> {
        const [res] = await db.executeRequest(`select E.PERMISSION_GROUP_ID from EMPLOYERS E where E.ID = ${this.id}`);
        this.permissionGroupId = res?.PERMISSION_GROUP_ID || 1; // Присваиваем "гость" если группа не задана в БД.
    }
    async permissionLoad (): Promise<void> {
        await this.permissionGroupIdreload();
        const groupId: number = this.getpermissionGroupId();
        const [group] = await db.executeRequest(`select G.OWNER from PERMISSIONS_GROUP G where G.ID = ${groupId}`); 
        this.isOwner = !!group.OWNER;
        if (this.isOwner) return;

        const res: PermissionDbDto[] = await db.executeRequest(`SELECT L.ID, L.ID_PERMISSION, P.NAME, P.DESCRIPTIONS, P.CATEGORY, L.STATUS
                                                            FROM PERMISSION_LIST L
                                                            LEFT JOIN PERMISSIONS P ON (L.ID_PERMISSION = P.ID)
                                                            WHERE L.ID_PERMISSION_GROUP = ${groupId}`);
        this.permissionList = res.map(p => {
            return {
                id: p.ID,
                permissionId: p.ID_PERMISSION,
                name: p.NAME,
                description: p.DESCRIPTIONS,
                category: p.CATEGORY,
                status: p.STATUS
            }
        });

    }
    async permissionCompare (name: string): Promise<boolean> {
        try {
            if (!this.isOwner && this.permissionList.length == 0) await this.permissionLoad(); 
            if (this.isOwner) return true;
            for (const permission of this.permissionList) 
                if (String(permission.name).toUpperCase() == String(name).toUpperCase()) return !!permission.status; 
            return false;
        } catch (error) {
            console.log(error);
            return false;
        }
    }
    async save (): Promise<boolean> {
        const query = `
        insert into EMPLOYERS (NAME, MGMT_PASS, DEPARTMENT, STATUS, LOCATION, FIRSTNAME, LASTNAME, MIDDLENAME, PERMISSION_GROUP_ID)
        values (
            '${this.userName}', 
            '${this.password}', 
            '${this.departament || ""}', 
            ${this.status || 1}, 
            '${this.location || ""}', 
            '${this.firstName || ""}', 
            '${this.lastName || ""}', 
            '${this.middleName || ""}',
            ${this.permissionGroupId || 1}
        )
        returning ID;`;

        const result: any = await db.executeRequest(query);
        const {ID} = result;

        if (ID && ID > 0) {
            this.id = ID;
            return true;
        }
        else return false
    }
    async load (id: number): Promise<boolean> {return false}
}