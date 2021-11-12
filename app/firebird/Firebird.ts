import { createNativeClient, getDefaultLibraryFilename, Client, Attachment, ConnectOptions} from 'node-firebird-driver-native';
import FirebirdConfig from "./FirebirdConfig";
import { Base } from '.';
import { FirebirdQueryParameters } from './types';

export default class Firebird {
    client: Client;
    base:Base;
    config: FirebirdConfig;
    constructor(base: Base) {
        this.client = createNativeClient(getDefaultLibraryFilename());
        this.config = new FirebirdConfig();
        this.base = base;
        const defaultOptions:ConnectOptions = {
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

    async createDatabase (): Promise<Attachment> {
        return await this.client.createDatabase(this.config.create(this.base));
    }
    async connect (): Promise<Attachment> {
        return await this.client.connect(this.config.create(this.base));
    }

    async dispouse (): Promise<void> {
        console.log('dispouse ok');
        
        await this.client.dispose()  
    }

    
    async executeOneRequest<T extends object> (query: string, par: any[] = []): Promise<T[]> {
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
                console.log('disconnect ok');
                await attachment.disconnect();
            }
        } catch (e) {
            throw e;
        }
    }
    async executeOneAndReturning<T extends object> (query: string, par: any[] = []): Promise<T> {
        try {
            const attachment = await this.connect();
            const transaction = await attachment.startTransaction();
            try {
                const output =  await attachment.executeReturningAsObject<T>(transaction, query, par);
                await transaction.commit();
                return output;
            } catch (e) {
                await transaction.rollback();
                throw e;
            } finally {
                console.log('disconnect ok');
                
                await attachment.disconnect();
            }
        } catch (e) {
            throw e;
        }
    }

    async executeAllAndReturning (query: string, par: FirebirdQueryParameters[] = []): Promise<FirebirdQueryParameters[]> {
         try {
            const attachment = await this.connect();
            const transaction = await attachment.startTransaction();
            const statment = await attachment.prepare(transaction, query);
            try {
                for (const p of par) {
                    const returnData =  await statment.executeReturningAsObject<{ID: number}>(transaction, p.params);
                    p.id = returnData?.ID;
                }
                transaction.commit();
                return par;
            } catch (e) {
                await transaction.rollback();
                throw e;
            } finally {
                await statment.dispose();
                await attachment.disconnect();
            }
        } catch (e) {
            throw e;
        }
    }
}