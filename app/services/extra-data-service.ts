import ApiError from "../exceptions/ApiError";
import { createItmDb } from "../firebird/Firebird";
import ExtraDataSystem from "../systems/extra-data-system";
import { DbExtraData, ExtraData } from "../types/extra-data-types";

import atOrderService from "./at-order-service";

class ExtraDataService {
    async getParametersExtraPack (barcodeTransfer: string, barcodeAccepted: string): Promise<ExtraData[]>  {
        try {
            const errors: string[] = [];
            let transfer:{ID: number, NAME: string, BARCODE: string}|undefined = undefined;
            let accepted:{ID: number, NAME: string, BARCODE: string}|undefined = undefined;
            const db = await createItmDb(); 
            const extraDataSystem = new ExtraDataSystem();
            const [candidateA, candidateB] = await db.executeRequest<{ID: number, NAME: string, BARCODE: string}>(
                `SELECT B.ID_SECTOR AS ID, GET_SECTOR_NAME(B.ID_SECTOR) AS NAME, B.BARCODE FROM SECTORS_BARCODE B 
                    WHERE UPPER(B.BARCODE) IN ('${barcodeTransfer?.toUpperCase()}', '${barcodeAccepted?.toUpperCase()}')`);
            db.detach();
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
           
            if (errors.length) throw ApiError.BadRequest("Ошибка.", errors)
            const extraData: ExtraData[] = await extraDataSystem.getParametersExtraPack(barcodeTransfer, barcodeAccepted);
            for (const data of extraData) {
                const list = await extraDataSystem.getListExtradataToName(data.name!);
                data.list = list;
            }
            return extraData;
        } catch (e) {
            throw e;
        }
    }

    async getListExtradataToName(name: string) {
        try {
            const extraDataSystem = new ExtraDataSystem();
            const list = await extraDataSystem.getListExtradataToName(name);
            return list;
        } catch (e) {
            throw e;
        }
    }
}

export default new ExtraDataService();