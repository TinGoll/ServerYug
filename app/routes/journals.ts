import { NextFunction, Request, Response } from "express";

import { Router } from 'express';
import db from '../dataBase';
import jfunction, { getSectors } from '../systems/virtualJournalsFun';
import _ from 'lodash';

import { JournalCommentDto, JournalName, JournalOrderDto, JournalSectorDto } from "../types/journalTypes";
import User from "../entities/User";
import { getUserToToken } from "../systems/users";
import ApiError from "../exceptions/ApiError";
import adoptedOrderService from "../services/adopted-order-service";
import { OrderPlanSystem } from "../systems/order-plans-system";

// /api/journals/

const router = Router();

/**Перенести в отдельный роутер */
interface ReportForExcelDb {
    ID: number;
    ITM_ORDERNUM: string;
    SECTOR: string;
    DATE_PLAN: Date;
    LOCATION: string;
} 

// /api/journals/order-report - запрос для EXCEL, отчет по участкам по дате.
router.get(
    '/order-report/:date',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const date: string = req.params.date as string;
            if (!date) throw new Error('Некорректная дата');

            const query: string = `
                  SELECT DISTINCT O.ID, O.ITM_ORDERNUM, COALESCE(GET_SECTOR_NAME(S.ID_NEW_SECTOR), P.DATE_DESCRIPTION) AS SECTOR, 
                        P.DATE3 AS DATE_PLAN, GET_SECTOR_NAME(L.ID_SECTOR) AS LOCATION
                    FROM ORDERS O
                    LEFT JOIN ORDERS_DATE_PLAN P ON (P.ORDER_ID = O.ID)
                    LEFT JOIN SECTORS_OLD S ON (UPPER(S.NAME_OLD_SECTOR) = UPPER(P.DATE_DESCRIPTION))
                    LEFT JOIN SECTORS S2 ON (S.ID_NEW_SECTOR = S2.ID)
                    LEFT JOIN LOCATION_ORDER L ON (L.ID_ORDER = O.ID AND L.ID_SECTOR = S.ID_NEW_SECTOR)
                    WHERE P.DATE3 = '${date}'
                    ORDER BY S2.ORDER_BY`;

            const result: ReportForExcelDb[] = await db.executeRequest(query);
      
            const sectors = _.uniqWith( result
                .filter(s => {
                    if (s.SECTOR?.toUpperCase() == 'Колеровка'.toUpperCase()) return false
                    if (s.SECTOR?.toUpperCase() == 'Шлифовка Станок'.toUpperCase()) return false
                    if (s.SECTOR?.toUpperCase() == 'Склад упакованных заказов'.toUpperCase()) return false
                    if (s.SECTOR?.toUpperCase() == 'Упаковка профиля'.toUpperCase()) return false
                    return true;
                })
                .map(s => {
                return {name: s.SECTOR, orders: [] as string[]}
            }), _.isEqual);

            for (const sector of sectors) {
                sector.orders = result
                    .filter(o => o.SECTOR?.toUpperCase() == sector.name?.toUpperCase())
                    .map(o => o.ITM_ORDERNUM);
            }
            return res.status(200).json({sectors})
        } catch (e) {next(e);}
    }
)

/**Перенести в отдельный роутер */
// /api/journals/get-journals
router.get(
    '/get-journals', 
    async (req: Request, res: Response, next: NextFunction) => {
        const defaultError: string = 'Ошибка получения списка журналов.';
        try {
            // Проверка токена, получение пользователя.
            const user: User = await getUserToToken(req.get('Authorization'));
            // Конец проверки токена.
            const journals = await jfunction.permissionSet(user);
            if (journals.length == 0) throw ApiError.BadRequest(defaultError, ['Список журналов пуст.']);
            return res.json({journals: journals.filter(j => j.id != 5)}); // Удаляем из списка журнал бухгалтера
        } catch (e) {next(e);}
    }
)

