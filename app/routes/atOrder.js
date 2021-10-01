const {Router}                  = require('express');
const db                        = require('../dataBase');
const atOrderQuery              = require('../query/atOrder');
const orderQuery                = require('../query/orders');
const {check, validationResult} = require('express-validator');
const {format}                  = require('date-format-parse');
const settings                  = require('../settings');
const { users }                 = require('../systems');
const jwt                       = require('jsonwebtoken');

const {
    getIdSectorArrToNameOldSector,
    getStatusNumOldToIdStatusOld, 
    getNameOldSectorArrToIdNewSector, 
    getPlansToOrderId, 
    isWorkPlan
}                               = require('../systems/virtualJournalsFun');

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
);
// /api/at-order/journal-names
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
);
// /api/at-order/salary-transactions/1
router.get(
    '/salary-transactions/:id',
    async (req, res) => {
        try {
            const idJournalName =  req.params.id;
            const transactions = await db.executeRequest(`
                select T.ID,
                    cast(T.DATE_ADDED as date) as DATE_ADDED,
                    T.NAME, cast((sum(coalesce(O.ORDER_FASADSQ, 0) * W.PRICE) +
                    (select coalesce(sum(T2.AMOUNT * T2.modifer), 0) as OTHER_AMOUNT
                    from OTHER_TRANSACTIONS T2
                    where T2.ID_TRANSACTION = T.ID)) as decimal(8,2)) as MONEY
                from SALARY_TRANS_EL E
                left join JOURNALS J on (E.ID_JOURNAL = J.ID)
                left join SALARY_TRANSACTION T on (E.ID_TRANSACTION = T.ID)
                left join COST_OF_WORK W on (W.ID_JOURNAL = J.ID)
                left join ORDERS O on (J.ID_ORDER = O.ID)
                where J.ID_JOURNAL_NAMES = ${idJournalName}
                group by T.ID, T.DATE_ADDED, T.NAME
                order by T.DATE_ADDED desc
            `);
            if (!transactions || transactions.length == 0) 
                    return res.status(500).json({errors: ['List empty'], message: 'Список пуст.'});
            return res.status(200).json({transactions});
        } catch (error) {
             return res.status(500).json({errors: [error.message], message: 'Ошибка запроса: Get transactions'});
        }
    }
);
// /api/at-order/salary-report/:idtransaction
router.get(
    '/salary-report/:idtransaction',
    async (req, res) => {
        const defaultError = `При получаении данных по транзакции, произошла ошибка.`;
        try {
            const idTrans =  req.params.idtransaction;
            const salary = await db.executeRequest(`
                select O.ID, O.ITM_ORDERNUM, J.ID as ID_JOIRNAL, P.ID_SECTOR, S.NAME as SECTOR, 
                W.ID as ID_WORK_OF_COST, P.ID as ID_WORK, P.NAME as WORK_NAME,
                cast(coalesce(O.ORDER_FASADSQ, 0) as decimal(6,3)) as ORDER_FASADSQ,
                cast(W.PRICE as decimal(8,2)) as PRICE,
                cast(coalesce(O.ORDER_FASADSQ, 0) * W.PRICE as decimal(8,2)) as MONEY
                from SALARY_TRANS_EL E
                    left join JOURNALS J on (E.ID_JOURNAL = J.ID)
                    left join SALARY_TRANSACTION T on (E.ID_TRANSACTION = T.ID)
                    left join COST_OF_WORK W on (W.ID_JOURNAL = J.ID)
                    left join WORK_PRICES P on (W.ID_WORK_PRICE = P.ID)
                    left join ORDERS O on (J.ID_ORDER = O.ID)
                    left join SECTORS S on (P.ID_SECTOR = S.ID)
                where T.ID = ${idTrans}
                order by O.ID, P.NUM_SORT`
            );
            const sectors = [];
            if (salary.length == 0) return res.status(200).json({sectors});
            const sectorsName = [...new Set(salary.map(s => s.SECTOR))];
            for (const sectorName of sectorsName) {
                const ordersId  = [...new Set(salary.filter(o => o.SECTOR == sectorName).map(o => o.ID))];
                const sectorID = salary.find(s => s.SECTOR == sectorsName).ID_SECTOR;
                const sector = {id: sectorID, name: sectorName, otherTransactoins: {}, orders: []}

                const otherTrans = await db.executeRequest(`select T.NAME, T.DESCRIPTION, T.AMOUNT, T.MODIFER
                                                        from OTHER_TRANSACTIONS T
                                                        where T.ID_TRANSACTION = ${idTrans} and T.ID_SECTOR = ${sectorID}`);
                sector.otherTransactoins = {
                    data: [
                        ...otherTrans.map((t) => {
                            return {
                                userName: t.NAME,
                                description: t.DESCRIPTION,
                                amount: t.AMOUNT,
                                modifer: t.MODIFER
                            }
                        })
                    ] 
                }
                
                for (const id of ordersId) {
                    const idJournal = salary.find(s => s.ID == id).ID_JOIRNAL;
                    const itmOrderNum = salary.find(s => s.ID == id).ITM_ORDERNUM;
                    const works = salary.filter(o => o.ID == id).map(w => {
                        return {
                            workOfCostId:   w.ID_WORK_OF_COST,
                            workId:         w.ID_WORK,
                            work:           w.WORK_NAME,
                            square:         w.ORDER_FASADSQ,
                            price:          w.PRICE,
                            money:          w.MONEY
                        }
                    });

                    const order = {id, itmOrderNum, idJournal, works};
                    sector.orders.push(order);
                }
                sectors.push(sector);
            }
            return res.status(200).json({sectors});
        } catch (error) {
            console.log(error);
            return res.status(500).json({errors: [error.message], message: defaultError});
        }
    }
);
//  Preliminary calculation
// /api/at-order/preliminary-calculation/:id
router.get(
    '/preliminary-calculation/:id',
    async (req, res) => {
        const defaultError = `При получаении данных по предварительному просчету, произошла ошибка.`;
        const idJournalName =  req.params.id;
        try {
            const query = `select O.ID, O.ITM_ORDERNUM, J.ID as ID_JOIRNAL, P.ID_SECTOR, S.NAME as SECTOR, 
                            W.ID as ID_WORK_OF_COST, P.ID as ID_WORK, P.NAME as WORK_NAME,
                            cast(coalesce(O.ORDER_FASADSQ, 0) as decimal(6,3)) as ORDER_FASADSQ, 
                            cast(W.PRICE as decimal(8,2)) as PRICE,
                            cast(coalesce(O.ORDER_FASADSQ, 0) * W.PRICE as decimal(8,2)) as MONEY, P.OPTIONAL
                                from JOURNALS J
                                left join ORDERS O on (J.ID_ORDER = O.ID)
                                left join COST_OF_WORK W on (W.ID_JOURNAL = J.ID)
                                left join WORK_PRICES P on (W.ID_WORK_PRICE = P.ID)
                                left join SECTORS S on (P.ID_SECTOR = S.ID)
                                left join SALARY_TRANS_EL E on (E.ID_JOURNAL = J.ID)
                                where E.ID is null and j.id_journal_names = ${idJournalName}`;
            const salary = await db.executeRequest(query);
            const sectors = [];
            if (salary.length == 0) return res.status(500).json({errors: ['Array empty'], message: 'Список пуст'});
            const sectorsName = [...new Set(salary.map(s => s.SECTOR))];
            for (const sectorName of sectorsName) {
                const ordersId  = [...new Set(salary.filter(o => o.SECTOR == sectorName).map(o => o.ID))];
                const sectorID = salary.find(s => s.SECTOR == sectorName).ID_SECTOR;
                const sector = {id:sectorID, name: sectorName, journalNameId: idJournalName, otherTransactoins: {}, orders: []};
                for (const id of ordersId) {
                    const idJournal = salary.find(s => s.ID == id).ID_JOIRNAL;
                    const itmOrderNum = salary.find(s => s.ID == id).ITM_ORDERNUM;
                    const works = salary.filter(o => o.ID == id).map(w => {
                        return {
                            workOfCostId:   w.ID_WORK_OF_COST,
                            workId:         w.ID_WORK,
                            work:           w.WORK_NAME,
                            square:         w.ORDER_FASADSQ,
                            price:          w.PRICE,
                            money:          w.MONEY,
                            optional:       w.OPTIONAL,
                            isDeleted:      0
                        }
                    });
                    const order = {id, itmOrderNum, idJournal, isDeleted:0, works};
                    sector.orders.push(order);
                }
                // Дополнительные начисления и списания.
                const users = await db.executeRequest(`select E.NAME from EMPLOYERS E where E.ID_SECTOR = ${sectorID}`);
                sector.otherTransactoins = {
                    users: [...users.map(u => u.NAME)],
                    values: [
                        {userName: '', description: 'Налог', amount: 0, modifer: -1},
                        {userName: '', description: 'Штраф', amount: 0, modifer: -1},
                        {userName: '', description: 'Возврат долга', amount: 0, modifer: -1},
                        {userName: '', description: 'Больничный', amount: 0, modifer: -1},
                        {userName: '', description: 'Отпускные', amount: 0, modifer: 1},
                        {userName: '', description: 'Аванс', amount: 0, modifer: 1}
                    ],
                    data: []
                }
                sectors.push(sector);
            }
            return res.status(200).json({sectors});
        } catch (error) {
            console.log(error);
            return res.status(500).json({errors: [error.message], message: defaultError});
        }
    }
);


