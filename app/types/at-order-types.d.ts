import { IExtraData } from "./extraDataTypes"

export declare interface BarcodesDb {

    BARCODE: string
    ID_SECTOR: number; 
    SECTOR: string;
    ID_EMPLOYERS: number | null;
    EMPLOYEE: string;
    BLOCKED: number;
}
/** * Обект штрих - кода */
export declare interface IBarcode {
    barcode: string;
    idSector: number;
    sector: string;
    employeeId: number| null;
    employee: string;
    blocked: number;
}
/** * Елемент заказа, передаваемый клиентом, для примема - передачи заказов. */
export declare interface ITransferOrderElement {
    idOrder: number;
    comment: string;
    completed?: boolean;
    description?: string;
    modiferCount?: number;
}
/** * Обект body отправляемый клиентом для приема - передачи заказов в журналах. */
export declare interface ITransferOrders {
    idTransfer: string;
    idAccepted: string;
    date: Date;
    orders: ITransferOrderElement[];
    extraData: IExtraData[];
}

export declare interface IDependenciesDb {
    ID: number;
    ID_SECTOR_TRANSFER: number;
    ID_SECTOR_ACCEPTED: number;
    ID_JOURNAL_NAME: number;
    ID_STATUS_AFTER : number; 
    ID_STATUS_AFTER_OLD: number; 
    START_STAGE: number;
}

export declare interface IDependencies {
    id: number;
    transfer: number;
    accepted: number;
    journalNameId: number;
    statusAfterOldId: number;
    statusAfterId: number;
    startStage: boolean;
}

export declare interface IAtOrdersDb {
    ID: number;
    ITM_ORDERNUM: string;
    OLD_STATUS_ID: number; 
    STATUS_DESCRIPTION: string; 
    STATUS_ID: number;
    JOURNAL_ID: number; 
    JOURNAL_NAME: string;
}

export declare interface IAtOrder {
    id: number;
    itmOrdernum: string;
    statusOldSectorId: number;
    statusOld: string;
    statusId: number;
    journalId: number;
    journalName: string;
}

export declare interface IWorkOrdersDb {
    ID: number;
    ORDER_ID: number; 
    DATE_SECTOR: string; 
    DATE_DESCRIPTION: string;
    COMMENT: string;
    DATE1: Date;
    DATE2: Date; 
    DATE3: Date;
}

export declare interface IWorkOrders {
    id: number;
    orderId: number;
    dateSector: string; 
    dateDescription: string; 
    comment: string; 
    date1: Date;
    date2: Date;
    date3: Date;
}

export declare interface ILocationOrderDb {
    ID_ORDER: number;
    ID_SECTOR: number;
    MODIFER: number;
}

export declare interface ILocationOrder {
    orderId: number;
    sectorId: number;
    modifer: number;
}

export declare interface IStatusAndLocation {
    statusOldId: number; 
    statusOld: string; 
    statusOldNum: number;
    statusId: number | null; 
    status: string | null;
    manager: string; 
    locationId: number | null; 
    location: string | null;
}

export declare interface IStatusAndLocationDb {
    MANAGER: string;
    OLD_STATUS: string;
    ID_OLD_STATUS: number;
    OLD_STATUS_NUM: number;
    ID_STATUS: number;
    STATUS: string;
    ID_LOCATION: number;
    LOCATION: string;
}



