export declare interface ICreateUserOptions {
    fio?: string; 
    gender?: string; 
    telephone?: string 
    login: string;
    pass: string;
    otherData?: any;
}

export declare interface ILink {
    link: string; 
    status: boolean;
}
export declare interface ILoginData {
    token: string; 
    userId: number;
    user: IUserDto;
}

export declare interface IUserDto {
    userName:       string;
    firstName?:     string;
    lastName?:      string;
    middleName?:    string;
    isOwner:        boolean;
    sectorId:       number;
    sectorName:     string;
    permissionList: PermissionDto[];
    links:          ILink[];
}
