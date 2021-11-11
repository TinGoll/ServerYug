import { NextFunction, Request, Response } from "express";
import User from "../entities/User";
import { decodedDto } from "../types/user";

import { Router } from 'express';

import settings from '../settings';
import jwt from 'jsonwebtoken';
import users from "../systems/users";


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
        /**Получение пользователя по токену */
        let decoded: decodedDto;
        const token = req.get('Authorization');
        if (!token) throw new Error('Не указан токен.');
        try {decoded = jwt.verify(token, settings.secretKey) as any;} 
        catch (error) {return res.status(500).json({errors: [(error as Error).message], message: InvalidToken})}
        const user = await users.getUserToID(decoded.userId);
        if (!user) return res.status(500).json({errors: [UserNotFoundForReason], message: UserIsNotFound})
        /**Пользователь получен. */
        try {
            // Разграничить по правам.
            return res.json({users: await users.getAllUsers()}); 
        } catch (error) {
            const e = error as Error;
            console.log(error);
            res.status(500).json({errors: [e.message], message: 'Ошибка запроса.'})    
        }

        
});
// Получение пользователя по id,  нужен токен
router.get('/:id',                  // /api/users/:id 
    async (req: Request, res: Response, next: NextFunction) => {
        /**Получение пользователя по токену */
        let decoded: decodedDto;
        const token = req.get('Authorization');
        if (!token) throw new Error('Не указан токен.');
        try {decoded = jwt.verify(token, settings.secretKey) as any;} 
        catch (error: any) {return res.status(500).json({errors: [error.message], message: InvalidToken})}
        const user = await users.getUserToID(decoded.userId);
        if (!user) return res.status(500).json({errors: [UserNotFoundForReason], message: UserIsNotFound})
        /**Пользователь получен. */
        const userId =  req.params.id; // id запрашиваемого пользователя.
});

// Получение списка прав пользователя по id, нужен токен.
router.get('/get-permissions/:id',  // /api/users/get-permissions/:id
    async (req: Request, res: Response, next: NextFunction) => {
       /**Получение пользователя по токену */
        let decoded: decodedDto;
        const token: string | undefined = req.get('Authorization');
        if (!token) throw new Error('Не указан токен.');
        try {decoded = jwt.verify(token, settings.secretKey) as any;} 
        catch (error: any) {return res.status(500).json({errors: [error.message], message: InvalidToken})}
        const user = await users.getUserToID(decoded.userId);
        if (!user) return res.status(500).json({errors: [UserNotFoundForReason], message: UserIsNotFound})
        /**Пользователь получен. */
        const userId =  req.params.id; // id запрашиваемого пользователя.
});



export default router;