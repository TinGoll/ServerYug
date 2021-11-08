const db    = require('../dataBase');
const extraSystem = require('../systems/extradata-system')
//const _     = require('lodash');


class BarcodeController {
    async requestForSecondBarcode (req, res, next) {
        // Получить данные по второму баркоду.
        // не нужен
        const barcode = req.params.barcode;

    }

    async getParametersExtraPack (req, res, next) {
        // Получение дополнительных параметров, в зависимости от  передающей и принимающей стороны.
        try {
            const { barcodeTransfer, barcodeAccepted } = req.body;
            if (!barcodeTransfer || !barcodeAccepted) 
                    throw new Error('Для получения параметров, необходимо указать передающий и принимающий участок.');
            const [transfer, accepted] = (await db.executeRequest(`
                SELECT B.ID_SECTOR AS ID FROM SECTORS_BARCODE B WHERE B.BARCODE IN ('${barcodeTransfer}', '${barcodeAccepted}')
            `))?.map(s => {return s.ID});
            if (!transfer || !accepted) throw new Error('Один из штрихкодов не определен или заблокирован.')
            const query = `
                            SELECT E.DATA_GROUP, E.DATA_NAME, E.DATA_VALUE, E.DATA_TYPE FROM JOURNAL_EXTRA_PACK E
                            LEFT JOIN JOURNAL_DEP D ON (E.DEP_ID = D.ID)
                            WHERE D.ID_SECTOR_TRANSFER = ${transfer} AND D.ID_SECTOR_ACCEPTED = ${accepted}`;
            
            const result =  await db.executeRequest(query);
            const extraData = result.map(d => {
                return {
                    orderId: 0,
                    journalId: 0,
                    group:  d.DATA_GROUP,
                    type:   d.DATA_TYPE,
                    name:   d.DATA_NAME,
                    data:   d.DATA_VALUE
                }
            }); 
          
            res.status(200).json(extraData);
        } catch (e) {
            res.status(500).json({message: 'Ошибка запроса на получение дополнительный параметров.', errors: [e.message]})
        }

    }

    async setParametersExtraPack (req, res, next) {
        // Установка доп параметров.
    }

}
module.exports = new BarcodeController();