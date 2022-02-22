export declare interface DbExtraData {
    ID           :number|null;
    ID_JOURNAL   :number|null;
    ID_SECTOR    :number|null;
    ID_ORDER     :number|null;
    ID_EMPLOYEE  :number|null;
    DATA_GROUP   :string|null;
    DATA_NAME    :string|null;
    DATA_VALUE   :string|null;
    DATA_TYPE    :string|null;
    TS           :Date|null;   
}

export declare interface DbExtraDataView {
    ID          :number|null;
    ID_JOURNAL  :number|null;
    ID_SECTOR   :number|null;
    ID_ORDER    :number|null;
    ID_EMPLOYEE :number|null;
    DATA_GROUP  :string|null;
    DATA_NAME   :string|null;
    DATA_VALUE  :string|null;
    DATA_TYPE   :string|null;
    EMPLOYEE    :string|null;
    SECTOR      :string|null;
    TS          :Date|null; 
}

export declare interface DbExtraDataPack {
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

export declare interface ExtraData {
    id?: number;
    journalId?: number;
    sectorId?: number;
    orderId?: number;
    employeeId?: number;
    group?: string;
    name?: string;
    data?: string;
    type?: string;
    userName?:  string;
    sector?:   string;
    ts?:    Data;
    list?: string [];
}

export declare interface ExtraDataList {
    id: number;
    name: string;
    value: string;
}