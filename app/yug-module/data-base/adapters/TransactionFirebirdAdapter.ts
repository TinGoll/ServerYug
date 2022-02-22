import { TransactionAsync } from "./FirebirdAdapter";
import { ISQLAdapter } from "./ISQLAdapter";

export default class TransactionFirebirdAdapter implements ISQLAdapter {
    private transaction: TransactionAsync;
    constructor(transaction: TransactionAsync) {
        this.transaction = transaction;
    }
    /** dispouse - Не работает в этом контексте. Подтвердите или отмените транзакцию и отсоедениет базу в классе Firebird */
    async dispouse(): Promise<void> {}
    /** Выполняет запрос без возврата результата. Необходимо вызвать commit/rollback. */
    async execute(query: string, par: any[] = []): Promise<void> {
        try {await this.transaction.queryAsync(query, par);
        } catch (e) {throw e;}
    }
    /** Выполняет запрос, возвращает результат в виде массива объектов. Необходимо вызвать commit/rollback.  */
    async executeRequest<T extends object>(query: string, par: any[] = []): Promise<T[]> {
        try {
            const r = await this.transaction.queryAsync(query, par);
            return r;
        } catch (e) {throw e;}
    }
    /** Выполняет запрос, возвращает рузультат в виде объекта. Применяется для выполнения запросов INSERT, DELETE. . Необходимо вызвать commit/rollback. */
    async executeAndReturning<T extends object>(query: string, par: any[] = []): Promise<T> {
        try {
            const r = await this.transaction.queryAsync(query, par);
            return r;
        } catch (e) {throw e;}
    }
    commit () {this.transaction.commit()}
    rollback () {this.transaction.rollback();}
    async commitAsync (): Promise<void> {await this.transaction.commitAsync();}
    async rollbackAsync(): Promise<void>  {await this.transaction.rollbackAsync();}
    async commitAndDetach(): Promise<void>  {await this.transaction.commitAndDetach();}
    async rollbackAndDetach(): Promise<void>  {await this.transaction.rollbackAndDetach();}
}