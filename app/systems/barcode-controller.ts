import { NextFunction, Request, Response } from 'express';
import ApiError from '../exceptions/ApiError';
import { createItmDb } from '../firebird/Firebird';

import { IExtraData, IExtraDataDb } from '../types/extraDataTypes';
import { getListExtradataToName } from './extradata-system';
//const _     = require('lodash');


class BarcodeController {
    async requestForSecondBarcode (req: Request, res: Response, next: NextFunction) {
        // Получить данные по второму баркоду.
        // не нужен
        const barcode = req.params.barcode;

    }
    async setParametersExtraPack (req: Request, res: Response, next: NextFunction) {
        // Установка доп параметров.
        try {
            
        } catch (e) {next(e);}
    }

}
export default new BarcodeController();