// /api/journals/set-comment
router.post
(
    '/set-comment',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Проверка токена, получение пользователя.
            const user: User = await getUserToToken(req.get('Authorization'));
            // Конец проверки токена.
            const comment: JournalCommentDto = req.body;
            // Если ID коммента существует, изменяем существующий
            if (comment.dataId) {
                if (!comment.text || comment.text == '') {
                    // Если поле текстпустое - удаляем коммент.
                    const isDeleted: {ID: number | null} = await db.executeRequest(`DELETE FROM JOURNAL_DATA D WHERE D.ID = ${comment.dataId} RETURNING ID;`) as any;
                    return res.status(200).json({dataId: isDeleted.ID});
                }
                // Если не пустое, обновляем коммент.
                const result: { ID: number | null} = await db.executeRequest(`
                    UPDATE JOURNAL_DATA D
                    SET D.DATA_VALUE = '${comment.text}'
                    WHERE D.ID = ${comment.dataId} RETURNING ID;
                `) as any;
                if (result.ID) {
                    return res.status(201).json({dataId: result.ID});
                }
            }
            // Если ID коммента 0 - добавляем новый.
            const {ID} = await db.executeRequest(`
                INSERT INTO JOURNAL_DATA (ID_ORDER, ID_SECTOR, ID_EMPLOYEE, DATA_GROUP, DATA_NAME, DATA_VALUE)
                VALUES (${comment.orderId}, ${user.sectorId}, ${user.id}, 'Comment', 'Комментарий', '${comment.text}') 
                RETURNING ID;
            `) as any;
            return res.status(201).json({dataId: ID});
        } catch (e) {next(e);}
    }
);

// /api/journals/adopted
router.get (
    '/adopted/:id',
    async (req: Request, res: Response, next: NextFunction) => {
        try {

           // console.time('FirstWay');

            const limit: number| undefined      = req.query._limit as any;
            const page: number | undefined      = req.query._page as any;
         
            const id: number | undefined        = req.params.id as any;
            const d1: string | undefined        = req.query._d1 as any; 
            const d2: string | undefined        = req.query._d2 as any;

            const filter: string | undefined      = req.query._filter as any;
            const dateFirst: Date | undefined     = d1 ? convertToDate(d1, "dd/mm/yyyy") : undefined;
            const dateSecond: Date | undefined    = d2 ? convertToDate(d2, "dd/mm/yyyy") : undefined;

            if(!id) throw ApiError.BadRequest("Некорректный Id журнала.")
        
            // Проверка токена, получение пользователя.
            const user: User = await getUserToToken(req.get('Authorization'));
            // Конец проверки токена.

            // Проверка прав
            const journals      = await jfunction.permissionSet(user);

            const journal       = journals.find(j => j.id == id);

            if(!journal) throw ApiError.Forbidden(['У тебя нет прав на получение данных этого журнала. Обратись а администатору.']);

            const jnamesId = journal.j;
            
            const data = await adoptedOrderService.getAdoptedOrders(id, jnamesId, {
                limit, page, filter, d1: dateFirst, d2: dateSecond
            })
           // console.timeEnd('FirstWay');

            return res.json({...data});
        } catch (e) {next(e);}
    }
);

