import { NextFunction, Request, Response } from "express";
import User from "../entities/User";
import ApiError from "../exceptions/ApiError";

import ExtraDataSystem, {
    CommitActoin,
    ExtraDataCommit,
} from "../systems/extra-data-system";
import { getUserToToken } from "../systems/users";
import { ExtraData } from "../types/extra-data-types";

class ExtraDataController {
    async connect(req: Request, res: Response, next: NextFunction) {
        try {
            const system = new ExtraDataSystem();
            const extraEmmiter = system.getEmmiter();
            extraEmmiter.once("CommentAction", (commit: ExtraDataCommit) => {
                const action = req.body.action as string | undefined;
                const orderId = req.body.orderId as string | undefined;
                if (action && action?.toUpperCase() != commit.action?.toUpperCase())
                    return null;
                if (orderId && commit.payload.orderId != Number(orderId)) return;

                res.status(200).json(commit);
            });
        } catch (e) {
            throw e;
        }
    }

    async addData(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, data } = req.body;
            if (!name || !data)
                throw ApiError.BadRequest(
                    'Для добаления элемента списка, нужно заполнить поля "name" и поле "data"'
                );
            const system = new ExtraDataSystem();
            await system.addItemInListExtraData(name, data);
            res.status(201).json({ ok: true });
        } catch (e) {
            next(e);
        }
    }
    async deleteData(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, data } = req.body;
            if (!name || !data)
                throw ApiError.BadRequest(
                    'Для добаления элемента списка, нужно заполнить поля "name" и поле "data"'
                );
            const system = new ExtraDataSystem();
            const id = await system.addItemInListExtraData(name, data);
            res.status(200).json({ id });
        } catch (e) {
            next(e);
        }
    }

    async getParametersExtraPack(req: Request, res: Response, next: NextFunction) {
        // Получение дополнительных параметров, в зависимости от  передающей и принимающей стороны.
        try {
            const { barcodeTransfer, barcodeAccepted } = req.body;
            if (!barcodeTransfer || !barcodeAccepted)
                throw ApiError.BadRequest(
                    "Для получения параметров, необходимо указать передающий и принимающий участок."
                );

            const system = new ExtraDataSystem();
            const extraData = await system.getParametersExtraPack(
                barcodeTransfer,
                barcodeAccepted
            );
            res.status(200).json(extraData);
        } catch (e) {
            next(e);
        }
    }

    /** Комментарии */

    /** Получить все комментарии по id заказа */
    async getCommentToOrderId(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string | undefined;
            if (!id) throw ApiError.BadRequest("Некорректный id заказа.");
            const system = new ExtraDataSystem();
            const comments = await system.getCommentsToOrderId(Number(id));
            res.status(200).json({ comments });
        } catch (e) {
            next(e);
        }
    }

    async addComment(req: Request, res: Response, next: NextFunction) {
        try {
            // Проверка токена, получение пользователя.
            const user: User = await getUserToToken(req.get("Authorization"));
            // Конец проверки токена.
            const {
                journalId,
                orderId,
                group,
                name,
                data,
                type,
                userName,
                sector,
                ts,
                list,
            } = req.body?.comment as ExtraData;
            const system = new ExtraDataSystem();
            if (!orderId) throw ApiError.BadRequest("В объекте не задан orderId");

            const employeeId = user.getId() || undefined;
            const sectorId = user.sectorId;
            if (!data || String(data).trim() == "")
                throw ApiError.BadRequest("Не задан текст комментария");
            const comment = await system.addCommentToOrder(orderId, {
                journalId,
                sectorId,
                orderId,
                employeeId,
                group,
                name,
                data,
                type,
                userName,
                sector,
                ts,
                list,
            });
            res.status(200).json({ comment });
        } catch (e) {
            next(e);
        }
    }
    async editComment(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                id,
                journalId,
                sectorId,
                orderId,
                employeeId,
                group,
                name,
                data,
                type,
                userName,
                sector,
                ts,
                list,
            } = req.body?.comment as ExtraData;
            if (!id) throw ApiError.BadRequest("Не указан id комментария.");
            const system = new ExtraDataSystem();
            const comment = await system.editComment({
                id,
                journalId,
                sectorId,
                orderId,
                employeeId,
                group,
                name,
                data,
                type,
                userName,
                sector,
                ts,
                list,
            });
            res.status(200).json({ comment });
        } catch (e) {
            next(e);
        }
    }
    async deleteComment(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string | undefined;

            if (!id)
                throw ApiError.BadRequest(
                    "Не корректный id, предоставь id в формате {id: number}"
                );
            const system = new ExtraDataSystem();
            const deleted = await system.deleteCommentToId(Number(id));
            res.status(200).json({ id: deleted });
        } catch (e) {
            next(e);
        }
    }
}

export default new ExtraDataController();
