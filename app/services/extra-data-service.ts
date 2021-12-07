import ApiError from "../exceptions/ApiError";
import { createItmDb } from "../firebird/Firebird";

import { IExtraData, IExtraDataDb } from "../types/extraDataTypes";
import atOrderService from "./at-order-service";

class ExtraDataService {
    async getParametersExtraPack (barcodeTransfer: string, barcodeAccepted: string): Promise<IExtraData[]>  {
        try {
            const errors: string[] = [];
            let transfer:{ID: number, NAME: string, BARCODE: string}|undefined = undefined;
            let accepted:{ID: number, NAME: string, BARCODE: string}|undefined = undefined;
            const db = await createItmDb(); 
            const [candidateA, candidateB] = await db.executeRequest<{ID: number, NAME: string, BARCODE: string}>(
                `SELECT B.ID_SECTOR AS ID, GET_SECTOR_NAME(B.ID_SECTOR) AS NAME, B.BARCODE FROM SECTORS_BARCODE B 
                    WHERE UPPER(B.BARCODE) IN ('${barcodeTransfer?.toUpperCase()}', '${barcodeAccepted?.toUpperCase()}')`);
            if(candidateA?.BARCODE.toUpperCase() === barcodeTransfer?.toUpperCase()) {
                transfer = candidateA;
                accepted = candidateB;
            }else{
                transfer = candidateB;
                accepted = candidateA;
            } 
            const [dep, rdep] = await atOrderService.dependenciesValidator(transfer?.ID, accepted?.ID);

            if (!dep.length) {
                if(rdep.length) {
                    errors.push(`Участок "${transfer?.NAME}" не может передавать заказы участку "${accepted?.NAME}". Однако, участок "${accepted?.NAME}", может передавать участку "${transfer?.NAME}". Попробуйте изменить порядок сканирования карт.`)
                }else{
                    errors.push(`Участок "${transfer?.NAME}" не может передавать заказы участку "${accepted?.NAME}".`)
                }
            }
            if (!transfer || !accepted) throw ApiError.BadRequest('Оштбка.', ['Один из штрихкодов не определен или заблокирован, либо использована одна и та же карта.']);
            const query = `SELECT E.DATA_GROUP, E.DATA_NAME, E.DATA_VALUE, E.DATA_TYPE FROM JOURNAL_EXTRA_PACK E
                        LEFT JOIN JOURNAL_DEP D ON (E.DEP_ID = D.ID)
                        WHERE D.ID_SECTOR_TRANSFER = ${transfer?.ID} AND D.ID_SECTOR_ACCEPTED = ${accepted?.ID}`;   

            const result =  await db.executeRequest<IExtraDataDb>(query);
            db.detach();
            if (errors.length) throw ApiError.BadRequest("Ошибка.", errors)
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
                const list = await this.getListExtradataToName(data.name);
                data.list = list;
                extraData.push(data);
            }
            return extraData;
        } catch (e) {
            throw e;
        }
    }


    async getListExtradataToName(name: string) {
        try {
            // as DATA - обязательно.
            const list:any[] = [];
            const db = await createItmDb();
            const res = await db.executeRequest<{ID: number, LIST_NAME: string, LIST_DATA: string}>(
                `SELECT EXTRA_LIST.LIST_DATA FROM (
                    SELECT DISTINCT E.LIST_DATA,
                                    (SELECT COUNT(D.ID)
                                    FROM JOURNAL_DATA D
                                    WHERE UPPER(D.DATA_NAME) = UPPER('${name}') AND
                                        UPPER(D.DATA_VALUE) = UPPER(E.LIST_DATA)
                                    ) AS AMOUNT
                    FROM JOURNAL_EXTRA_DATA_LISTS E
                    WHERE UPPER(E.LIST_NAME) = UPPER('${name}')
                    ) EXTRA_LIST
                    ORDER BY EXTRA_LIST.AMOUNT DESC`);
            db.detach();
            const sortedArr = res.sort((a, b) => {
                const dataA = a?.LIST_DATA as string;
                const dataB = b?.LIST_DATA as string;
                return dataA?.localeCompare(dataB);
            });
            for (const d of sortedArr) {list.push(d.LIST_DATA?.trim());}
            return list;
        } catch (e) {
            throw e;
        }
    }
}

export default new ExtraDataService();