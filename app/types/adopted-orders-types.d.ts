import { JournalDataDto } from "./journalTypes";

export declare interface IAdopted {
    orders: IAdoptedOrder[];
    count: number;
    pages: number;
}

export declare interface IAdoptedOrder {
    id:                 number;
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
    data:           {
        comments?: JournalDataDto[],
        extraData?: JournalDataDto[]
    }
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

