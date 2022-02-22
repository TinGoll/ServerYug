
/** Интерфейс для SQL адаптеров */
export interface ISQLAdapter {
    /** Разрыв соединения с сервером базы данных */
    dispouse(): Promise<void>;
    /** Выполнить запрос, ничего не возвращает */
    execute(query: string, par: any[]): Promise<void>;
    /** Класический запрос с возвратом данных, в виде массива объектов */
    executeRequest<T extends object>(query: string, par: any[]): Promise<T[]>;
    /** Запрос на добавление, удаление, возвращает данные  ввиде объекта */
    executeAndReturning<T extends object>(query: string, par: any[]): Promise<T>;
}