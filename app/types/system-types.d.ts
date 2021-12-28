import { UserDto } from "./user";

export declare interface ISystem<T> {
    /** Добавление нового пользователя */
    add(item: T): Promise<T>;
    /** Получение пользователя по id */
    get(id: number): Promise<T|null>;
    /** Получение данных, используя фильтр */
    getAll (options?: ISystemOptions):Promise<T[]>;
    /** Есть ли данные в объекте */
    isEmpty (): boolean;
    /** Очистка данных */
    clear ():void;
}

export declare interface IRefrashable {
    /** Обновление или загрузка данных */
    refrash (): Promise<void>;
}   

export declare interface ISavable<T> {
    save (): Promise<T>;
}
export declare interface IDeletable<T> {
    delete (element: T): Promise<{id: number}>
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

