import { NextFunction, Request, Response } from "express";
import ApiError from "../exceptions/ApiError";
import { clearAdoptedQueryHash } from "../systems/adopted-order-system";
import { OrderPlanSystem } from "../systems/order-plans-system";
import { getAllUsers } from "../systems/users";

class ServiceController {
    async restartSystems(req: Request, res: Response, next: NextFunction) {
        const progress = [
                {name: 'Журнал планов', complited: false},
                {name: 'Журнал принятых', complited: false},
                {name: 'Пользователи', complited: false},
            ]
        try {
            
            /** Обновление планов. */
            const plans = new OrderPlanSystem();
            await plans.refrash();
            progress[0].complited = true;

            /** Обновление принятых */
            clearAdoptedQueryHash();
            progress[1].complited = true;

            /** Пользователи */
            getAllUsers();
            progress[2].complited = true;

            res.status(200).json({message: "Системы успешно перезагружены, hash - данные обновлены.", progress})
        } catch (e) {
            const error =  ApiError.BadRequest((e as Error).message, progress);
            next(error);
        }
    }
}

export default new ServiceController();