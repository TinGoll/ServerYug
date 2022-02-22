import { ISQLAdapter } from "./ISQLAdapter";
import * as Firebird from "node-firebird";
import { promisify } from "util";
import TransactionFirebirdAdapter from "./TransactionFirebirdAdapter";
/** Интерфейсы */
export interface ConnectionPoolAsync {
    get(callback: Firebird.DatabaseCallback): void;
    destroy(): void;
    getAsync: () => Promise<DatabaseAsync>
}
export interface DatabaseAsync {
    detach(callback?: Firebird.SimpleCallback): Firebird.Database;
    transaction(isolation: Firebird.Isolation, callback: Firebird.TransactionCallback): void;
    escape(value: any): string;
    detachAsync: () => Promise<void>;
    transactionAsync: () => Promise<TransactionAsync>;
}
export interface TransactionAsync {
    query(query: string, params: any[], callback: Firebird.QueryCallback): void;
    execute(query: string, params: any[], callback: Firebird.QueryCallback): void;
    commit(callback?: Firebird.SimpleCallback): void;
    rollback(callback?: Firebird.SimpleCallback): void;
    queryAsync: (query: string, params: any[]) => Promise<any>;
    executeAsync: (query: string, params: any[]) => Promise<any[]>;
    commitAsync: () => Promise<void>;
    rollbackAsync: () => Promise<void>;
    database: DatabaseAsync;
    commitAndDetach: () => Promise<void>;
    rollbackAndDetach: () => Promise<void>;
}

type DataBaseNames = 'YUG' | 'ITM' | 'CUBIC'

/** Опции для подключния SQL баз данных */
const
    fbYugOptions: Firebird.Options = {
        host: "192.168.2.10",
        port: 3050,
        database: "F:/Work/FireBird DB/massiv-yug/MYS.fdb",
        user: "SYSDBA",
        password: "masterkey",
        lowercase_keys: false, // set to true to lowercase keys
        role: null!, // default
        pageSize: 4096, // default when creating database
    }
const
    fbItmOptions: Firebird.Options = {
        host: '192.168.2.101',
        port: 3050,
        database: '/mnt/2T/Archive/Work/FireBird DB/itm/data base/ITM_DB.FDB',
        user: 'ITM',
        password: 'AdmUser',
        lowercase_keys: false, // set to true to lowercase keys
        role: null!, // default
        pageSize: 4096, // default when creating database
    }
const
    fbCubicOptions: Firebird.Options = {
        host: '192.168.2.101',
        port: 3050,
        database: '/mnt/2T/Archive/Work/FireBird DB/cubic 3/CUBIC.FDB',
        user: 'CUBIC_USERS',
        password: 'CubicUsers',
        lowercase_keys: false, // set to true to lowercase keys
        role: null!, // default
        pageSize: 4096, // default when creating database
    }

export function pool(max: number, options: Firebird.Options): ConnectionPoolAsync {
    const ap: ConnectionPoolAsync = Firebird.pool(max, options) as ConnectionPoolAsync;
    const aget = promisify<Firebird.Database>(ap.get).bind(ap);
    ap.getAsync = async () => {
        const db: DatabaseAsync = await aget() as unknown as DatabaseAsync;
        db.detachAsync = promisify<void>(db.detach).bind(db);
        db.transactionAsync = async () => {
            const atran = promisify<Firebird.Isolation, Firebird.Transaction>(db.transaction).bind(db);
            const transaction = await atran(Firebird.ISOLATION_READ_COMMITED) as unknown as TransactionAsync;
            transaction.commitAsync = promisify(transaction.commit).bind(transaction);
            transaction.executeAsync = promisify(transaction.execute).bind(transaction);
            transaction.queryAsync = promisify(transaction.query).bind(transaction);
            transaction.rollbackAsync = promisify(transaction.rollback).bind(transaction);
            transaction.database = db;
            transaction.commitAndDetach = (async () => {
                await transaction.commitAsync();
                await transaction.database.detachAsync()
            }).bind(transaction);
            transaction.rollbackAndDetach = (async () => {
                await transaction.rollbackAsync();
                await transaction.database.detachAsync()
            }).bind(transaction);
            return transaction;
        }
        return db;
    }
    return ap;
}


export async function transaction(): Promise<TransactionAsync> {
    const db = await thePool.getAsync();
    const tr = await db.transactionAsync();
    return tr;
}

