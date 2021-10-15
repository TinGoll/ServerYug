const {Router}                  = require('express');
const db                        = require('../dataBase');
const {check, validationResult} = require('express-validator');
const {format}                  = require('date-format-parse');
const settings                  = require('../settings');
const jwt                       = require('jsonwebtoken');
const { users }                 = require('../systems')
const atOrderQuery              = require('../query/atOrder');
const jfunction                 = require('../systems/virtualJournalsFun');

// /api/users/
const router = Router();

// Getters
/********************************************/
// Получение всех пользователей, нужен токен
router.get('/',                     // /api/users
    async (req, res) => {
   
});
// Получение пользователя по id,  нужен токен
router.get('/:id',                  // /api/users/:id 
    async (req, res) => {
    
});
// Получение списка прав пользователя по id, нужен токен.
router.get('/get-permissions/:id',  // /api/users/get-permissions/:id
    async (req, res) => {
    
});



module.exports = router;