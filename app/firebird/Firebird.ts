import {
  EventCallback,
  FirebirdConnectionOptions,
  FirebirdDatabaseOperation,
  FirebirdResult,
  TransCallback,
} from "./types";
import NodeFirebird from "node-firebird";
import itmOptions from "./options/itmOptions";
import cubicOptions from "./options/cubicOptions";
import yugOptions from "./options/yugOptions";

export enum Events {
  row = "row",
  result = "result",
  attach = "attach",
  detach = "detach",
  reconnect = "reconnect",
  error = "error",
  transaction = "transaction",
  commit = "commit",
  rollback = "rollback",
}

export const createItmDb = async (): Promise<Firebird> => {
  const db = new Firebird(itmOptions);
  await db.create();
  return db;
};

export const createCubicDb = async (): Promise<Firebird> => {
  const db = new Firebird(cubicOptions);
  await db.create();
  return db;
};

export const createMassivYugDb = async (): Promise<Firebird> => {
  try {
    const db = new Firebird(yugOptions);
    await db.create();
    return db;
  } catch (e) {
    throw e;
  }
};

export class Firebird {
  private db!: FirebirdDatabaseOperation;
  private options: FirebirdConnectionOptions;

  constructor(options: FirebirdConnectionOptions) {
    this.options = options;
  }

  create(): Promise<void> {
    try {
      return new Promise((resolve, reject) => {
        NodeFirebird.attach(
          this.options,
          (err: Error, db: FirebirdDatabaseOperation) => {
            if (err) reject(err);
            this.db = db;
            resolve();
          }
        );
      });
    } catch (e) {
      throw e;
    }
  }

  executeRequest<T>(query: string, params: any[] = []): Promise<T[]> {
    try {
      return new Promise((resolve, reject) => {
        this.db.query(query, params, (err: Error, results: T[]) => {
          if (err) reject(err);
          resolve(results);
        });
      });
    } catch (e) {
      throw e;
    }
  }
  executeAndReturning<T>(query: string, params: any[] = []): Promise<T> {
    try {
      return new Promise((resolve, reject) => {
        this.db.query(query, params, (err: Error, row: any) => {
          if (err) reject(err);
          const res: T = row;
          resolve(res);
        });
      });
    } catch (e) {
      throw e;
    }
  }
  execute(query: string, params: any[] = []): Promise<void> {
    try {
      return new Promise((resolve, reject) => {
        this.db.query(query, params, (err: Error, res: FirebirdResult[]) => {
          if (err) reject(err);
          resolve();
        });
      });
    } catch (e) {
      throw e;
    }
  }

  startTransaction(transactionCallback: TransCallback) {
    this.db.transaction(
      NodeFirebird.ISOLATION_READ_COMMITED,
      transactionCallback
    );
  }

  on(event: Events, eventCallback: EventCallback) {
    this.db.on(event, eventCallback);
  }

  detach() {
    this.db.detach();
  }
}
