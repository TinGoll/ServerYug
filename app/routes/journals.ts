import { NextFunction, Request, Response } from "express";

import { Router } from 'express';
import db from '../dataBase';
import { check, validationResult } from 'express-validator';
import { format } from 'date-format-parse';
import settings from '../settings';
import jwt from 'jsonwebtoken';
import atOrderQuery from '../query/atOrder';
import jfunction from '../systems/virtualJournalsFun';
import _ from 'lodash';
import { decodedDto } from "../types/user";
import { JournalCommentDto, JournalName, JournalSectorDto } from "../types/journalTypes";
import { QueryOptions } from "../types/queryTypes";
import User from "../entities/User";
import users from "../systems/users";

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
// /api/journals/order-report - запрос для EXCEL, отчет по участкам по дате
router.get(
    '/order-report/:date',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const date: string = req.params.date as string;
            if (!date) throw new Error('Не корректная дата');

            const query: string = `
                  SELECT DISTINCT O.ID, O.ITM_ORDERNUM, GET_SECTOR_NAME(S.ID_NEW_SECTOR) AS SECTOR, P.DATE3 AS DATE_PLAN, GET_SECTOR_NAME(L.ID_SECTOR) AS LOCATION
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
                    if (s.SECTOR.toUpperCase() == 'Колеровка'.toUpperCase()) return false
                    if (s.SECTOR.toUpperCase() == 'Шлифовка Станок'.toUpperCase()) return false
                    return true;
                })
                .map(s => {
                return {name: s.SECTOR, orders: [] as string[]}
            }), _.isEqual);

            for (const sector of sectors) {
                sector.orders = result
                    .filter(o => o.SECTOR.toUpperCase() == sector.name.toUpperCase())
                    .map(o => o.ITM_ORDERNUM);
            }
            return res.status(200).json({sectors})
        } catch (e) {
            console.log(e);
            res.status(500).json({message: 'Не корректная дата', errors: []})
        }
    }
)

/**Перенести в отдельный роутер */
// /api/journals/get-journals
router.get(
    '/get-journals', 
    async (req: Request, res: Response, next: NextFunction) => {
        const defaultError: string = 'Ошибка получения списка журналов.';
        try {
            const token = req.get('Authorization') as string;
            if (!token) throw new Error('Некорректный токен');

            jwt.verify(token, settings.secretKey, async (err, decoded) => {
                if (err) return res.status(500)
                    .json({errors: [err.message], message: 'Токен не действителен.'});
                if(!decoded) throw new Error();
                const user: User | null = await users.getUserToID(decoded.userId);
                if(!user) throw new Error('Некорректный токен');
                // Проверка прав на получение журналов
                const journals = await jfunction.permissionSet(user);
                if (journals.length == 0) return res.status(500).json({errors:['Список журналов пуст.'], message: defaultError})
                return res.json({journals: journals.filter(j => j.id != 5)}); // Удаляем из списка журнал бухгалтера
            });
        } catch (error) {
            const e = error as Error;
            return res.status(500).json({errors: [e.message], message: defaultError});
        }
    }
)

// /api/journals/set-comment
router.post
(
    '/set-comment',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Проверка токена, получение пользователя.
            let decoded: decodedDto;
            const token = req.get('Authorization');
            if(!token) throw new Error('Некорректный токен.');
            try {decoded = jwt.verify(token, settings.secretKey) as decodedDto;} 
            catch (error) {return res.status(500).json({errors: [(error as Error).message], message: 'Некорректный токен'})}
            const user = await users.getUserToID(decoded.userId);
            if(!user) throw new Error('Некорректный токен');
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
        } catch (error) {
            const e = error as Error;
            res.status(500).json({errors:[e.message], message: 'Ошибка добавления комментария.'})
        }
    }
);

// /api/journals/adopted
router.get (
    '/adopted/:id',
    async (req: Request, res: Response, next: NextFunction) => {
        const defaultError: string = 'Ошибка получения принятых заказов';
        const permissionName: string = 'Journals [adopted] get';
        try {
            const options: QueryOptions   = {...atOrderQuery.getdefaultOptions('get_adopted')} as QueryOptions;
            const limit: number                 = req.query._limit as any || 100;
            const page: number | undefined      = req.query._page as any;
            const sort: string | undefined      = req.query._sort as any;
            const find: number | undefined      = req.params.id as any;
            const d1: string | undefined        = req.query._d1 as any; 
            const d2: string | undefined        = req.query._d2 as any;

            const filter: string | undefined        = req.query._filter as any;
            const dateFirst: Date | undefined     = d1 ? convertToDate(d1, "dd/mm/yyyy") : undefined;
            const dateSecond: Date | undefined    = d2 ? convertToDate(d2, "dd/mm/yyyy") : undefined;
        
            if (limit)  options.$first = limit;
            if (page)   options.$skip = (page * limit) - limit;
            if (sort)   options.$sort = sort; 

            // Проверка токена, получение пользователя.
            let decoded: decodedDto;
            const token = req.get('Authorization');
            if (!token) throw new Error('Некорректный токен.');
            try {decoded = jwt.verify(token, settings.secretKey) as any;} 
            catch (error) {return res.status(500).json({errors: [(error as Error).message], message: 'Некорректный токен'})}
            const user = await users.getUserToID(decoded.userId);
            if(!user) throw new Error('Некорректный токен');
            // Конец проверки токена.

            // Проверка прав
            const journals = await jfunction.permissionSet(user);
            const journal = journals.find(j => j.id == find);
            if(!journal) return res.status(500)
                .json({errors: ['У тебя нет прав на получение данных этого журнала. Обратись а администатору.'], message: defaultError});

            // Конец проверки прав.
            if (find && find > 0) {
                options.$where =  `${options.$where} and J.ID_JOURNAL_NAMES in (${journal.j.join(', ')})`;
            }
            if (dateFirst) options.$where =  `${options.$where} and CAST(J.TS as date) >= '${format(dateFirst, 'DD.MM.YYYY')}'`;
            if (dateSecond) options.$where =  `${options.$where} and CAST(J.TS as date) <= '${format(dateSecond, 'DD.MM.YYYY')}'`;
            if (filter) {
                const fiters = String(filter).trim().split(' ');
                for (const f of fiters) {
                    options.$where = `${options.$where} and
                    upper(
                        O.ID || '_' || O.MANAGER || '_' || O.CLIENT || '_' ||
                        O.ORDERNUM || '_' || O.FASAD_MAT || '_' ||
                        O.FASAD_MODEL || '_' ||
                        O.TEXTURE || '_' || O.COLOR || '_' ||
                        O.PRIMECH || '_' || O.ORDER_TYPE || '_' ||
                        S.STATUS_DESCRIPTION || '_' || SECTOR.NAME
                        || '_' || C.CITY)
                    like '%${f.toUpperCase()}%'`;
                }
            }

            const query         = atOrderQuery.get('get_adopted', options);
            const queryCount    = atOrderQuery.get('get_adopted_pages_count', options);
            const orders        = await db.executeRequest(query);
            const [count]       = await db.executeRequest(queryCount);
            const pages         = count.COUNT ? Math.ceil(count.COUNT / (options.$first || 100)) : 0;

            return res.json({orders, count: count.COUNT , pages: pages});
        } catch (error) {
            res.status(500).json({errors:[(error as Error).message], message: 'Ошибка запроса: "Принятые заказы".'})
        }
    }
);

router.get(
    '/:id',
    async (req: Request, res: Response, next: NextFunction) => {
        const defaultError = 'Ошибка получения журнала.';
        try {
            const id: number | undefined =  req.params.id as any;
            const token = req.get('Authorization');
            if (!token) throw new Error();
            jwt.verify(token, settings.secretKey, async (err, decoded) => {
                if (err) return res.status(500)
                    .json({errors: [err.message], message: 'Токен не действителен.'});
                // Проверка прав на получение журнала
                if (!decoded) throw new Error('Некорректный токен.')
                const user = await users.getUserToID(decoded?.userId);
                if(!user) throw new Error('Некорректный токен');
                const journals: JournalName[] = await jfunction.permissionSet(user);
                const allowed = journals.find(j => j.id == id);
                if(!allowed) return res.status(500)
                        .json({errors: ['У тебя нет прав на получение данного журнала. Обратись а администатору.'], message: defaultError});
                // Проверка прав завершена
                let journal: JournalSectorDto[] = [];
                if (!id) return res.status(500).json({errors: ['Некорректный идентификатор журнала.'], message: defaultError})
                switch (parseInt(id as any)) {
                    case 1:
                        journal = await jfunction.getJournalToId(id);
                        break;
                    case 2:
                        journal = await jfunction.getJournalToId(id);
                        break;
                    case 3:
                        journal = await jfunction.getJournalToId(id);
                        break;
                    case 4:
                        journal = await jfunction.getJournalToId(id);
                        break;
                    default:
                        break;
                }

                if (journal.length) return res.status(500).json({errors: ['Такой журнал не существует.'], message: defaultError});
                return res.json({journal});
            });

        } catch (error) {
            const e = error as Error;
            return res.status(500).json({errors: [e.message], message: defaultError});
        }
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