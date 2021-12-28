import User from "../entities/User"
import { IBarcode } from "./at-order-types";
import { ILoginData } from "./auth-types";
import { PermissionDto, UserDto } from "./user";

export declare interface IUser {
    /** Гетеры */

    getId(): number | null;

    getDto(): Promise<ILoginData>;

    getPasword (): string| null;
    getUserName (): string| null;

    getToken (): string| null;
    getPermissions (): PermissionDto[];
    getFirstName (): string| null;
    getLastName (): string| null;
    getMiddleName (): string| null;
    getSector (): string| null;
    getLocation (): string| null;
    getCard (): string| null;
    getCardHolder (): string| null;
    getPhone (): string| null;
    getDepartament (): string| null;

    /** Сетеры */

    setPasword (value: string): User;
    setUserName (value: string): User;

    setToken (value: string): User;
    setPermissions (permissions: PermissionDto[]): User;
    setFirstName (value: string): User;
    setLastName (value: string): User;
    setMiddleName (value: string): User;
    setSector (value: string): User;
    setLocation (value: string): User;
    setCard (value: string): User;
    setCardHolder (value: string): User;
    setPhone (value: string): User;

    permissionCompare (permissionName: string): Promise<boolean>;
}

export declare interface DbUser {
    ID                   : number | null,
    MGMT_PASS            : string | null,
    NAME                 : string | null,
    ID_SECTOR            : number | null,
    DEPARTMENT           : string | null,
    STATUS               : number | null,
    LOCATION             : string | null,
    FIRSTNAME            : string | null,
    LASTNAME             : string | null,
    MIDDLENAME           : string | null,
    BANK_CARD            : string | null,
    CARD_HOLDER          : string | null,
    PHONE                : string | null,
    PERMISSION_GROUP_ID  : number | null,
    PERMISSION_GROUP     : string | null,
    OWNER                : number | null;  
}

/**
 *  id?: number;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    userName: string;
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
    isOwner?: boolean;
 */