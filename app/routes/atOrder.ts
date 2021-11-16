import { Router, Request, Response, NextFunction } from 'express';
import db from '../dataBase';
import atOrderQuery from '../query/atOrder';
import { check, validationResult } from 'express-validator';
import { format } from 'date-format-parse';
import jfunction from '../systems/virtualJournalsFun';
import { BarcodesDb } from '../types/orderTypes';
import { JournalOtherTransDb, JournalSalaryDb, JournalTransactionsDb, SalarySectorDto } from '../types/journalTypes';
import extraSystem from '../systems/extradata-system';
import users, { getUserToToken } from '../systems/users';
import ApiError from '../exceptions/ApiError';
import User from '../entities/User';



// /api/at-order/

const router = Router();


// /api/at-order/data
router.get(
    '/data',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query: string = atOrderQuery.get('get_barcodes');
            const barcodes: BarcodesDb[] = await db.executeRequest(query);
            return res.status(200).json({barcodes});
        } catch (e) {next(e);}
    }
);
// /api/at-order/journal-names
router.get(
    '/journal-names',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query: string = atOrderQuery.get('get_barcodes');
            let barcodes: BarcodesDb[]  = await db.executeRequest(query);
            return res.status(200).json({barcodes});
        } catch (e) {next(e);}
    }
);
// /api/at-order/salary-transactions/1
router.get(
    '/salary-transactions/:id',
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const idJournalName: number | undefined =  req.params.id as any;
            const defaultError: string = 'Не достаточно прав.';
            // Проверка токена, получение пользователя.
            const user: User = await getUserToToken(req.get('Authorization'));
            // Конец проверки токена.
            // Проверка прав
            if(!idJournalName) throw ApiError.BadRequest('Не корректный ID журнала.')
            const journals = await jfunction.permissionSet(user);
            const journal = journals.find(j => j.id == idJournalName); // получаем обект журнала.
            if(!journal) throw ApiError.Forbidden(['У тебя нет прав на получение данных этого журнала. Обратись а администатору.']);
            // Конец проверки прав.
            
            const transactions: JournalTransactionsDb[] = await db.executeRequest(`
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
                where J.ID_JOURNAL_NAMES in (${journal.j.join(', ')})
                group by T.ID, T.DATE_ADDED, T.NAME
                order by T.DATE_ADDED desc
            `);
            if (!transactions || transactions.length == 0) throw ApiError.BadRequest('Список пуст.')
            return res.status(200).json({transactions});
        } catch (e) {next(e);}
    }
);
// /api/at-order/salary-report/:idtransaction

