const {Router}     = require('express');
const jwt          = require('jsonwebtoken');
const bcrypt       = require('bcryptjs');
const {User}       = require('../entities');
const settings     = require('../settings');

const { users } = require('../systems')
const {check, validationResult} = require('express-validator');
const { userList } = require('../systems/users');

const router = Router();

// /api/auth/register
router.post(
    '/register',
     [
        check('userName', 'Поле "имя пользователя" не должно быть пустым').exists(),
        check('password', 'Поле "пароль" не должно быть пустым').exists()
     ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({errors: errors.array(), message: 'Не корректные данные при регистрации.'});
            
            const {userName, password, otherData} = req.body;
            const candidate = new User({userName});
            candidate.save();

        } catch (error) {
            res.status(500).json({error: error.message, message: 'Ошибка обработки post запроса - Регистрация пользователя.'});
        }
});

// /api/auth/login
router.post(
    '/login', 
    [
        check('userName', 'Введи имя пользователя').exists(),
        check('password', 'Введи пароль').exists()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({errors: errors.array(), message: 'Не корректные данные при регистрации.'});

            const {userName, password, otherData} = req.body;
            const user = await users.getUser(userName);
            if (!user) return res.status(400).json({error: 'User is not found', message: `Пользователя ${userName} не существует.`});
            const isMatch = await bcrypt.compare(user.getPasword(), password);
            if (!isMatch) return res.status(400).json({error: 'Wrong password', message: 'Не верный пароль.'});
            const token = jwt.sign(
                {userId: user.id},
                settings.secretKey,
                {expiresIn: '1h'}
            )
            user.setToken(token);
            return res.status(200).json({token, userId: user.id});

        } catch (error) {
            res.status(500).json({error: error.message,  message: 'Ошибка обработки post запроса - Вход в систему.'});
        }
});

module.exports = router;