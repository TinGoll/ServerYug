export declare interface ISystem<T> {
    /** Обновление или загрузка данных */
    refrash (): Promise<void>;
    /** Получение данных, используя фильтр */
    getData (options?: ISystemOptions):Promise<T[]>;
    /** Есть ли данные в объекте */
    isEmpty (): boolean;
    /** Очистка данных */
    clear ():void;
}

export declare interface ISystemOptions {
    id?:        any;
    limit?:     number;
    page?:      number;
    sort?:      string;
    d1?:        Date;
    d2?:        Date;
    filter?:    string;
    data?:       any;
}

interface IKeyword {
    key: string, value: string
}
