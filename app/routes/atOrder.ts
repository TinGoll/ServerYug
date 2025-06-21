import { Router, Request, Response, NextFunction } from 'express';
import db from '../dataBase';
import atOrderQuery from '../query/atOrder';
import { check, validationResult } from 'express-validator';
import { format } from 'date-format-parse';
import jfunction from '../systems/virtualJournalsFun';
import { JournalOtherTransDb, JournalSalaryDb, JournalTransactionsDb, SalarySectorDto } from '../types/journalTypes';

import ApiError from '../exceptions/ApiError';
import User from '../entities/User';
import { getUserToToken } from '../systems/users';
import { BarcodesDb, ITransferOrders } from '../types/at-order-types';
import atOrderService from '../services/at-order-service';


import { default as PQueue } from 'p-queue';

const queue = new PQueue({concurrency: 1});


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
                order by T.DATE_ADDED desc`);
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
            if(!journal) throw ApiError.Forbidden(['У тебя нет прав на получение данных этого журнала. Обратись а администатору.']);
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
                        if (otherTransaction.modifer !== 1 && otherTransaction.modifer !== -1) continue;

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



async function queueTransferOrders(data: ITransferOrders) {
    return queue.add(() => {
        console.log("queueTransferOrders - 2");
        return atOrderService.transferOrders(data);
    });
}

router.post(
    '/add',
    [
        check('idTransfer', 'Передающий участок не может быть пустым.').exists(),
        check('idAccepted', 'Принимающий участок не может быть пустым.').exists()
    ],
    async (req: Request<any, any, ITransferOrders>, res: Response, next: NextFunction) => {
        try {               
            const data = req.body;
            const result = await queueTransferOrders(data);
            return res.status(201).json(result)
        } catch (e) {
            next(e);
        }
    }
);

export default router;
