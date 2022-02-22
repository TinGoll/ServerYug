import { ExtraData } from "./extra-data-types";
import { JournalDataDto } from "./journalTypes";

export declare interface IAdopted {
    orders: IAdoptedOrder[];
    count: number;
    pages: number;
}

export declare interface IAdoptedOptions {
    limit?: number;
    page?: number;
    sort?: string;
    d1?: Date;
    d2?: Date;
    filter?: string;
}

export declare interface IAdoptedOrderDb {
    ID: number; 
    JOURNAL_ID: number;
    TRANSFER_DATE: Date;
    ITM_ORDERNUM: string;
    CLIENT: string; 
    MANAGER: string; 
    ORDER_FASADSQ: number|null;
    OLD_STATUS: string
    STATUS: string|null;
    STATUS_ID: number|null;
    TRANSFER_ID: number;
    TRANSFER_EMPLOYEE_ID: number|null;
    ACCEPTED_ID: number;
    ACCEPTED_EMPLOYEE_ID: number|null;
}

export declare interface ITransferredOrdersDb {
    ID              : number;
    JOURNAL_ID      : number;
    ID_JOURNAL_NAMES: number;
    ITM_ORDERNUM    : string;
    CLIENT          : string;
    MANAGER         : string;
    ORDER_FASADSQ   : number|null;
    TRANSFER_DATE   : Date;
    STATUS          : string|null;
    STATUS_ID       : number|null;
    EMPLOYEE        : string|null;
    SECTOR          : string|null;
    ID_EMPLOYEE     : number|null;
    ID_SECTOR       : number|null;
    MODIFER         : number;
    TS              : Date|null;
}

export declare interface IAdoptedOrder {
    id:                 number;
    journalId:          number;
    itmOrderNum:        string;
    transfer:           string;
    employeeTransfer:   string;
    client:             string;
    manager:            string;
    accepted:           string;
    employeeAccepted:   string;
    statusOld:          string;
    status:             string;
    statusId:           number|null;
    fasadSquare:        number;
    date:               Date;
    workTime?:          number;
    transfered?:        string;
    transferedData?:    Date;
    data:           {
        comments?: ExtraData[],
        extraData?: ExtraData[]
    }
}

export declare interface ITransferredOrders {
    id              : number;
    journalId       : number;
    journalNamesId  : number;
    itmOrderNum     : string;
    client          : string;
    manager         : string;
    fasadSquare     : number|null;
    transferDate    : Date;
    status          : string|null;
    statusId        : number|null;
    employee        : string|null;
    sector          : string|null;
    employeeId      : number|null;
    sectorId        : number|null;
    modifer         : number;
    ts              : Date|null;
}


