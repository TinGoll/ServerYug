import { NextFunction, Request, Response } from "express";
import User from "../entities/User";
import { decodedDto } from "../types/user";

import { Router } from 'express';

import settings from '../settings';
import jwt from 'jsonwebtoken';
import users, { getUserToToken } from "../systems/users";


/** Стандартные ошибки */
const InvalidToken: string          = 'Токен не действителен.';
const UserIsNotFound: string        = 'Пользователь не найден';
const UserNotFoundForReason: string = 'Пользователь не обнаружен, возможно был удалён или заблокирован';
/********************************* */

// /api/users/
const router = Router();

// Getters
/********************************************/
// Получение всех пользователей, нужен токен
router.get('/',                     // /api/users
    async (req: Request, res: Response, next: NextFunction) => {
            // Проверка токена, получение пользователя.
            const user: User = await getUserToToken(req.get('Authorization'));
            // Конец проверки токена.
        try {
            // Разграничить по правам.
            return res.json({users: await users.getAllUsers()}); 
        } catch (e) {next(e);}

        
});
// Получение пользователя по id,  нужен токен
router.get('/:id',                  // /api/users/:id 
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Проверка токена, получение пользователя.
            const user: User = await getUserToToken(req.get('Authorization'));
            // Конец проверки токена.
            const userId =  req.params.id; // id запрашиваемого пользователя.
        } catch (e) {next(e)}   
});

// Получение списка прав пользователя по id, нужен токен.
router.get('/get-permissions/:id',  // /api/users/get-permissions/:id
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Проверка токена, получение пользователя.
            const user: User = await getUserToToken(req.get('Authorization'));
            // Конец проверки токена.
            const userId =  req.params.id; // id запрашиваемого пользователя.
        } catch (e) {next(e);}  
});



export default router;