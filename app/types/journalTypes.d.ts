// Комментарий в журналах.
export declare interface JournalCommentDto {
    orderId: number;
    dataId: number;
    text: string;
}

export declare interface JournalSectorDto {
    id: number; 
    name: string;
    overdue: JournalOrderDto [], 
    forToday: JournalOrderDto [], 
    forFuture: JournalOrderDto []
}

export declare interface JournalOrderDto {
    id: number;
    itmOrderNum: string;
    sectorId: number; 
    sectorName: string;
    nameSectorInOrder:  string;
    datePlan: Date;
    fasadSquare: number;
    generalSquare: number;
    workingTime: number
    data: any;
}

export declare interface JournalPlansDb {
    ORDER_ID: number;
    DATE_SECTOR: string;
    DATE_DESCRIPTION: string;
    COMMENT: string;
    DATE1: Date;
    DATE2: Date;
    DATE3: Date;
}

export declare interface JournalAdoptedDto {
    id: number;
    itmOrderNum: string;
    transfer: string;
    accepted: string;
    statusOld: string;
    status: string;
    fasadSquare: number;
    date: Date;
    data: {
        comments?: JournalDataDto[],
        extraData?: JournalDataDto[]
    } 
}

export declare interface JournalDataDto {
    id?: number;
    journalId?: number;
    sectorId?: number;
    orderId?: number;
    employeeId?: number;
    group?: string;
    type?: string;
    name: string;
    data: string;
}

export declare interface JournalDataDb {
    ID: number;
    ID_JOURNAL: number;
    ID_SECTOR: number;
    ID_ORDER: number
    ID_EMPLOYEE: number;
    DATA_TYPE: string;
    DATA_GROUP: string;
    DATA_NAME: string;
    DATA_VALUE: string;
}

export declare interface JournalAdoptedDb {
    ID: number;
    ITM_ORDERNUM: string;
    ORDER_FASADSQ: number;
    ORDER_GENERALSQ: number;
    STATUS_DESCRIPTION: string;
    STATUS_NAME: string | null;
    JOURNAL_ID: number; 
    TRANSFER_DATE: Date 
    ID_JOURNAL_NAMES: number;
    ID_EMPLOYEE: number;
    ID_SECTOR: number;
    MODIFER: number;
}

export declare interface JournalStatusListOldDb {
    ID : number;
    STATUS_NUM: number;
    STATUS_DESCRIPTION: string;
}

export declare interface JournalSectorList {
    id: number;
    name: string;
    orderBy: number;
}

export declare interface JournalPlans {
    id: number;              
    orderId: number;          
    dateSector: string;     
    dateDescription: string;  
    comment: string;           
    date1: Date;             
    date2: Date;             
    date3: Date;              
}

export declare interface JournalPermission {
     name: string;
     data: JournalName[];
}

export declare interface  JournalName {
    id: number; 
    name: string;
    j: number[];
}

export declare interface JournalTransactionsDb {
    ID: number;
    DATE_ADDED: Date;
    NAME: string;
    MONEY: number;
}

export declare interface JournalSalaryDb {
    ID: number;
    ITM_ORDERNUM: string;
    ID_JOIRNAL: number;
    ID_SECTOR: number;
    SECTOR: string;
    ID_WORK_OF_COST: number;
    ID_WORK: number;
    WORK_NAME: string;
    ORDER_FASADSQ: number;
    PRICE: number;
    MONEY: number;
}

export declare interface JournalOtherTransDb {
    NAME: string;
    DESCRIPTION: string;
    AMOUNT: number; 
    MODIFER: number;
    TRANS_COMMENT: string
}
export declare interface JournalOtherTrans {
    userName: string;
    description: string;
    amount: number;
    comment: string;
    modifer: number;
}

export declare interface SalarySectorDto {
    id: number;
    journalNameId?: number;
    name: string;
    otherTransactoins: any;
    orders: any[];
}