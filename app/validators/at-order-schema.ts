import { body } from "express-validator";

const transferOrdersSchema = [
    body('idTransfer').exists({checkFalsy: true, checkNull: true }).withMessage('Это поле обязательное: Передающий участок'),
    body('idAccepted').exists({checkFalsy: true, checkNull: true }).withMessage('Это поле обязательное: Принимающий участок')
]

export {transferOrdersSchema};

