import { IExtraData, IExtraDataDb } from "../types/extraDataTypes";
import db from '../dataBase';
import { createItmDb } from "../firebird/Firebird";
import ApiError from "../exceptions/ApiError";
import { ExtraDataType } from "../enums/extra-data-enums";
//const _     = require('lodash');

export const getParametersExtraPack = async (barcodeTransfer: string, barcodeAccepted: string): Promise<IExtraData[]> => {
    try {
        const db = await createItmDb(); 
        const [transfer, accepted] = (await db.executeRequest<{ID: number}>(
            `SELECT B.ID_SECTOR AS ID FROM SECTORS_BARCODE B WHERE B.BARCODE IN ('${barcodeTransfer}', '${barcodeAccepted}')`))?.map(s => {return s.ID});
            if (!transfer || !accepted) throw new Error('Один из штрихкодов не определен или заблокирован.');
            const query = `SELECT E.DATA_GROUP, E.DATA_NAME, E.DATA_VALUE, E.DATA_TYPE FROM JOURNAL_EXTRA_PACK E
                           LEFT JOIN JOURNAL_DEP D ON (E.DEP_ID = D.ID)
                           WHERE D.ID_SECTOR_TRANSFER = ${transfer} AND D.ID_SECTOR_ACCEPTED = ${accepted}`;   

            const result =  await db.executeRequest<IExtraDataDb>(query);
            db.detach();
            const extraData: IExtraData[] = [];
            if(!result.length) return extraData;
            for (const d of result) {
                const data : IExtraData = {
                    orderId:    0,
                    journalId:  0,
                    group:      d.DATA_GROUP,
                    type:       d.DATA_TYPE,
                    name:       d.DATA_NAME,
                    list:       [],
                    data:       d.DATA_VALUE
                }
                const list = await getListExtradataToName(data.name);
                data.list = list;
                extraData.push(data);
            }
            return extraData;
    } catch (e) {
        throw e;
    }
}

export const getListExtradataToName = async (name: string): Promise<any[]> => {
    try {
        // as DATA - обязательно.
        const list:any[] = [];
        const db = await createItmDb();
        const res = await db.executeRequest<{ID: number, LIST_NAME: string, LIST_DATA: string}>(
            `SELECT * FROM JOURNAL_EXTRA_DATA_LISTS D WHERE UPPER(D.LIST_NAME) = UPPER(?)`, [name]);
        db.detach();
        const sortedArr = res.sort((a, b) => {
            const dataA = a?.LIST_DATA as string;
            const dataB = b?.LIST_DATA as string;
            return dataA?.localeCompare(dataB);
        });
        for (const d of sortedArr) {list.push(d.LIST_DATA);}
        return list;
    } catch (e) {
        throw e;
    }
}

/** Добавление нового парамметра */
export const addItemInListExtraData = async (listName: string, item: string): Promise<void> => {
    try {
        const db = await createItmDb();
        const [candidate] = await db.executeRequest<{ID: number, LIST_NAME: string, LIST_DATA: string}>(
            'SELECT * FROM JOURNAL_EXTRA_DATA_LISTS D WHERE UPPER(D.LIST_NAME) = UPPER(?) AND UPPER(D.LIST_DATA) = UPPER(?)',
            [listName, item]);
        if (candidate.ID) {
            db.detach();
            throw ApiError.BadRequest(`${listName} - ${item}, уже существует в списке.`);
        }
        await db.execute(`INSERT INTO JOURNAL_EXTRA_DATA_LISTS (LIST_NAME, LIST_DATA) VALUES(?, ?)`, [listName.trim(), item.trim()]);
        db.detach();
    } catch (e) {
        throw e;
    }
}
export const deleteItemInListExtraData = async (listName: string, item: string): Promise<void> => {
    try {
        const db = await createItmDb();
        const candidate = await db.executeAndReturning<{ID: number}>(
            'DELETE JOURNAL_EXTRA_DATA_LISTS D WHERE UPPER(D.LIST_NAME) = UPPER(?) AND UPPER(D.LIST_DATA) = UPPER(?) RETURNING ID;',
            [listName, item]);
        db.detach();
        if (!candidate.ID) ApiError.BadRequest(`Запись ${listName} - ${item} не найдена в базе данных.`);
    } catch (e) {
        throw e;
    }
}

export const createExtraData = async () => {
    try {
        
    } catch (e) {
        throw e;
    }
}

const setExtraData = async (data: IExtraData[]): Promise<number> => {
    try {
        if(!data.length) return 0;
        const query: string = `EXECUTE BLOCK RETURNS (AMOUNT INTEGER) AS DECLARE VARIABLE C INTEGER = 0; BEGIN\n${
            data.map(d => {
                const txt: string = (d?.journalId && d?.group && d?.name && d?.data) ?
                `INSERT INTO JOURNAL_DATA (ID_ORDER, ID_JOURNAL, DATA_GROUP, DATA_NAME, DATA_VALUE, DATA_TYPE) values (${d?.orderId||null}, ${d?.journalId}, '${d?.group}', '${d?.name}', '${d?.data}', '${d.type}'); :C = :C+1;\n`
                : '';
                return txt
            }).join('')}:AMOUNT = :C; SUSPEND; END;`;
            const [res] = (await db.executeRequest(query));
            return res?.AMOUNT;
    } catch (e) {
        throw new Error('Ошибка установки дополнительных параметров');
    }
}

export default setExtraData;