import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import settings from '../settings';
import db from '../dataBase';
import { check, validationResult } from 'express-validator';
import jfunction from '../systems/virtualJournalsFun';
import User from '../entities/User';
import links from '../systems/links';
import users from '../systems/users';
import ApiError from '../exceptions/ApiError';

const router = Router();

router.post(
    '', 
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            
        } catch (error) {
            
        }
    }
);

// /api/auth/register
router.post(
    '/register',
     [
        check('login', 'Поле "имя пользователя" не должно быть пустым').exists(),
        check('pass', 'Поле "пароль" не должно быть пустым').exists()
     ],
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            let lastName = '', firstName = '', middleName = '';
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({errors: errors.array(), message: 'Некорректные данные при регистрации.'});

            const {fio, gender, telephone, login: userName, pass: password, otherData, ...other} = req.body;
            const [item1, item2, item3] = fio.split(' ');
            if (item1 && !item2) {firstName = item1;}
            else if (item1 && item2 && !item3) {
                firstName = item2;
                lastName = item1
            }
            else {
                lastName    = item1;
                firstName   = item2;
                middleName  = item3;
            }

            let candidate = await users.getUser(userName);
            if (candidate) throw ApiError.BadRequest('Такой пользователь уже существует.');
            candidate = new User({
                userName, 
                password, 
                departament: 'Офис', 
                status: 1, 
                permissionGroupId: 1,
                firstName,
                lastName,
                middleName
            });
            const result =  await candidate.save();
            if (!result) ApiError.BadRequest('Во время регистрации возникла ошибка, обратись к администратору.');
            return res.status(201).json({message: `Пользователь ${firstName || userName} успешно зарегистрирован.`})
        } catch (e) {next(e);}
});

// /api/auth/login
router.post(
    '/login', 
    [
        check('userName', 'Поле "имя пользователя" не должно быть пустым').exists(),
        check('password', 'Поле "пароль" не должно быть пустым').exists()
     ],
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {userName, password, barcode} = req.body;
        
            let user: User | null;
            if (barcode) {
                const query = `
                    select B.ID_EMPLOYERS, B.ID_SECTOR, coalesce(B.STATUS_BARCODE, 0) as STATUS
                    from SECTORS_BARCODE B
                    where upper(B.BARCODE) = upper('${barcode}')`;
                const [code] = await db.executeRequest(query);
                if (!code) return res.status(400).json({errors: ['Barcode is not found'], message: `Не корректный штрих - код.`});

                if (!code.ID_EMPLOYERS || !code.ID_SECTOR || code.ID_SECTOR == 14) 
                            return res.status(400).json({errors: ['Barcode not activated'], message: `Карточка не активирована, обратитесь к администрации.`});

                if (parseInt(code.STATUS) != 0) return res.status(400).json({errors: ['Card blocked'], message: `Карточка заблокирована, обратитесь к администрации.`});
                user = await users.getUserToID(code.ID_EMPLOYERS);
                if (!user) return res.status(400).json({errors: ['User is not found'], message: `Пользователь по данному штрихкоду не найден.`});
            } else{
                const errors = validationResult(req);
                if (!errors.isEmpty()) return res.status(400).json({errors: errors.array(), message: `Ошибка авторизации:\n${errors.array().join('\n')}`});
                user = await users.getUser(userName);
                if (!user) return res.status(400).json({errors: ['User is not found'], message: `Пользователя ${userName} не существует.`});

                const isMatch = await bcrypt.compare(user.getPasword() as string, password);
                if (!isMatch) return res.status(400).json({errors: ['Wrong password'], message: 'Неверный пароль.'});
            }
            const token = jwt.sign(
                {userId: user.id},
                settings.secretKey,
                {expiresIn: '10h'}
            )
            //console.log(token)
            //user.setToken(token);
            await user.permissionLoad();
            const sectorName        = (await jfunction.getSectors()).find(s => s.id == user?.sectorId)?.name
            const userLinks         = await links.getLinks(user);
            const permissionList   = await user.getPermission();
            
            return res.status(200).json({token, userId: user.id, 
                user: {
                    userName:       user.userName, 
                    firstName:      user.firstName, 
                    lastName:       user.lastName, 
                    middleName:     user.middleName, 
                    isOwner:        user.isOwner,
                    sectorId:       user.sectorId,
                    sectorName,
                    permissionList,
                    links:          userLinks
                }});
        } catch (e) {next(e);}
});

export default router;