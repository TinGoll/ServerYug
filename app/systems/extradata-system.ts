import { ExtraData } from "../types/extraDataTypes";
import db from '../dataBase';
//const _     = require('lodash');

const setExtraData = async (data: ExtraData[]): Promise<number> => {
    try {
        const query: string = `EXECUTE BLOCK RETURNS (AMOUNT INTEGER) AS DECLARE VARIABLE C INTEGER = 0; BEGIN\n${
            data.map(d => {
                const txt: string = (d?.journalId && d?.group && d?.name && d?.data) ?
                `INSERT INTO JOURNAL_DATA (ID_JOURNAL, DATA_GROUP, DATA_NAME, DATA_VALUE) values (${d?.journalId}, '${d?.group}', '${d?.name}', '${d?.data}'); :C = :C+1;\n`
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