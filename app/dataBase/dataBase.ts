import Firebird from 'node-firebird';
import options from '../../config/.firebirdDB/settingsDB';
import { FirebirdPool, FirebirdDatabaseOperation } from '../firebird/types';

const pool: FirebirdPool = Firebird.pool(5, options);

 export const executeRequest =  (query: string): Promise<any[]> => {
    return new Promise((res, rej) => {
        pool.get((err: Error, db: FirebirdDatabaseOperation) => {
            if (err) return rej(err);
            db.query(query, (err: Error, result: any[]) => {
                db.detach();
                if (err) return rej(err);
                return res(result);
            })
        })
        pool.destroy();
    });
}

export const formatDateToDb = (date: Date) => {
    if (!date) return null;
    return date.toLocaleDateString();
}

