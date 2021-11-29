import { NextFunction, Request, Response } from "express";
import ApiError from "../exceptions/ApiError";

export const errorMiddleware =  (err: Error, req: Request, res: Response, next: NextFunction) => {
    
    console.log('error middlewares: ' + req.originalUrl, err.message);
    if (err instanceof ApiError) {
        return res.status(err.status).json({message: err.message, errors: err.errors});
    }
    return res.status(500).json({message:` Непредвиденная ошибка: ${err.message}`});
}