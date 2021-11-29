import { body } from "express-validator";

const registerSchema = [
    body('userName').exists({checkFalsy: true, checkNull: true }).withMessage('Это поле обязательное: Имя'),
    body('password').exists({checkFalsy: true, checkNull: true }).withMessage('Это поле обязательное:  Фамилия')
]
const loginSchema = [
    body('userName').exists({checkFalsy: true, checkNull: true }).withMessage('Это поле обязательное: Имя'),
    body('password').exists({checkFalsy: true, checkNull: true }).withMessage('Это поле обязательное:  Фамилия')
]

export {registerSchema, loginSchema};

