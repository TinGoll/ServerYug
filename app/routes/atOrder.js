const {Router}                  = require('express');
const db                        = require('../dataBase');
const atOrderQuery              = require('../query/atOrder');
const {check, validationResult} = require('express-validator');

// /api/at-order/

const router = Router();
// /api/at-order/data
router.get(
    '/data',
    async (req, res) => {
        try {
            let query = atOrderQuery.get('get_barcodes');
   
            let barcodes = await db.executeRequest(query);
            return res.status(200).json({barcodes});
        } catch (error) {
            return res.status(500).json({errors: [error.message], message: 'Ошибка запроса: Get barcodes'});
        }
    }
)

router.get(
    '/journal-names',
    async (req, res) => {
        try {
            let query = atOrderQuery.get('get_barcodes');
            let barcodes = await db.executeRequest(query);
            
            return res.status(200).json({barcodes});
        } catch (error) {
            return res.status(500).json({errors: [error.message], message: 'Ошибка запроса: Get barcodes'});
        }
    }
)

router.post(
    '/add',
    [
        check('idTransfer', 'Передающий участок не может быть пустым.').exists(),
        check('idAccepted', 'Принимающий участок не может быть пустым.').exists()
    ],
    async (req, res) => {

        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(500)
                        .json({errors: errors.array(), message: 'Во время записи в журнал, произошли ошибки.'});

            const {idTransfer: transferBarcode, idAccepted: acceptedBarcode, orders, ...other} = req.body;

            if (!Array.isArray(orders) || orders.length <= 0) return res.status(500)
                        .json({errors: ['Нет заказов для передачи.'], message: 'Во время записи в журнал, произошли ошибки.'});

            if (transferBarcode == acceptedBarcode) return res.status(500)
                        .json({errors: ['Нельзя передавать заказ самому себе.'], message: 'Во время записи в журнал, произошли ошибки.'});

            let query = atOrderQuery.get('get_barcodes', {
                $where: `UPPER(B.BARCODE) = '${transferBarcode.toUpperCase()}' 
                            and UPPER(B.BARCODE) = '${acceptedBarcode.toUpperCase()}'`});

            const barcodes = await db.executeRequest(query);

            const [transfer, accepted] = barcodes;

            query = atOrderQuery.get('get_dep', )




        } catch (error) {
            return res.status(500)
                        .json({errors: [error.message], message: 'Во время записи в журнал, произошли ошибки.'});
        }


       



/*      
    {
        "idTransfer": "ASD225658458",
        "idAccepted": "QWE158654854",
        "orders": [
            {
                "idOrder": 18456,
                "nameOrder": "18456 Юсуп РК №1 к69",
                "comment": "Первый коммент",
                "employee": ""
            },
            {
                "idOrder": 18454,
                "nameOrder": "18454 Али 07.08-1 Алиери",
                "comment": "второй коммент",
                "employee": ""
            },
            {
                "idOrder": 18555,
                "nameOrder": "18555 Койтемиров Артур 14.08- Саида",
                "comment": "что-то еще",
                "employee": ""
            }
        ]
    }
*/
    }
);



module.exports = router;