// /api/at-order/close-billing-period
router.patch(
    '/close-billing-period',
    async (req, res) => {
        let decoded;
        const {sectors} = req.body;
        if (!sectors || sectors.length == 0) return res.status(500).json({errors: ['Список пуст.'], message: 'Нет данных.'})
        const token = req.get('Authorization');
        try {decoded = jwt.verify(token, settings.secretKey);} 
        catch (error) {return res.status(500).json({errors: [error.message], message: 'Некорректный токен'})}
        const user = await users.getUserToID(decoded.userId);
        try {
            const transaction = await db.executeRequest(`
                                insert into SALARY_TRANSACTION (
                                ID_USER, DATE_ADDED, SETTLEMENT_DATE, NAME, 
                                TRANSACTION_AMOUNT, TRANSACTION_COMPLETED,
                                IS_JOURNAL_ENTRY, ID_JOURNAL_CASH)
                                values (
                                    ${user.id}, 
                                    '${format(new Date(), 'DD.MM.YYYY HH:mm:ss')}', 
                                    '${format(new Date(), 'DD.MM.YYYY')}',
                                    'Расчет заработной платы', 0, 0, 0, 0
                                ) returning ID;`
            )
            // Обработка работ.
            for (const sector of sectors) {
                for (const order of sector.orders) {
                    if (order.isDeleted) continue;
                    for (const work of order.works) {
                        if (work.isDeleted) {
                            await db.executeRequest(`delete from cost_of_work w where w.id = ${work.workOfCostId}`);
                            continue;
                        }else if (work.workOfCostId) {
                            await db.executeRequest(`update COST_OF_WORK W set W.PRICE = ${work.price} where W.ID = ${work.workOfCostId}`)
                        }else {
                            await db.executeRequest(`insert into COST_OF_WORK (ID_JOURNAL, ID_WORK_PRICE, PRICE) values (${order.idJournal}, ${work.workId}, ${work.price})`);
                        }
                    }
                    await db.executeRequest(`
                        insert into SALARY_TRANS_EL (ID_JOURNAL, ID_TRANSACTION)
                        values (${order.idJournal}, ${transaction.ID})
                    `);
                }
                 // Доп списания / начисления
                if (sector.otherTransactoins.data.length > 0) {
                    for (const otherTransaction of sector.otherTransactoins.data) {
                        if (!otherTransaction.name) continue;
                        if (!otherTransaction.value && otherTransaction.value > 0) continue;
                        if (!otherTransaction.modifer == 1 || !otherTransaction.modifer == -1) continue;
                        await db.executeRequest(`
                            insert into OTHER_TRANSACTIONS (ID_TRANSACTION, ID_SECTOR, NAME, DESCRIPTION, AMOUNT, MODIFER) 
                            values (${transaction.ID}, ${sector.id}, '${otherTransaction.userName}', 
                                '${otherTransaction.description}', ${Math.abs(otherTransaction.amount)}, ${otherTransaction.modifer})
                        `);
                    }
                }
            }
            // Закрытие Транзакции
            await db.executeRequest(`update SALARY_TRANSACTION T set T.TRANSACTION_COMPLETED = 1 where T.ID = ${transaction.ID}`);
            //Тут добавление в журнал расходов, сделать после запуска.
            return res.status(201).json({transaction});
        } catch (error) {
            return res.status(500).json({errors: [error.message], message: 'Не удаллось закрыть расчетный период, в связи с ошибкой транзакции.'});
        }  
    }
);

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
            console.log(other);

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

            const namesTransferOldSector  = await getNameOldSectorArrToIdNewSector(transfer.ID_SECTOR);
            const namesAcceptedOldSector  = await getNameOldSectorArrToIdNewSector(accepted.ID_SECTOR); 
            
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
            for (const o of registerOrders) {
                const order = orders.find(ord => ord.ID === o.idOrder);
                if (order) {
                    const plans = await getPlansToOrderId(order.ID);
                    if (!isWorkPlan(namesTransferOldSector, plans)) {
                        o.completed = false;
                        o.description = `Участок "${transfer.SECTOR}" не включен в планы по этому заказу.`;
                        continue;
                    }
                    if (!isWorkPlan(namesAcceptedOldSector, plans)) {
                        o.completed = false;
                        o.description = `Для данного заказа нет работ по участку "${accepted.SECTOR}"`;
                        continue;
                    }
                    const isAdopted = adoptedOrders.find(o => o.ID_ORDER == order.ID);
                    if (isAdopted) {
                        o.completed = false;
                        o.description = `Заказ уже принят в "${isAdopted.NAME}"`;
                        continue;
                    }
                    const statusAllow = journal.find(j => j.STATUS_NUM === order.ORDER_STATUS)
                    if (!statusAllow) {
                        o.completed = false;
                        o.description = `Не верный статус "${order.STATUS_DESCRIPTION}", ожидается: "${journal.map(j => j.STATUS_DESCRIPTION).join(', ')}"`;
                        continue;
                    }
                    o.completed = true;
                    o.description = `успешно!`;
                    // Открываем транзакцию
                    db.beginTransaction(async (err, trans) => {
                        if (err) {
                            o.completed = false;
                            o.description = `Ошибка сохранения в базу данных`;
                            console.log('Transaction error', err);
                            return;
                        }
                        const query = `
                                execute block
                                returns (ID integer)
                                as
                                begin
                                    insert into JOURNALS (ID_ORDER, ID_JOURNAL_NAMES, NOTE, TS, TRANSFER_DATE)
                                    values (${order.ID}, ${journal[0].ID_JOURNAL_NAME}, ${o.comment ? '\'' + o.comment + '\'' : null}, 
                                        '${format(new Date(), 'DD.MM.YYYY HH:mm:ss')}', '${format(other.date, 'DD.MM.YYYY HH:mm:ss')}') returning ID into :ID;
                                    insert into JOURNAL_TRANS (ID_EMPLOYEE, ID_SECTOR, ID_JOURNAL, MODIFER)
                                    values (${transfer.ID_EMPLOYEE}, ${transfer.ID_SECTOR}, :ID, -1);
                                    insert into JOURNAL_TRANS (ID_EMPLOYEE, ID_SECTOR, ID_JOURNAL, MODIFER)
                                    values (${accepted.ID_EMPLOYEE}, ${accepted.ID_SECTOR}, :ID, 1);
                                    insert into cost_of_work (id_journal, id_work_price, price)
                                    select :ID as id_journal, p.id as id_price, p.price from work_prices p
                                    where p.id_sector = ${transfer.ID_SECTOR};
                                    suspend;
                                end`;
                        //Выполнение запроса на добавление записи в журнал
                        trans.query(query, async (err, result) => {
                            if (err) {
                                trans.rollback();
                                o.completed = false;
                                o.description = `Ошибка сохранения в базу данных`;
                                console.log('Transaction error', err);
                                return;
                            }
                            const newStatus = await getStatusNumOldToIdStatusOld(journal[0].ID_STATUS_AFTER);
                            if (newStatus) {
                                //Есди назначен новый статус, выполняем запрос на обновление статуса.
                                trans.query(
                                    `update ORDERS O set O.ORDER_STATUS = ${newStatus} where O.ID = ${order.ID}`, 
                                    async (err, result) => {
                                        if (err) {
                                            //если ошибка, откатываем транзакцию.
                                            trans.rollback();
                                            o.completed = false;
                                            o.description = `Ошибка сохранения в базу данных`;
                                            console.log('Transaction error', err);
                                            return;
                                        }
                                        // Подтверждаем транзакцию
                                        trans.commit((err) => {
                                            if (err) {
                                                o.completed = false;
                                                o.description = `Ошибка транзакции.`;
                                                trans.rollback();
                                            }
                                        });
                                    }
                                )
                            }else{
                                //Подтверждаем транзакцию.
                                trans.commit((err) => {
                                    if (err) {
                                        o.completed = false;
                                        o.description = `Ошибка транзакции.`;
                                        trans.rollback();
                                    }
                                });
                            }
                        })    
                    });
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
            console.log(error);
            return res.status(500).json({errors: [error.message], message: defaultError});
        }
    }
);

module.exports = router;