import { createMassivYugDb, Firebird } from "../../firebird/Firebird";
import { FirebirdDatabaseOperation } from "../../firebird/types";
import { ISQLAdapter } from "../../yug-module/data-base/adapters/ISQLAdapter";


export class FirebirdYugAdapter implements ISQLAdapter {
    private static instance: FirebirdYugAdapter;
    private db: Firebird | null = null;
    
    /** Firebird адаптер, единый интерфейс для лубой SQL базы данных. Хранит состояние, существует в единственном экземпляре. */
    constructor() {
        if (FirebirdYugAdapter.instance) {
            return FirebirdYugAdapter.instance;
        }
        FirebirdYugAdapter.instance = this;
    }

    async create(): Promise<Firebird> {
        try {
            if (!this.db) {
                const db = await createMassivYugDb();
                this.db = db;
            }
            return this.db;
        } catch (e) {
            throw e;
        }
    }
    async dispouse(): Promise<void> {
        try {
            this.db?.detach();
            this.db = null;
        } catch (e) {
            throw e;
        }
    }
    async execute(query: string, par: any[] = []): Promise<void> {
        try {
            const db = await this.create();
            await db.execute(query, par);
        } catch (e) {
            throw e;
        }
    }
    async executeRequest<T extends object>(query: string, par: any[] = []): Promise<T[]> {
        try {
            const db = await this.create();
            const sesult = await db.executeRequest<T>(query, par);
            return sesult;
        } catch (e) {
            throw e;
        }
    }
    async executeAndReturning<T extends object>(query: string, par: any[] = []): Promise<T> {
        try {
            const db = await this.create();
            const result = await db.executeAndReturning<T>(query, par);
            return result;
        } catch (e) {
            throw e;
        }
    }
}