router.get(
    '/salary-report/:idtransaction',
    async (req: Request, res: Response, next: NextFunction) => {
        const defaultError = `При получаении данных по транзакции, произошла ошибка.`;
        try {
            // Проверка токена, получение пользователя.
             const user: User = await getUserToToken(req.get('Authorization'));
            // Конец проверки токена.
            const idTrans: number | undefined =  req.params.idtransaction as any;
            const salary: JournalSalaryDb[] = await db.executeRequest(`
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

            const sectors: SalarySectorDto[] = [];
            if (salary.length == 0) return res.status(200).json({sectors});
            const sectorsName: string[] = [...new Set(salary.map(s => s.SECTOR))].filter(s => {
                return s != null || s != undefined;
            });
            for (const sectorName of sectorsName) {
                const ordersId: number[]  = [...new Set(salary.filter(o => o.SECTOR == sectorName).map(o => o.ID))];
                const sectorID: number | undefined = salary.find(s => s.SECTOR == sectorName)?.ID_SECTOR;
                const sector: SalarySectorDto = {id: sectorID as number, name: sectorName, otherTransactoins: {}, orders: []};
                const otherTrans: JournalOtherTransDb[] = await db.executeRequest(`select T.NAME, T.DESCRIPTION, T.AMOUNT, T.MODIFER, T.TRANS_COMMENT
                                                        from OTHER_TRANSACTIONS T
                                                        where T.ID_TRANSACTION = ${idTrans} and T.ID_SECTOR = ${sectorID}`);
                sector.otherTransactoins = {
                    data: [
                        ...otherTrans.map((t) => {
                            return {
                                userName: t.NAME,
                                description: t.DESCRIPTION,
                                amount: t.AMOUNT,
                                comment: t.TRANS_COMMENT,
                                modifer: t.MODIFER
                            }
                        })
                    ] 
                }
            
                for (const id of ordersId) {
                    const idJournal: number | undefined = salary.find(s => s.ID == id)?.ID_JOIRNAL;
                    const itmOrderNum: string | undefined = salary.find(s => s.ID == id)?.ITM_ORDERNUM;
                    const works = salary.filter(o => o.ID == id && (o.ID_WORK != null || o.ID_WORK != undefined)).map(w => {
                        return {
                            workOfCostId:   w.ID_WORK_OF_COST,
                            workId:         w.ID_WORK,
                            work:           w.WORK_NAME,
                            square:         w.ORDER_FASADSQ,
                            price:          w.PRICE,
                            money:          w.MONEY
                        }
                    });
                
                    const order: any = {id, itmOrderNum, idJournal, works};
                    sector.orders.push(order);
                }
                sectors.push(sector);
            }
            return res.status(200).json({sectors});
        } catch (e) {next(e);}
    }
);
//  Preliminary calculation
// /api/at-order/preliminary-calculation/:id

router.get(
    '/preliminary-calculation/:id',
    async (req: Request, res: Response, next: NextFunction) => {
        const defaultError: string = `При получаении данных по предварительному просчету, произошла ошибка.`;
        const permissions: string[] = [
            'Journals [preliminary-calculation] get all', 
            'Journals [preliminary-calculation] edit all works'
        ]
        const idJournalName: number | undefined =  req.params.id as any;
        try {
            // Проверка токена, получение пользователя.
            const user: User = await getUserToToken(req.get('Authorization'));
            // Конец проверки токена.
            // Проверка прав
            if(!idJournalName) throw new Error('Не корректный id журнала.');
            const journals = await jfunction.permissionSet(user);
            const journal = journals.find(j => j.id == idJournalName); // получаем обект журнала.
            if(!journal) return res.status(500)
                .json({errors: ['У тебя нет прав на получение данных этого журнала. Обратись а администатору.'], message: defaultError});
            // Конец проверки прав.

            const query: string = `select O.ID, O.ITM_ORDERNUM, J.ID as ID_JOIRNAL, P.ID_SECTOR, S.NAME as SECTOR, 
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
                                where ${await user.permissionCompare(permissions[0]) ? '' : '(P.OPTIONAL != -1) and'}
                                E.ID is null and j.id_journal_names in (${journal.j.join(', ')})`;

            const isCanEditAllWorks = await user.permissionCompare(permissions[1]);
            const salary = await db.executeRequest(query);
            const sectors = [];

            if (salary.length == 0) return res.status(500).json({errors: ['В текущем периоде, по этому журналу нет принятых заказов.'], message: 'Список пуст'});
            const sectorsName = [...new Set(salary.map(s => s.SECTOR))].filter(s => {
                return s != null || s != undefined;
            });

            for (const sectorName of sectorsName) {
                const ordersId  = [...new Set(salary.filter(o => o.SECTOR == sectorName).map(o => o.ID))];
                const sectorID = salary.find(s => s.SECTOR == sectorName).ID_SECTOR;
                const sector: SalarySectorDto = {id:sectorID, name: sectorName, journalNameId: idJournalName, otherTransactoins: {}, orders: []};
                for (const id of ordersId) {
                    const idJournal = salary.find(s => s.ID == id).ID_JOIRNAL;
                    const itmOrderNum = salary.find(s => s.ID == id).ITM_ORDERNUM;
                    const works = salary.filter(o => o.ID == id && (o.ID_WORK != null || o.ID_WORK != undefined)).map(w => {
                        let checkOptional = w.OPTIONAL;
                        if(isCanEditAllWorks) checkOptional = -1;
                        return {
                            workOfCostId:   w.ID_WORK_OF_COST,
                            workId:         w.ID_WORK,
                            work:           w.WORK_NAME,
                            square:         w.ORDER_FASADSQ,
                            price:          w.PRICE,
                            money:          w.MONEY,
                            optional:       checkOptional,
                            isDeleted:      0,
                            isEdited:       0
                        }
                    });

                    const order: any = {id, itmOrderNum, idJournal, isDeleted:0, works};
                    sector.orders.push(order);
                }
                // Дополнительные начисления и списания.
                const users = await db.executeRequest(`select E.NAME from EMPLOYERS E where E.ID_SECTOR = ${sectorID}`);
                sector.otherTransactoins = {
                    users: ['Все', ...users.map(u => u.NAME)],
                    values: [
                        {userName: '', description: 'Налог', amount: 0, modifer: -1, comment: ''},
                        {userName: '', description: 'Штраф', amount: 0, modifer: -1, comment: ''},
                        {userName: '', description: 'Другое (Удержание)', amount: 0, modifer: -1, comment: ''},
                        {userName: '', description: 'Возврат долга', amount: 0, modifer: -1, comment: ''},
                        {userName: '', description: 'Больничный', amount: 0, modifer: 1, comment: ''},
                        {userName: '', description: 'Отпускные', amount: 0, modifer: 1, comment: ''},
                        {userName: '', description: 'Аванс', amount: 0, modifer: 1, comment: ''},
                        {userName: '', description: 'Другое (Надбавки)', amount: 0, modifer: 1, comment: ''}
                    ],
                    data: []
                }
                sectors.push(sector);

            }
            return res.status(200).json({sectors});
        } catch (e) {next(e);}
    }
);


// /api/at-order/close-billing-period
router.patch(
    '/close-billing-period',
    async (req: Request, res: Response, next: NextFunction) => {
        const permissions = [
            'Journals [close-billing-period] patch all'
        ]
        // Проверка токена, получение пользователя.
        const user: User = await getUserToToken(req.get('Authorization'));
        // Конец проверки токена.

        if (!await user.permissionCompare(permissions[0])) 
                throw ApiError.Forbidden(['У тебя нет прав на закрытие расчетного периода. Обратись к администатору.'])
        // Проверка, есть ли заказы для закрытия периода.
        const {sectors} = req.body as any;
        let isEmpty = true;
        if (sectors && sectors.length) 
            for (const sector of sectors)
                if (sector && sector?.orders.length) isEmpty = false;
         if (isEmpty) throw ApiError.BadRequest('Список пуст');
        // Конец проверки.
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
            ) as any;
            // Обработка работ.
            for (const sector of sectors) {
                for (const order of sector.orders) {
                    if (order.isDeleted) continue;
                    for (const work of order.works) {
                        if (work.isDeleted) {
                            await db.executeRequest(`delete from cost_of_work w where w.id = ${work.workOfCostId}`);
                            continue;
                        }else if (work.workOfCostId) {
                            if (work.isEdited) {
                                await db.executeRequest(`update COST_OF_WORK W set W.PRICE = ${work.price} where W.ID = ${work.workOfCostId}`);
                            } 
                        }else {
                            await db.executeRequest(`insert into COST_OF_WORK (ID_JOURNAL, ID_WORK_PRICE, PRICE) values (${order.idJournal}, ${work.workId}, ${work.price})`);
                        }
                    }
                }
                await db.executeRequest(`
                    insert into SALARY_TRANS_EL (ID_JOURNAL, ID_TRANSACTION)
                    select j.id, ${transaction.ID}
                    from journals j
                    where j.id in (${sector.orders.filter((o: { isDeleted: any; }) => !o.isDeleted).map((o: { idJournal: any; }) => o.idJournal).join(', ')})
                `)
                 // Доп списания / начисления
                if (sector.otherTransactoins.data.length > 0) {
                    for (const otherTransaction of sector.otherTransactoins.data) {
                        //if (!otherTransaction.userName) continue;
                        if (!otherTransaction.amount) continue;
                        if (!(otherTransaction.modifer == 1 )|| !(otherTransaction.modifer == -1)) continue;

                        await db.executeRequest(`
                            insert into OTHER_TRANSACTIONS (ID_TRANSACTION, ID_SECTOR, NAME, DESCRIPTION, AMOUNT, MODIFER, TRANS_COMMENT) 
                            values (${transaction.ID}, ${sector.id}, '${otherTransaction.userName}', 
                                '${otherTransaction.description}', ${Math.abs(otherTransaction.amount)}, 
                                ${otherTransaction.modifer}, ${otherTransaction.comment ? '\'' + otherTransaction.comment + '\'' : null})
                        `);


                    }
                }
            }
            // Изменить на более оптимальный
            const [trSum] = await db.executeRequest(`
                select cast((sum(coalesce(O.ORDER_FASADSQ, 0) * W.PRICE) +
                    (select coalesce(sum(T2.AMOUNT * T2.modifer), 0) as OTHER_AMOUNT
                    from OTHER_TRANSACTIONS T2
                    where T2.ID_TRANSACTION = T.ID)) as decimal(8,2)) as MONEY
                from SALARY_TRANS_EL E
                left join JOURNALS J on (E.ID_JOURNAL = J.ID)
                left join SALARY_TRANSACTION T on (E.ID_TRANSACTION = T.ID)
                left join COST_OF_WORK W on (W.ID_JOURNAL = J.ID)
                left join ORDERS O on (J.ID_ORDER = O.ID)
                where T.id = ${transaction.ID}
                group by T.ID, T.DATE_ADDED
            `);

            const cashlow = await db.executeRequest(`
                insert into JOURNAL_CASHFLOW (FACT_DATE, CATEGORY, PURPOSE, MONEYSUM, comment, TS)
                values (CURRENT_DATE, 'Зарплата сборка', 'Цветков', ${(Math.abs(trSum.MONEY) * -1)}, 'Внесено автоматически, формирование зарплаты сборка', CURRENT_TIMESTAMP)
                returning ID
            `) as any;
      
            // Закрытие Транзакции
            await db.executeRequest(`
               UPDATE SALARY_TRANSACTION T
                SET
                T.TRANSACTION_COMPLETED = 1,
                T.TRANSACTION_AMOUNT = ${trSum.MONEY},
                T.IS_JOURNAL_ENTRY = 1,
                T.ID_JOURNAL_CASH = ${cashlow.ID}
                WHERE T.ID = ${transaction.ID}
            `);
            //Тут добавление в журнал расходов, сделать после запуска.
            return res.status(201).json({transaction});
        } catch (e) {next(e);}  
    }
);

// /api/at-order/add
router.post(
    '/add',
    [
        check('idTransfer', 'Передающий участок не может быть пустым.').exists(),
        check('idAccepted', 'Принимающий участок не может быть пустым.').exists()
    ],
    async (req: Request, res: Response, next: NextFunction) => {
        const defaultError = 'Во время записи в журнал, произошли ошибки.';
        const journalErrors = [];
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(500)
                        .json({errors: errors.array(), message: defaultError});
            // получаем необходимые данные body/
            const {idTransfer: transferBarcode, idAccepted: acceptedBarcode, orders: registerOrders, extraData, ...other} = req.body;
            // Если массив заказов пустой
            if (!Array.isArray(registerOrders) || registerOrders.length <= 0) throw ApiError.BadRequest(defaultError, ['Нет заказов для передачи.']);
            // Если баркод применающий и передающий, один и тот же            
            if (transferBarcode == acceptedBarcode) throw ApiError.BadRequest(defaultError, ['Нельзя передавать заказ самому себе.']);
            // Получаем все данные по штрихкоду.
            let query = atOrderQuery.get('get_barcodes', {
                $where: `UPPER(B.BARCODE) = '${transferBarcode.toUpperCase()}' 
                            or UPPER(B.BARCODE) = '${acceptedBarcode.toUpperCase()}'`});
            const barcodes = await db.executeRequest(query);
            // Создаем объект передающий и принимающий.
            const transfer = barcodes.find(item => item.BARCODE.toUpperCase() === transferBarcode.toUpperCase());
            const accepted = barcodes.find(item => item.BARCODE.toUpperCase() === acceptedBarcode.toUpperCase());

            // Если какой - то из двух штрихкодов некорректный.
            if (!transfer) journalErrors.push('Участок отправитель не определен.');
            if (!accepted) journalErrors.push('Участок получатель не определен.');

            // В случае блокировки штрихкода.
            if (transfer && transfer.BLOCKED != 0) journalErrors.push(`Карточка отправителя заблокирована, пожалуйста обратитесь к руководству.`);
            if (accepted && accepted.BLOCKED != 0) journalErrors.push(`Карточка получателя заблокирована, пожалуйста обратитесь к руководству.`);
            if (journalErrors.length > 0) throw ApiError.BadRequest(defaultError, journalErrors);

            // Получаем старое название участка, по id нового участка.
            const namesTransferOldSector  = await jfunction.getNameOldSectorArrToIdNewSector(transfer.ID_SECTOR);
            const namesAcceptedOldSector  = await jfunction.getNameOldSectorArrToIdNewSector(accepted.ID_SECTOR); 

            // Получаем зависимости 
            query = `
                SELECT  D.ID, D.ID_SECTOR_TRANSFER, D.ID_SECTOR_ACCEPTED, D.ID_JOURNAL_NAME,
                        D.ID_STATUS_AFTER, D.ID_STATUS_AFTER_OLD, D.START_STAGE
                FROM JOURNAL_DEP D
                WHERE   D.ID_SECTOR_TRANSFER = ${transfer ? transfer.ID_SECTOR : null} AND
                        D.ID_SECTOR_ACCEPTED = ${accepted ? accepted.ID_SECTOR : null}`

            const dependencies = (await db.executeRequest(query)).map(d => {
                return {
                    id:                 d.ID,
                    transfer:           d.ID_SECTOR_TRANSFER,
                    accepted:           d.ID_SECTOR_ACCEPTED,
                    journalNameId:      d.ID_JOURNAL_NAME,
                    statusAfterOldId:   d.ID_STATUS_AFTER_OLD,
                    statusAfterId:      d.ID_STATUS_AFTER,
                    startStage:       !!d.START_STAGE
                }
            });
            // Если в зависимости передающий этап являеться стартовым.
            const isStartingStage = (dependencies.find(d => d.startStage))?.startStage || false;

            // Если зависимостей нет, то эти участки не могут передевать заказы друг другу, в таком порядке.
            if (dependencies.length == 0) throw ApiError.BadRequest(defaultError, 
                    [`Участок ${transfer ? transfer.SECTOR : 
                                '"отправитель" не определен и'} не может передавать заказы ${accepted ? 'участку ' + accepted.SECTOR : 
                                        'не определенному участку.'}`])
            
            // Проверка заказов.   
            const orderListString = registerOrders.map(o => o.idOrder).join(', ');       
            query = `
                SELECT DISTINCT 
                    O.ID, O.ITM_ORDERNUM, S.ID AS OLD_STATUS_ID, S.STATUS_DESCRIPTION,
                    GET_JSTATUS_ID(O.ID) AS STATUS_ID,
                    J.ID AS JOURNAL_ID, N.NAME AS JOURNAL_NAME
                FROM ORDERS_IN_PROGRESS O
                    LEFT JOIN LIST_STATUSES S ON (O.ORDER_STATUS = S.STATUS_NUM)
                    LEFT JOIN JOURNALS J ON (J.ID_ORDER = O.ID and EXISTS (
                    select t.id from journal_trans t
                    where t.id_journal = j.id and ((t.id_sector = ${transfer.ID_SECTOR} and t.modifer < 0) OR (t.id_sector = ${accepted.ID_SECTOR} and t.modifer > 0))
                    ))
                    LEFT JOIN JOURNAL_NAMES N ON (J.ID_JOURNAL_NAMES = N.ID)
                WHERE O.ID IN (${orderListString})`;
    
            const orderWorks = (await db.executeRequest(`
                        SELECT P.ID, P.ORDER_ID, P.DATE_SECTOR, P.DATE_DESCRIPTION, P.COMMENT, P.DATE1, P.DATE2, P.DATE3
                        FROM ORDERS_DATE_PLAN P
                        WHERE P.ORDER_ID IN (${orderListString})`))
                .map(w => {
                    return {
                        id:                 w.ID,
                        orderId:            w.ORDER_ID,
                        dateSector:         w.DATE_SECTOR,  
                        dateDescription:    w.DATE_DESCRIPTION,  
                        comment:            w.COMMENT ,
                        date1:              w.DATE1, 
                        date2:              w.DATE2,
                        date3:              w.DATE3
                    }
                });
            const orderLocations = (await db.executeRequest(`
                SELECT L.ID_ORDER, L.ID_SECTOR, L.MODIFER
                FROM LOCATION_ORDER L
                WHERE L.ID_ORDER IN (${orderListString}) AND L.ID_SECTOR = ${transfer.ID_SECTOR}
            `))
            .map(l => {
                return {
                    orderId: l.ID_ORDER,
                    sectorId: l.ID_SECTOR,
                    modifer: l.MODIFER
                }
            });
            const orders = (await db.executeRequest(query)).map(o => {
                const works = orderWorks.filter(w => w.orderId == o.ID);
                const locations = orderLocations.filter(l => l.orderId == o.ID);
                return {
                    id:             o.ID,
                    itmOrderNum:    o.ITM_ORDERNUM,
                    oldStatusId:    o.OLD_STATUS_ID,
                    oldStatusName:  o.STATUS_DESCRIPTION,
                    statusId:       o.STATUS_ID,
                    journalId:      o.JOURNAL_ID,
                    journalName:    o.JOURNAL_NAME,
                    works,
                    locations,
                }
            });
                                  
            for (const registerOrder of registerOrders) {
                const order = orders.find(o => o.id == registerOrder.idOrder)
                registerOrder.completed = true;
                registerOrder.description = `успешно`;

                if (!registerOrder) continue;
                // Если есть данные работы, по передающему участку.
                if (!jfunction.isWorkPlan(namesTransferOldSector, order?.works || [])) {
                    registerOrder.completed = false;
                    registerOrder.description = `Участок "${transfer.SECTOR}" не включен в планы по этому заказу.`;
                    continue;
                }
                // Если есть данные работы, по принимающему участку.
                if (!jfunction.isWorkPlan(namesAcceptedOldSector, order?.works || [])) {
                    registerOrder.completed = false;
                    registerOrder.description = `Участок "${accepted.SECTOR}" не включен в планы по этому заказу.`;
                    continue;
                }
                // Если заказ уже передан от отправителья к получателю. (проверка статуса отключена, можно передавать только один раз)
                if(order?.journalId) {
                    registerOrder.completed = false;
                    registerOrder.description = `Заказ уже принят в "${order.journalName}"`;
                    continue;
                }
                // Если заказ не был принят передающим участком или 
                registerOrder.modiferCount = 1; // Установка мдификатора по умолчанию
                if (!isStartingStage) {
                    const [ location ] = order?.locations || [];
                    const modiferCount = location?.modifer;
                    if (modiferCount) {
                        registerOrder.modiferCount = modiferCount;
                    }else{
                        registerOrder.completed = false;
                        registerOrder.description = `Заказ не был передан в участок "${transfer.SECTOR}", и этот участок не является стартовым.`;
                        continue;
                    }
                }
                const query = `
                        execute block
                        returns (ID integer)
                        as
                        begin
                            insert into JOURNALS (ID_ORDER, ID_JOURNAL_NAMES, NOTE, TS, TRANSFER_DATE)
                            values (${order?.id}, ${dependencies[0].journalNameId}, ${registerOrder.comment ? '\'' + registerOrder.comment + '\'' : null}, 
                                '${format(new Date(), 'DD.MM.YYYY HH:mm:ss')}', '${format(other.date, 'DD.MM.YYYY HH:mm:ss')}') returning ID into :ID;
                            insert into JOURNAL_TRANS (ID_EMPLOYEE, ID_SECTOR, ID_JOURNAL, MODIFER)
                            values (${transfer.ID_EMPLOYEE}, ${transfer.ID_SECTOR}, :ID, ${Math.abs(registerOrder.modiferCount) * -1});
                            insert into JOURNAL_TRANS (ID_EMPLOYEE, ID_SECTOR, ID_JOURNAL, MODIFER)
                            values (${accepted.ID_EMPLOYEE}, ${accepted.ID_SECTOR}, :ID, ${Math.abs(registerOrder.modiferCount)});
                            insert into cost_of_work (id_journal, id_work_price, price)
                            select :ID as id_journal, p.id as id_price, p.price from work_prices p
                            where p.id_sector = ${transfer.ID_SECTOR};
                            suspend;
                        end`;
   
                const [newJournal] = await db.executeRequest(query);

                // Смена статусов, если указаны.
                if (dependencies[0].statusAfterOldId) {
                    const oldStatusNum = await jfunction.getStatusNumOldToIdStatusOld(dependencies[0].statusAfterOldId);
                    if (oldStatusNum) await db.executeRequest(`update ORDERS O set O.ORDER_STATUS = ${oldStatusNum} where O.ID = ${order?.id}`);
                }
                if (dependencies[0].statusAfterId) {
                    await db.executeRequest(`INSERT INTO JOURNAL_STATUS_LIST (ID_ORDER, ID_JOURNAL, ID_STATUS)
                                             VALUES(${order?.id}, ${newJournal.ID}, ${dependencies[0].statusAfterId})`);
                }

            }

            if (extraData && extraData?.length) {
                const countExtraData = await extraSystem(extraData);
            }
            
            const countOrders = registerOrders.filter(o => o.completed).length;
            let resultMessage = `${countOrders ? '☑️ Принято ' + countOrders + ' из ' + registerOrders.length : '❌ Не один из заказов не принят.'}`;
            if (countOrders == registerOrders.length)  resultMessage = `✅ Все заказы приняты. (${registerOrders.length})`
            return res.status(201).json({
                message: resultMessage,
                orders: registerOrders
            });
        } catch (e) {next(e);}
    }
);

export default router;
