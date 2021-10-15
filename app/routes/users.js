const {Router}                  = require('express');
const db                        = require('../dataBase');
const {check, validationResult} = require('express-validator');
const {format}                  = require('date-format-parse');
const settings                  = require('../settings');
const jwt                       = require('jsonwebtoken');
const { users }                 = require('../systems')
const atOrderQuery              = require('../query/atOrder');
const jfunction                 = require('../systems/virtualJournalsFun');

/** Стандартные ошибки */
const InvalidToken          = 'Токен не действителен.';
const UserIsNotFound        = 'Пользователь не найден';
const UserNotFoundForReason = 'Пользователь не обнаружен, возможно был удалён или заблокирован';
/********************************* */

// /api/users/
const router = Router();

// Getters
/********************************************/
// Получение всех пользователей, нужен токен
router.get('/',                     // /api/users
    async (req, res) => {
        /**Получение пользователя по токену */
        let decoded;
        const token = req.get('Authorization');
        try {decoded = jwt.verify(token, settings.secretKey);} 
        catch (error) {return res.status(500).json({errors: [error.message], message: InvalidToken})}
        const user = await users.getUserToID(decoded.userId);
        if (!user) return res.status(500).json({errors: [UserNotFoundForReason], message: UserIsNotFound})
        /**Пользователь получен. */
        try {
            // Разграничить по правам.
            return res.json({users: await users.getAllUsers()}); 
        } catch (error) {
            console.log(error);
            res.status(500).json({errors: [error.message], message: 'Ошибка запроса.'})    
        }

        
});
// Получение пользователя по id,  нужен токен
router.get('/:id',                  // /api/users/:id 
    async (req, res) => {
        /**Получение пользователя по токену */
        let decoded;
        const token = req.get('Authorization');
        try {decoded = jwt.verify(token, settings.secretKey);} 
        catch (error) {return res.status(500).json({errors: [error.message], message: InvalidToken})}
        const user = await users.getUserToID(decoded.userId);
        if (!user) return res.status(500).json({errors: [UserNotFoundForReason], message: UserIsNotFound})
        /**Пользователь получен. */
        const userId =  req.params.id; // id запрашиваемого пользователя.
});
// Получение списка прав пользователя по id, нужен токен.
router.get('/get-permissions/:id',  // /api/users/get-permissions/:id
    async (req, res) => {
       /**Получение пользователя по токену */
        let decoded;
        const token = req.get('Authorization');
        try {decoded = jwt.verify(token, settings.secretKey);} 
        catch (error) {return res.status(500).json({errors: [error.message], message: InvalidToken})}
        const user = await users.getUserToID(decoded.userId);
        if (!user) return res.status(500).json({errors: [UserNotFoundForReason], message: UserIsNotFound})
        /**Пользователь получен. */
        const userId =  req.params.id; // id запрашиваемого пользователя.
});



module.exports = router;