import { NextFunction, Request, Response } from "express";
import User from "../entities/User";
import { Router } from "express";
import users, { getUserToToken } from "../systems/users";

/********************************* */

// /api/users/
const router = Router();

// Getters
/********************************************/
// Получение всех пользователей, нужен токен
router.get(
  "/", // /api/users
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Проверка токена, получение пользователя.
      const user: User = await getUserToToken(req.get("Authorization"));
      // Конец проверки токена.
      // Разграничить по правам.
      return res.json({ users: await users.getAllUsers() });
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  "/user-names", // /api/users
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await users.getAllUsers();
      const names = result.map((u) => u.getUserName());
      return res.status(200).json(names);
    } catch (e) {
      next(e);
    }
  }
);

// Получение пользователя по id,  нужен токен
router.get(
  "/:id", // /api/users/:id
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Проверка токена, получение пользователя.
      const user: User = await getUserToToken(req.get("Authorization"));
      // Конец проверки токена.
      const userId = req.params.id; // id запрашиваемого пользователя.
    } catch (e) {
      next(e);
    }
  }
);

// Получение списка прав пользователя по id, нужен токен.
router.get(
  "/get-permissions/:id", // /api/users/get-permissions/:id
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Проверка токена, получение пользователя.
      const user: User = await getUserToToken(req.get("Authorization"));
      // Конец проверки токена.
      const userId = req.params.id; // id запрашиваемого пользователя.
    } catch (e) {
      next(e);
    }
  }
);

export default router;
