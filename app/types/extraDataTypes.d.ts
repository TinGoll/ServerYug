export declare interface IExtraData {
    orderId: number
    journalId: number;
    group: string;
    type: string;
    name: string;
    list: any[];
    data: string;
}
export declare interface IExtraDataDb {
    ID:             number;
    ID_JOURNAL:     number;
    ID_SECTOR:      number;
    ID_ORDER:       number;
    ID_EMPLOYEE:    number;
    DATA_GROUP:     string; 
    DATA_NAME:      string;
    DATA_VALUE:     string;
    DATA_TYPE:      string;
}