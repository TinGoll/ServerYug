import { NextFunction, Request, Response } from "express";
import timeService from "../services/time-service";


class TimeController {
     async getCurrentTime(req: Request, res: Response, next: NextFunction) {
        try {
             console.log('time');
             
            const timeRequest = timeService.getCurrentTime();
            res.status(200).json(timeRequest);
        } catch (e) {
             next(e);
        }
     }
}

export default new TimeController();