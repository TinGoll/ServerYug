import { NextFunction, Request, Response } from "express";
import ApiError from "../exceptions/ApiError";
import extraDataService from "../services/extra-data-service";
import { addItemInListExtraData, deleteItemInListExtraData, getParametersExtraPack } from "../systems/extradata-system";


class ExtraDataController {
    async addData(req: Request, res: Response, next: NextFunction) {
        try {
            const {name, data} = req.body;
            if (!name || !data) throw ApiError.BadRequest('Для добаления элемента списка, нужно заполнить поля "name" и поле "data"');
            await addItemInListExtraData(name, data);
            res.status(201).json({ok: true});
        } catch (e) {
            next(e);
        }
    }
    async deleteData(req: Request, res: Response, next: NextFunction) {
        try {
            const {name, data} = req.body;
            if (!name || !data) throw ApiError.BadRequest('Для добаления элемента списка, нужно заполнить поля "name" и поле "data"');
            const id = await deleteItemInListExtraData(name, data);
            res.status(200).json({id});
        } catch (e) {
            next(e);
        }
    }

    async getParametersExtraPack (req: Request, res: Response, next: NextFunction) {
        // Получение дополнительных параметров, в зависимости от  передающей и принимающей стороны.
        try {
            const { barcodeTransfer, barcodeAccepted } = req.body;
            if (!barcodeTransfer || !barcodeAccepted) 
                    throw ApiError.BadRequest('Для получения параметров, необходимо указать передающий и принимающий участок.');

            const extraData = await extraDataService.getParametersExtraPack(barcodeTransfer, barcodeAccepted);

            res.status(200).json(extraData);
        } catch (e) {next(e);}
    }
}

export default new ExtraDataController();