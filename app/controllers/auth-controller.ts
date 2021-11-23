import { NextFunction, Request, Response } from "express";
import { ICreateUserOptions } from "../types/auth-types";
import authService from "../services/auth-service";
import ApiError from "../exceptions/ApiError";

class AuthController {
    /** Регистрация нового пользователя */
    async register (req: Request, res: Response, next: NextFunction) {
        try {
            const data: ICreateUserOptions = req.body;
            const loginData = await authService.registration(data);
            res.status(201).json(loginData);
        } catch (e) {
            next(e);
        }
    }
    /** Вход в систему */
    async login (req: Request, res: Response, next: NextFunction) {
        try {
            const {userName, password, barcode} = req.body;
            const loginData = await authService.login(userName, password, barcode);
            res.status(200).json(loginData);
        } catch (e) {
            next(e);
        }
    }
    /** Выход из системы */
    async logout (req: Request, res: Response, next: NextFunction) {
        try {
            throw ApiError.BadRequest("Функция не реализована.")
        } catch (e) {
            next(e);
        }
    }
}

export default new AuthController();