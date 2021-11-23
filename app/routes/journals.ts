import { NextFunction, Request, Response } from "express";

import { Router } from 'express';
import db from '../dataBase';
import { format } from 'date-format-parse';
import atOrderQuery from '../query/atOrder';
import jfunction, { convertJournalDataDbToDto } from '../systems/virtualJournalsFun';
import _ from 'lodash';

import { JournalAdoptedDb, JournalAdoptedDto, JournalCommentDto, JournalDataDb, JournalDataDto, JournalName, JournalSectorDto } from "../types/journalTypes";
import { QueryOptions } from "../types/queryTypes";
import User from "../entities/User";
import { getUserToToken } from "../systems/users";
import ApiError from "../exceptions/ApiError";
import { createItmDb } from "../firebird/Firebird";

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
                    if (s.SECTOR?.toUpperCase() == 'Колеровка'.toUpperCase()) return false
                    if (s.SECTOR?.toUpperCase() == 'Шлифовка Станок'.toUpperCase()) return false
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
        const defaultError: string = 'Ошибка получения принятых заказов';
        const permissionName: string = 'Journals [adopted] get';
        try {
            const db = await createItmDb();
            const options: QueryOptions   = {...atOrderQuery.getdefaultOptions('get_adopted')} as QueryOptions;
            const limit: number                 = req.query._limit as any || 100;
            const page: number | undefined      = req.query._page as any;
            const sort: string | undefined      = req.query._sort as any;
            const find: number | undefined      = req.params.id as any;
            const d1: string | undefined        = req.query._d1 as any; 
            const d2: string | undefined        = req.query._d2 as any;

            const filter: string | undefined      = req.query._filter as any;
            const dateFirst: Date | undefined     = d1 ? convertToDate(d1, "dd/mm/yyyy") : undefined;
            const dateSecond: Date | undefined    = d2 ? convertToDate(d2, "dd/mm/yyyy") : undefined;
        
            if (limit)  options.$first = limit;
            if (page)   options.$skip = (page * limit) - limit;
            if (sort)   options.$sort = sort; 

            // Проверка токена, получение пользователя.
            const user: User = await getUserToToken(req.get('Authorization'));
            // Конец проверки токена.

            // Проверка прав
            const journals = await jfunction.permissionSet(user);
            const journal = journals.find(j => j.id == find);
            if(!journal) throw ApiError.Forbidden(['У тебя нет прав на получение данных этого журнала. Обратись а администатору.']);
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
            const queryData     = atOrderQuery.get('get_adopted_extra_data', options);

            const ordersDb      = await db.executeRequest<JournalAdoptedDb>(query);
            const [count]       = await db.executeRequest<{COUNT: number}>(queryCount);
            const dataDb        = await db.executeRequest<JournalDataDb>(queryData);

            const orders: JournalAdoptedDto[] = ordersDb.map(o => {
                const comments =  dataDb.filter(d => d.ID_ORDER === o.ID && d.DATA_GROUP.toUpperCase() === 'Comment'.toUpperCase()).map(d => convertJournalDataDbToDto(d));
                const extraData = dataDb.filter(d => d.ID_JOURNAL === o.JOURNAL_ID && d.DATA_GROUP.toUpperCase() !== 'Comment'.toUpperCase()).map(d => convertJournalDataDbToDto(d));
                const order: JournalAdoptedDto = {
                    id:             o.ID,
                    itmOrderNum:    o.ITM_ORDERNUM,
                    transfer:       o.TRANSFER,
                    accepted:       o.ACCEPTED,
                    statusOld:      o.STATUS_DESCRIPTION,
                    status:         o.STATUS_NAME,
                    fasadSquare:    o.ORDER_FASADSQ,
                    date:           o.TRANSFER_DATE,
                    data:           {comments, extraData}
                }
                return order;
            });
            const pages         = count.COUNT ? Math.ceil(count.COUNT / (options.$first || 100)) : 0;
            db.detach();
            return res.json({orders, count: count.COUNT , pages: pages});
        } catch (e) {next(e);}
    }
);

router.get(
    '/:id',
    async (req: Request, res: Response, next: NextFunction) => {
        const defaultError = 'Ошибка получения журнала.';
        try {
            const id: number | undefined =  req.params.id as any;
            // Проверка токена, получение пользователя.
            const user: User = await getUserToToken(req.get('Authorization'));
            // Конец проверки токена.
            const journals: JournalName[] = await jfunction.permissionSet(user);
            const allowed = journals.find(j => j.id == id);
            if(!allowed) throw ApiError.Forbidden(['У тебя нет прав на получение данного журнала. Обратись а администатору.']);
            // Проверка прав завершена
            let journal: JournalSectorDto[] = [];
            if (!id) throw ApiError.BadRequest(defaultError, ['Некорректный идентификатор журнала.']);

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
                case 6:
                    // Все сектора.
                    const allSectors = await jfunction.getSectors();
                    const allSectorsId = allSectors.map(s => s.id);
                    journal = await jfunction.getJournalToId(id, allSectorsId);
                    break;
                default:
                    break;
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