const {Router}                  = require('express');
const db                        = require('../dataBase');
const atOrderQuery              = require('../query/atOrder');
const orderQuery                = require('../query/orders');
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
// /api/at-order/add
router.post(
    '/add',
    [
        check('idTransfer', 'Передающий участок не может быть пустым.').exists(),
        check('idAccepted', 'Принимающий участок не может быть пустым.').exists()
    ],
    async (req, res) => {
        const defaultError = 'Во время записи в журнал, произошли ошибки.';
        const journalErrors = [];
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(500)
                        .json({errors: errors.array(), message: defaultError});

            const {idTransfer: transferBarcode, idAccepted: acceptedBarcode, orders: registerOrders, ...other} = req.body;

            if (!Array.isArray(registerOrders) || registerOrders.length <= 0) return res.status(500)
                        .json({errors: ['Нет заказов для передачи.'], message: defaultError});
            if (transferBarcode == acceptedBarcode) return res.status(500)
                        .json({errors: ['Нельзя передавать заказ самому себе.'], message: defaultError});

            let query = atOrderQuery.get('get_barcodes', {
                $where: `UPPER(B.BARCODE) = '${transferBarcode.toUpperCase()}' 
                            or UPPER(B.BARCODE) = '${acceptedBarcode.toUpperCase()}'`});

            const barcodes = await db.executeRequest(query);
            
            const transfer = barcodes.find(item => item.BARCODE.toUpperCase() === transferBarcode.toUpperCase());
            const accepted = barcodes.find(item => item.BARCODE.toUpperCase() === acceptedBarcode.toUpperCase());

            if (!transfer) journalErrors.push('Участок отправитель не определен.');
            if (!accepted) journalErrors.push('Участок получатель не определен.');
            if (transfer && transfer.BLOCKED != 0) journalErrors.push(`Карточка отправителя заблокирована, пожалуйста обратитесь к руководству.`);
            if (accepted && accepted.BLOCKED != 0) journalErrors.push(`Карточка получателя заблокирована, пожалуйста обратитесь к руководству.`);
            if (journalErrors.length > 0) return res.status(500).json({errors: journalErrors, message: defaultError});
            
            query = atOrderQuery.get('get_dep', {
                    $where: `
                    D.ID_SECTOR_TRANSFER = ${transfer ? transfer.ID_SECTOR : null} and
                    D.ID_SECTOR_ACCEPTED = ${accepted ? accepted.ID_SECTOR : null}
                `});
              
            const journal = await db.executeRequest(query);
    
            if (!journal || journal.length == 0) return res.status(500).
                        json({errors: [`Участок ${transfer ? transfer.SECTOR : 
                                '"отправитель" не определен и'} не может передавать заказы ${accepted ? 'участку ' + accepted.SECTOR : 
                                        'не определенному участку.'}`], 
                        message: defaultError});
            
            query = orderQuery.get('get_orders', {$where: `O.ID IN (${registerOrders.map(o => o.idOrder).join(', ')})`});    
            const orders = await db.executeRequest(query);
            query = `select J.ID, J.ID_ORDER, N.NAME
                        from JOURNALS J
                        left join JOURNAL_NAMES N on (J.ID_JOURNAL_NAMES = N.ID)
                        where J.ID_JOURNAL_NAMES in (${journal.map(j => j.ID_JOURNAL_NAME).join(', ')}) and
                            J.ID_ORDER in (${registerOrders.map(o => o.idOrder).join(', ')})`;
            
            const adoptedOrders = await db.executeRequest(query); 
            const transaction = db.newTransaction();     
   
            for (const o of registerOrders) {
                const order = orders.find(ord => ord.ID === o.idOrder);
                if (order) {
                    const statusAllow = journal.find(j => j.STATUS_NUM === order.ORDER_STATUS)
                    if (!statusAllow) {
                        o.completed = false;
                        o.description = `Не верный статус "${order.STATUS_DESCRIPTION}", ожидается: "${journal.map(j => j.STATUS_DESCRIPTION).join(', ')}"`;
                        continue
                    }
                    const isAdopted = adoptedOrders.find(o => o.ID_ORDER == order.ID)

                    if (isAdopted) {
                        o.completed = false;
                        o.description = `Заказ уже принят в "${isAdopted.NAME}"`;
                        continue
                    }

                    const query = ``;




                    o.completed = true;
                    o.description = `успешно!`;
                }else{
                    o.completed = false;
                    o.description = `Номер заказа [${o.idOrder}] не найден в базе данных.`;
                }
            }
            
            const countOrders = registerOrders.filter(o => o.completed).length;
            let resultMessage = `${countOrders ? '☑️ Принято ' + countOrders + ' из ' + registerOrders.length : '❌ Не один из заказов не принят.'}`;
            if (countOrders == registerOrders.length)  resultMessage = '✅ Все заказы приняты.'

            return res.status(201).json({
                message: resultMessage,
                orders: registerOrders
            });
        } catch (error) {
            return res.status(500)
                        .json({errors: [error.message], message: defaultError});
        }
    }
);



module.exports = router;