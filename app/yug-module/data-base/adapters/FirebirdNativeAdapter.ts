import { createNativeClient, getDefaultLibraryFilename, Client, Attachment, ConnectOptions } from 'node-firebird-driver-native';
import { ISQLAdapter } from './ISQLAdapter';

const
    fbYugOptions = {
        host: "192.168.2.10",
        port: '3050',
        database: "F:/Work/FireBird DB/massiv-yug/MYS.fdb",
        user: "SYSDBA",
        password: "masterkey",
        lowercase_keys: false, // set to true to lowercase keys
        role: null!, // default
        pageSize: 4096, // default when creating database
    }

class FirebirdConfig {
    username?: string = fbYugOptions.user;
    password?: string = fbYugOptions.password;
    host?: string = fbYugOptions.host;
    port?: string = fbYugOptions.port;
    tmpDir?: string = fbYugOptions.database;
    constructor() {}
    create(): string {
        const database = `${this.tmpDir}`;
        return (this.host ?? '') +
            (this.host && this.port ? `/${this.port}` : '') +
            (this.host ? ':' : '') +
            database;
    }
    isLocal(): boolean {
        return this.host == undefined ||
            this.host == 'localhost' ||
            this.host == '127.0.0.1';
    }
}


export default class FirebirdNativeAdapter implements ISQLAdapter {
    private client?: Client;
    private config?: FirebirdConfig;
    private attachment?: Attachment;
    private static instance?: FirebirdNativeAdapter;

    constructor() {
        if (FirebirdNativeAdapter.instance) {
            return FirebirdNativeAdapter.instance;
        }
        this.createClient();
        FirebirdNativeAdapter.instance = this;
    }

    private createClient(): void {
        this.client = createNativeClient(getDefaultLibraryFilename());
        this.config = new FirebirdConfig();
        const defaultOptions: ConnectOptions = {
            password: this.config.password,
            username: this.config.username
        };
        this.client.defaultConnectOptions = {
            ...defaultOptions
        }
        this.client.defaultCreateDatabaseOptions = {
            forcedWrite: false,
            ...defaultOptions
        }
    }

    async connect(): Promise<Attachment> {
        if (!this.client) this.createClient();
        if (this.attachment) return this.attachment;
        this.attachment = await this.client!.connect(this.config!.create());
        return this.attachment;
    }

    async dispouse(): Promise<void> {
        try {
            if (!this.client) return;
            if (this.attachment) await this.attachment.disconnect();
            await this.client.dispose()
            this.client = undefined;
            this.config = undefined;
            this.attachment = undefined;
            FirebirdNativeAdapter.instance = undefined;
        } catch (e) {
            console.log(e);
        }
    }

    async execute(query: string, par: any[] = []): Promise<void> {
        try {
            const attachment = await this.connect();
            const transaction = await attachment.startTransaction();
            try {
                await attachment.execute(transaction, query, par);
                await transaction.commit();
            } catch (e) {
                await transaction.rollback();
                throw e;
            } finally {
                // await attachment.disconnect();
            }
        } catch (e) {
            throw e;
        }
    }

    async executeRequest<T extends object>(query: string, par: any[] = []): Promise<T[]> {
        try {
            const attachment = await this.connect();
            const transaction = await attachment.startTransaction();
            try {
                const resSet = await attachment.executeQuery(transaction,
                    query, par);
                const res = await resSet.fetchAsObject<T>();
                await resSet.close();
                await transaction.commit();
                return res;
            } catch (e) {
                await transaction.rollback();
                throw e;
            } finally {
                // await attachment.disconnect();
            }
        } catch (e) {
            throw e;
        }
    }

    async executeAndReturning<T extends object>(query: string, par: any[] = []): Promise<T> {
        try {
            const attachment = await this.connect();
            const transaction = await attachment.startTransaction();
            try {
                const output = await attachment.executeSingletonAsObject<T>(transaction, query, par);
                await transaction.commit();
                return output;
            } catch (e) {
                await transaction.rollback();
                throw e;
            } finally {
                // await attachment.disconnect();
            }
        } catch (e) {
            throw e;
        }
    }

}