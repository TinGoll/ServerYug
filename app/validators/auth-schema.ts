import { body } from "express-validator";

const registerSchema = [
    body('login').exists({checkFalsy: true, checkNull: true }).withMessage('Это поле обязательное: Имя'),
    body('pass').exists({checkFalsy: true, checkNull: true }).withMessage('Это поле обязательное:  Фамилия')
]
const loginSchema = [
    body('login').exists({checkFalsy: true, checkNull: true }).withMessage('Это поле обязательное: Имя'),
    body('pass').exists({checkFalsy: true, checkNull: true }).withMessage('Это поле обязательное:  Фамилия')
]

export {registerSchema, loginSchema};