export const thePool = pool(5, fbYugOptions);

const SQL_SET_USER_CONTEXT = `
  execute block(user_id integer = ?)
  as
  begin
    RDB$SET_CONTEXT ('USER_TRANSACTION', 'USER_ID', user_id);
  end
`;

export async function userTransaction(userId: string): Promise<TransactionAsync> {
    const db = await thePool.getAsync();
    const tr = await db.transactionAsync();
    await tr.queryAsync(SQL_SET_USER_CONTEXT, [userId]);
    return tr;
}

export default class FirebirdAdapter implements ISQLAdapter {
    private static instance: FirebirdAdapter;
    private static DataBases: ConnectionPoolAsync[] = [];
    private firebirdPoll?: ConnectionPoolAsync;
    constructor() {
        if (FirebirdAdapter.instance) {
            return FirebirdAdapter.instance;
        }
        this.createPool();
        FirebirdAdapter.instance = this;  
    }

    async transactionAdapter (): Promise<TransactionFirebirdAdapter> {
        const tr = await transaction();
        return new TransactionFirebirdAdapter(tr);
    }

    async dispouse(): Promise<void> {
        if (this.firebirdPoll) {
            this.firebirdPoll.destroy();
        }
        this.firebirdPoll = undefined;
    }

    async execute(query: string, par: any[] = []): Promise<void> {
        const tr = await transaction();
        try {
            await tr.queryAsync(query, par);
            await tr.commitAndDetach();
        } catch (e) {
            await tr.rollbackAndDetach();
            throw e;
        }
    }
    
    async executeRequest<T extends object>(query: string, par: any[] = []): Promise<T[]> {
        const tr = await transaction();
        try {
            const r: T[]= await tr.queryAsync(query, par);
            await tr.commitAndDetach();
            return r;
        } catch (e) {
            await tr.rollbackAndDetach();
            throw (e);
        }
    }

    async executeAndReturning<T extends object>(query: string, par: any[] = []): Promise<T> {
        const tr = await transaction();
        try {
            const r = await tr.queryAsync(query, par);
            await tr.commitAndDetach();
            return r;
        } catch (e) {
            await tr.rollbackAndDetach();
            throw e;
        }
    }

    public async transaction(): Promise<TransactionAsync> {
        this.createPool()
        const db = await this.firebirdPoll!.getAsync();
        const tr = await db.transactionAsync();
        return tr;
    }

    public async userTransaction(userId: string): Promise<TransactionAsync> {
        this.createPool();
        const db = await this.firebirdPoll!.getAsync();
        const tr = await db.transactionAsync();
        await tr.queryAsync(SQL_SET_USER_CONTEXT, [userId]);
        return tr;
    }

    private createPool () {
        if (this.firebirdPoll) return;
        this.firebirdPoll = this.pool(5, fbYugOptions);
    }

    private pool(max: number, options: Firebird.Options): ConnectionPoolAsync {
        const ap: ConnectionPoolAsync = Firebird.pool(max, options) as ConnectionPoolAsync;
        const aget = promisify<Firebird.Database>(ap.get).bind(ap);
        ap.getAsync = async () => {
            const db: DatabaseAsync = await aget() as unknown as DatabaseAsync;
            db.detachAsync = promisify<void>(db.detach).bind(db);
            db.transactionAsync = async () => {
                const atran = promisify<Firebird.Isolation, Firebird.Transaction>(db.transaction).bind(db);
                const transaction = await atran(Firebird.ISOLATION_READ_COMMITED) as unknown as TransactionAsync;
                transaction.commitAsync = promisify(transaction.commit).bind(transaction);
                transaction.executeAsync = promisify(transaction.execute).bind(transaction);
                transaction.queryAsync = promisify(transaction.query).bind(transaction);
                transaction.rollbackAsync = promisify(transaction.rollback).bind(transaction);
                transaction.database = db;
                transaction.commitAndDetach = (async () => {
                    await transaction.commitAsync();
                    await transaction.database.detachAsync()
                }).bind(transaction);
                transaction.rollbackAndDetach = (async () => {
                    await transaction.rollbackAsync();
                    await transaction.database.detachAsync()
                }).bind(transaction);
                return transaction;
            }
            return db;
        }
        return ap;
    }
}