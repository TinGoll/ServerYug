export declare interface BarcodesDb {
    BARCODE: string
    ID_SECTOR: number; 
    SECTOR: string;
    ID_EMPLOYEE: number | null;
    EMPLOYEE: string;
    BLOCKED: number;
}

export declare interface OrderBody {
    id?: number;
    orderId?: number;
    name?: string;
    height?: number;
    width?: number;
    amount?: number;
    square?: number;
    comment?: string;
    unit?: string;
    cost?: number;
    calcAs?: string;
    costSng?: number;
    priceCost?: number;
    priceMod?: string;
    calcComment?: string;
}

export declare interface OrderHeader {
    id?: number;              
    itmOrderNum?: string;  
    client?: string;      
    orderType?: string;  
    viewMode?: string;          
    manager?: string;            
    fasadMaterial?: string;        
    fasadModel?: string;          
    profileWidth?: string;  
    assemblyAngle?: string;       
    texture?: string;            
    filenkaMaterial?: string;   
    filenkaModel?: string;          
    filenkaColor?: string;          
    color?: string;                
    colorType?: string;  
    colorLak?: string;  
    colorLakComment?: string;  
    colorPatina?: string;  
    colorPatinaComment?: string;     
    square?: number; 
    squareFasad?: number;               
    dateFactOrderOut?: string;      
    status?: string;
    statusNum?: number;            
    city?: string;
    cost?: number;
    totalCost?: number;
    pay?: number;
    debt?: number;
    dateFirstStage?: Date;
    dateSave?: string;
    datePlanPack?: Date;
    isPrepaid?: number;
    prisad?: string;
    termoshov?: string;
    textureComment?: string;
    discount?: string;
    discountComment?: string;
    costPack?: number;
    dateLastSave?: string;
    dateCalcCost?: string;
    dateFactPack?: string;
    dateFactOrderOut?: string;
    comment?: string;
    costPriceColumn?: number;
    costUp?: number;
    costUpComment?: string;
}