router.get(
    '/:id',
    async (req: Request, res: Response, next: NextFunction) => {
        const defaultError = 'Ошибка получения журнала.';
        try {
            const id: number | undefined        =  req.params.id as any;

            const limit: number| undefined      = req.query._limit as any;
            const page: number | undefined      = req.query._page as any;
         
            const d1: string | undefined        = req.query._d1 as any; 
            const d2: string | undefined        = req.query._d2 as any;

            const filter: string | undefined      = req.query._filter as any;
            const dateFirst: Date | undefined     = d1 ? convertToDate(d1, "dd/mm/yyyy") : undefined;
            const dateSecond: Date | undefined    = d2 ? convertToDate(d2, "dd/mm/yyyy") : undefined;

            // Проверка токена, получение пользователя.
            const user: User = await getUserToToken(req.get('Authorization'));
            // Конец проверки токена.
            const journals: JournalName[] = await jfunction.permissionSet(user);
            const allowed = journals.find(j => j.id == id);
            if(!allowed) throw ApiError.Forbidden(['У тебя нет прав на получение данного журнала. Обратись а администатору.']);
            // Проверка прав завершена.
            let journal: JournalSectorDto[] = [];
            if (!id) throw ApiError.BadRequest(defaultError, ['Некорректный идентификатор журнала.']);

            const orderPlanSystem = new OrderPlanSystem();
            const orders = await orderPlanSystem.getData({
                id: Number(id) === 6?undefined:id, // Если общий журнал, не указываем id
                limit,
                page,
                d1: dateFirst,
                d2: dateSecond,
                filter
            });

            const sectors = await getSectors();
            const sectorsId = [...new Set(orders.map(o => o.sectorId))];

            for (const sectorId of sectorsId) {
                if (!sectorId) continue;
                const s = sectors.find(s => s.id === sectorId);
                const sectorOrders = orders.filter(o => o.sectorId === sectorId);

                const sector: JournalSectorDto = {
                    id: sectorId!,
                    name: s?.name!,
                    overdue: [],
                    forToday: [],
                    forFuture: []
                }

                const now = new Date();
                const toDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())?.valueOf();

                sector.overdue      = sectorOrders.filter(o => o.datePlan?.valueOf()! < toDay).map(o => {
                    const order: JournalOrderDto = {
                        id:                 o.id,
                        itmOrderNum:        o.itmOrderNum,
                        sectorId:           o.sectorId!,
                        sectorName:         o.sectorName!,
                        nameSectorInOrder:  o.workerName!,
                        datePlan:           o.datePlan!,
                        fasadSquare:        o.fasadSquare,
                        generalSquare:      o.generalSquare,
                        workingTime:        o.workingTime,
                        data: {
                            comments: o.data?.comments
                        }
                    }
                    return order;
                }); // Просроченые

                sector.forToday     = sectorOrders.filter(o => o.datePlan?.valueOf()! == toDay).map(o => {
                    const order: JournalOrderDto = {
                        id:                 o.id,
                        itmOrderNum:        o.itmOrderNum,
                        sectorId:           o.sectorId!,
                        sectorName:         o.sectorName!,
                        nameSectorInOrder:  o.workerName!,
                        datePlan:           o.datePlan!,
                        fasadSquare:        o.fasadSquare,
                        generalSquare:      o.generalSquare,
                        workingTime:        o.workingTime,
                        data: {
                            comments: o.data?.comments
                        }
                    }
                    return order;
                }); // На сегодня
                sector.forFuture    = sectorOrders.filter(o => o.datePlan?.valueOf()! > toDay).map(o => {
                    const order: JournalOrderDto = {
                        id:                 o.id,
                        itmOrderNum:        o.itmOrderNum,
                        sectorId:           o.sectorId!,
                        sectorName:         o.sectorName!,
                        nameSectorInOrder:  o.workerName!,
                        datePlan:           o.datePlan!,
                        fasadSquare:        o.fasadSquare,
                        generalSquare:      o.generalSquare,
                        workingTime:        o.workingTime,
                        data: {
                            comments: o.data?.comments
                        }
                    }
                    return order;
                }); // Будущие
                journal.push(sector);
            }

            if (!journal.length) throw ApiError.BadRequest(defaultError, ['Такой журнал не существует.']);
            return res.json({journal});

        } catch (e) {next(e);}
    }
)

const convertToDate = (date: string, format: string): Date => {
    var normalized: string      = date.replace(/[^a-zA-Z0-9]/g, '-');
    var normalizedFormat: string = format.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
    var formatItems: any    = normalizedFormat.split('-');
    var dateItems: any       = normalized.split('-');
    var monthIndex    = formatItems.indexOf("mm");
    var dayIndex      = formatItems.indexOf("dd");
    var yearIndex     = formatItems.indexOf("yyyy");
    var hourIndex     = formatItems.indexOf("hh");
    var minutesIndex  = formatItems.indexOf("ii");
    var secondsIndex  = formatItems.indexOf("ss");
    var today = new Date();
    var year  = yearIndex>-1  ? dateItems[yearIndex]    : today.getFullYear();
    var month = monthIndex>-1 ? dateItems[monthIndex]-1 : today.getMonth()-1;
    var day   = dayIndex>-1   ? dateItems[dayIndex]     : today.getDate();
    var hour    = hourIndex>-1      ? dateItems[hourIndex]    : today.getHours();
    var minute  = minutesIndex>-1   ? dateItems[minutesIndex] : today.getMinutes();
    var second  = secondsIndex>-1   ? dateItems[secondsIndex] : today.getSeconds();
    return new Date(year,month,day,hour,minute,second);
};

export default router;