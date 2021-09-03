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
        check('login', 'Поле "имя пользователя" не должно быть пустым').exists(),
        check('pass', 'Поле "пароль" не должно быть пустым').exists()
     ],
    async (req, res) => {
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
                lastName = item1;
                firstName = item2;
                middleName = item3;
            }
            let candidate = await users.getUser(userName);
            if (candidate) return res.status(500).json({error: 'User already exists', message: 'Такой пользователь уже существует.'});
            candidate = new User({
                userName, 
                password, 
                departament: 'Офис', 
                status: 1, 
                permissionGroup: 1,
                firstName,
                lastName,
                middleName
            });
            const result =  await candidate.save();
            if (result) return res.status(201).json({message: `Пользователь ${firstName || userName} успешно зарегистрирован.`})
            return res.status(500).json({error: 'Registration error', message: 'Во время регистрации возникла ошибка, обратись к администратору.'})
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
            if (!errors.isEmpty()) return res.status(400).json({errors: errors.array(), message: 'Некорректные данные при регистрации.'});

            const {userName, password, otherData} = req.body;
            
            const user = await users.getUser(userName);

            if (!user) return res.status(400).json({error: 'User is not found', message: `Пользователя ${userName} не существует.`});
            const isMatch = await bcrypt.compare(user.getPasword(), password);

            if (!isMatch) return res.status(400).json({error: 'Wrong password', message: 'Неверный пароль.'});
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