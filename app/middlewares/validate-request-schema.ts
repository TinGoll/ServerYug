import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import ApiError from "../exceptions/ApiError";
const validateRequestSchema = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error =  ApiError.BadRequest('Не заполнены обязательные поля:', errors.array());
        next(error);
    }
    next();
}
export default validateRequestSchema;
