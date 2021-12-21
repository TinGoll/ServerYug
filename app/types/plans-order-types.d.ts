import { IExtraData } from "./extraDataTypes";
import { JournalDataDto } from "./journalTypes";

export declare interface IPlanOrderDb {
    ID: number;
    ITM_ORDERNUM: string;

    ORDER_GENERALSQ: number|null; 
    ORDER_FASADSQ: number|null;

    OLD_STATUS_NUM: number; 
    OLD_STATUS: string;

    ID_STATUS: number;

    CLIENT: string;

    PROFILER: number|null;
    IS_PREPAID: number|null;

    ID_JOURNAL: number|null;
    ID_JOURNAL_NAMES: number|null;

    DATE_PLAN: Date|null;
    TRANSFER_DATE: Date|null;

    PLAN_SECTOR_ID: number|null;
    PLAN_SECTOR: string|null;

    WORKER: string|null;

    TRANSFER_ID: number|null;
    ACCEPTED_ID: number|null;
    LOCATION_ID: number|null; 

    EMPLOYEE_ACCEPTED_ID: number|null;
    EMPLOYEE_TRANSFER_ID: number|null;
}

export declare interface IPlanOrder {
    /** id заказа */
    id: number;
    /** Название заказа */
    itmOrderNum: string;
    /** Площадь фасадов в заказе */
    fasadSquare: number;
    /** Площадь отделки */
    generalSquare: number;
    /** номер старого статуса (float) */
    statusOldNum: number;
    /** Название старого статуса */
    statusOldName: string;
    /** id нового статуса, может быть null */
    statusId: number|null;
    /** Название нового статуса, может быть null */
    status: string|null;
    /** Имя клиента в заказе */
    client: string;
    /** Являеться ли клиент профильщиком */
    isProfiler: boolean;
    /** Работает ли клиент с предоплатой */
    isPrepaid: boolean;
    /** Id журнала , если заказ принят может быть null */
    journalId: number|null;
    /** Название журнала , если заказ принят может быть null */
    journalNameId: number|null;
    /** Дата приема / передачи, может быть null */
    transferDate: Date|null;
    /** Плановая дата в заказе, может быть null*/
    datePlan: Date|null;
    /**  id участка */
    sectorId: number|null;
    /** Название участка, может быть null */
    sectorName: string|null;
    /** Имя работника */
    workerName:  string|null;
    /** Время которое прошло с момента приема, может быть null */
    workingTime: number
    /** id участка передавшего заказ, может быть null */
    transferSectorId: number| null;
    /** id участка принявшего заказ, может быть null */
    accepdedSectorId: number| null;
    /** id участка в котором на данный момент находиться заказ, может быть null */
    locationSectorId: number| null; 
    /** ID сотрудника, передающего участка */
    transferEmployeeId: number|null;
    /** ID сотрудника, принимающего участка */
    accepdedEmployeeId: number|null;
    /** Имя сотрудника, принимающего участка */
    accepdedEmployee: string|null;
    /** Имя сотрудника, передающего участка */
    transferEmployee: string|null;
    /** название участка передавшего заказ, может быть null */
    transferSector: string| null;
    /** название участка принявшего заказ, может быть null */
    accepdedSector: string| null;
    /** Название участка в котором на данный момент находиться заказ, может быть null */
    locationSector: string| null;
    /** Дополнительные данные */
    data: {
        /** Комментарии к записи, видны во всех журналах, привязаны к ID заказа */
        comments?: JournalDataDto[],
        /** Дополнительные данные, видны только в конкретной записи. */
        extraData?: JournalDataDto[]
    };
}