export declare interface FirebirdConnectionOptions {
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
    role?: any;
    pageSize?: number;
    lowercase_keys: boolean;
    retryConnectionInterval?: number;
}

export declare interface FirebirdConnection {
    (error: Error, db: FirebirdDatabaseOperation): void;
}

export declare interface FirebirdResult {
    (error: Error, results: any[]): void;
}

export declare interface FirebirdError {
    (error: Error): void;
}

export declare interface FirebirdStatic {
    attach(options: FirebirdConnectionOptions, callback: FirebirdConnection): void;
    create(options: FirebirdConnectionOptions, callback: FirebirdConnection): void;
    attachOrCreate(options: FirebirdConnectionOptions, callback: FirebirdConnection): void;
    pool(pool: number, options: FirebirdConnectionOptions, callback?: FirebirdConnection): FirebirdPool;
    escape(sql: string): string;
    ISOLATION_READ_UNCOMMITTED: number[];
    ISOLATION_READ_COMMITED: number[];
    ISOLATION_REPEATABLE_READ: number[];
    ISOLATION_SERIALIZABLE: number[];
    ISOLATION_READ_COMMITED_READ_ONLY: number[];
}

export declare interface FirebirdPool {
    get(callback: FirebirdConnection): void; 
    destroy(): void;
}

export declare interface TransCallback {
    (err: any, transaction: Transaction): void;
}

export declare interface EventCallback {
    (...params: any[]): void;
}

export declare interface FirebirdDatabaseOperation {
    query(query: string, params: any[], result: FirebirdResult): void;
    query(query: string, result: FirebirdResult): void;
    execute(query: string, params: any[], result: FirebirdResult): void;
    sequentially(query: string, params: any[], result: (row: any, index: number) => void, error: FirebirdError): void;
    sequentially(query: string, result: (row: any, index: number) => void, error: FirebirdError): void;
    detach(error?: FirebirdError, force?: boolean): void;
    transaction(isolation: number[], result: (error: any, transaction: FirebirdTransactionOperation) => void): void;
    on(event: string, params?: (...params: any[]) => void): void;
}

export declare interface FirebirdTransactionOperation {
    query(query: string, params: any[], result: FirebirdResult): void;
    query(query: string, result: FirebirdResult): void;
    execute(query: string, params: any[], result: FirebirdResult): void;
    commit(error: FirebirdError): void;
    commitRetaining(error: FirebirdError): void;
    rollback(error: FirebirdError): void;
    rollbackRetaining(error: FirebirdError): void;
}


export declare var firebird: FirebirdStatic;

declare module 'node-firebird' {
    export = firebird;
}