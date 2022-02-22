import { NextFunction, Request, Response } from "express";
import { ICreateUserOptions } from "../types/auth-types";
import authService from "../services/auth-service";
import ApiError from "../exceptions/ApiError";
import User from "../entities/User";
import users, { getUserToToken } from "../systems/users";

class AuthController {
  /** Регистрация нового пользователя */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data: ICreateUserOptions = req.body;
      const loginData = await authService.registration(data);
      res.status(201).json(loginData);
    } catch (e) {
      next(e);
    }
  }
  /** Вход в систему */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { userName, password, barcode } = req.body;
      const loginData = await authService.login(userName, password, barcode);
      res.status(200).json(loginData);
    } catch (e) {
      next(e);
    }
  }

  /** Выход из системы */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      throw ApiError.BadRequest("Функция не реализована.");
    } catch (e) {
      next(e);
    }
  }

  async getUserData(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.body.id as string | undefined;
      // Проверка токена, получение пользователя.
      const user: User = await getUserToToken(req.get("Authorization"));
      // Конец проверки токена.
      let loginData = {};
      if (id) {
        if (user.id != Number(id) && !user.isOwner) throw ApiError.Forbidden();
        const candidate = await users.getUserToID(Number(id));
        if (!candidate)
          throw ApiError.NotFound(["Запрашиваемый пользователь не найден"]);
        loginData = await candidate.getDto();
      } else {
        loginData = await user.getDto();
      }
      res.status(200).json(loginData);
    } catch (e) {
      next(e);
    }
  }
}

export default new AuthController();
