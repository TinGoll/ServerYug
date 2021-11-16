export declare interface UserDto {
    id?: number;
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
}

export declare interface PermissionDto {
    id: number;
    permissionId: number;
    name: string;
    description: string;
    category: string;
    status: number;
}

export declare interface PermissionDbDto {
    ID: number;
    ID_PERMISSION: number;
    NAME: string;
    DESCRIPTIONS: string; 
    CATEGORY: string;
    STATUS: number;
}
export declare interface decodedDto {
    userId: number;
}

export declare interface EmployersDb {
    MGMT_PASS:            string,
    ID:                   number,
    NAME:                 string,
    ID_SECTOR:            number,
    DEPARTMENT:           string,
    STATUS:               number,
    LOCATION:             string,
    FIRSTNAME:            string,
    LASTNAME:             string,
    MIDDLENAME:           string,
    BANK_CARD:            string,
    CARD_HOLDER:          string,
    PHONE:                string,
    PERMISSION_GROUP_ID:  number
}