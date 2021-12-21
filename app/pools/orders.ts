import ordersQuery from '../query/orders';
import fs from 'fs';
import db from '../dataBase';
import path from 'path';
const __dirn             = path.resolve();
import _ from 'lodash';
import jfunction from '../systems/virtualJournalsFun';
import { NextFunction, Request, Response } from 'express';
import { EmployersDb } from "../types/user";
import { QueryOptions } from '../types/queryTypes';
import { IOrderHeaderDb, OrderBody, OrderHeader } from '../types/orderTypes';
import User from '../entities/User';
import { getUserToToken } from '../systems/users';
import { createItmDb } from '../firebird/Firebird';
import ApiError from '../exceptions/ApiError';


// Получение всех заказов, лимит по умолчанию - 100

const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Проверка токена, получение пользователя.
        const user: User = await getUserToToken(req.get('Authorization'));
        // Конец проверки токена.
        const isGetOrdersAllAllowed = await user.permissionCompare('Orders [orders] get orders all')
        if (!isGetOrdersAllAllowed) throw ApiError.Forbidden(['Не хватает прав, на получение данных журнала заказов.'])

        let options: QueryOptions     = {...ordersQuery.getdefaultOptions('get_orders')};
        const page      = req.query._page as number | undefined;
        const limit     = req.query._limit as number | undefined;
        const filter    = req.query._filter as string | undefined;
        const sort      = req.query._sort as string | undefined;

        if (limit && !isNaN(limit))     options.$first  = limit;
        if (page && !isNaN(page))       options.$skip   = (page * options.$first ) - options.$first;
        if (sort)                       options.$sort   = sort; 
        if (filter)                     options.$where  = await finderEngine (filter);
        
        const result = await db.executeRequest(ordersQuery.get('get_orders', options) as string);

        // Права пользователей.


        const isViewCity            = await user.permissionCompare('Orders [orders] get field City');
        const isViewCost            = await user.permissionCompare('Orders [orders] get field Cost');
        const isViewTotalCost       = await user.permissionCompare('Orders [orders] get field Cost');
        const isViewPay             = await user.permissionCompare('Orders [orders] get field Pay');
        const isViewDebt            = await user.permissionCompare('Orders [orders] get field Debt');

        const isViewDateFirstStage  = await user.permissionCompare('Orders [orders] get field DateFirstStage');
        const isViewDateSave        = await user.permissionCompare('Orders [orders] get field DateSave');
        const isViewDatePlanPack    = await user.permissionCompare('Orders [orders] get field DatePlanPack');

        const orders: OrderHeader[] = result.map(o => {
            let order: OrderHeader = 
            {
                id:                     o.ID,
                itmOrderNum:            o.ITM_ORDERNUM,
                orderType:              o.ORDER_TYPE,
                manager:                o.MANAGER,
                fasadMaterial:          o.FASAD_MAT,
                fasadModel:             o.FASAD_MODEL,
                profileWidth:           o.FASAD_PG_WIDTH,
                texture:                o.TEXTURE,
                filenkaMaterial:        o.FIL_MAT,
                filenkaModel:           o.FIL_MODEL,
                filenkaColor:           o.FIL_COLOR,
                color:                  o.COLOR,
                colorType:              o.COLOR_TYPE,
                square:                 o.ORDER_GENERALSQ,
                dateFactOrderOut:       o.FACT_DATE_ORDER_OUT,
                status:                 o.STATUS_DESCRIPTION 
            }
            // Отображение согласно прав.
            if (isViewCity)             order.city              = o.CITY;
            if (isViewCost)             order.cost              = o.ORDER_COST;
            if (isViewTotalCost)        order.totalCost         = o.ORDER_TOTAL_COST;
            if (isViewPay)              order.pay               = o.ORDER_PAY;
            if (isViewDebt)             order.debt              = o.ORDER_DEBT;

            if (isViewDateFirstStage)   order.dateFirstStage    = o.PLAN_DATE_FIRSTSTAGE;
            if (isViewDateSave)         order.dateSave          = o.FACT_DATE_FIRSTSAVE;
            if (isViewDatePlanPack)     order.datePlanPack      = o.PLAN_DATE_PACK;
    
            return order;
        });

        const [count] = await db.executeRequest(ordersQuery.get('get_orders_count', options) as string);
        const pages = parseInt(options.$first) > 0 ? Math.ceil(parseInt(count.COUNT) / parseInt(options.$first)) : 0;
        return res.status(200).json({count: parseInt(count.COUNT), pages, orders});
    } catch (e) {next(e);}
}
// Конструктор условий по запросу "ORDERS"
const finderEngine = async (txt: string) => {
    try {
        // Определяем запрос на статусы
        // Меняем запятую на пробел, удаляем лишние пробелы.
        let queryTxt: string = '';
        let queryStatuses: number[] = [];
        let queryKeyword: number[] = []
        let findStr: string = txt.replace(/,/g," ").replace(/ +/g, ' ').trim().toUpperCase(); 

        const statuses = await jfunction.getStatuses();
        const keywords: {txt: string, type: string, id: number}[] = [
            {txt: 'Долг',               type: 'Долг', id: 1},
            {txt: 'С долгом',           type: 'Долг', id: 1},
            {txt: 'Долги',              type: 'Долг', id: 1},
            {txt: 'Задолженность',      type: 'Долг', id: 1},
            {txt: 'Задолженость',       type: 'Долг', id: 1},
            {txt: 'Должен',             type: 'Долг', id: 1},
            {txt: 'Просрочен',          type: 'Просроченные', id: 2},
            {txt: 'Просрачен',          type: 'Просроченные', id: 2},
            {txt: 'Просроченный',       type: 'Просроченные', id: 2},
            {txt: 'Просроченый',        type: 'Просроченные', id: 2},
            {txt: 'Упакован',           type: 'Упакован', id: 3},
            {txt: 'Упакованные',        type: 'Упакован', id: 3},
            {txt: 'Запакованные',       type: 'Упакован', id: 3},
            {txt: 'Упакованые',         type: 'Упакован', id: 3},
            {txt: 'Запакованые',        type: 'Упакован', id: 3},
            {txt: 'Готов',              type: 'Упакован', id: 3},
            {txt: 'Готовые',            type: 'Упакован', id: 3},
            {txt: 'Готовы',             type: 'Упакован', id: 3},
            {txt: 'Упаковали',          type: 'Упакован', id: 3},
            {txt: 'Отправлен',          type: 'Отправлен', id: 4},
            {txt: 'Отправили',          type: 'Отправлен', id: 4},
            {txt: 'Ушол',               type: 'Отправлен', id: 4},
            {txt: 'Ушел',               type: 'Отправлен', id: 4},
            {txt: 'Отгружен',           type: 'Отправлен', id: 4},
            {txt: 'Отгрузили',          type: 'Отправлен', id: 4},
            {txt: 'Загрузили',          type: 'Отправлен', id: 4}
        ];

        // Поиск статусов в строке поиска.
        for (const status of statuses) {
            if (findStr.includes(status.STATUS_DESCRIPTION.toUpperCase())) {
                queryStatuses.push(status.ID);
                const regX = new RegExp(`${status.STATUS_DESCRIPTION.toUpperCase()}`, 'g');
                findStr = findStr.replace(regX," ").replace(/ +/g, ' ');
            }
        }
        for (const keyword of keywords) {
            if (findStr.includes(keyword.txt.toUpperCase())) {
                queryKeyword.push(keyword.id);
                const regX = new RegExp(`${keyword.txt.toUpperCase()}`, 'g');
                findStr = findStr.replace(regX, '').replace(/ +/g, ' ');
            }
        }
        
        queryStatuses   = _.uniqWith(queryStatuses, _.isEqual);
        queryKeyword    = _.uniqWith(queryKeyword, _.isEqual);
        let queryArr: string[]    = findStr.trim().split(' ');
        queryArr        = queryArr.filter(c => c != '');
        let tempArr: string[] = [];
        if (queryStatuses.length) {
            queryStatuses.forEach(s => {tempArr.push(`LIST_STATUSES.ID = ${s}`);});
            queryTxt += `(${tempArr.join(' OR\n')})`;
            tempArr = [];
        }
        if (queryKeyword.length) {
            if (queryStatuses.length) queryTxt += ' AND\n';
            for (const keywordId of queryKeyword) {
            switch (keywordId) {
                    case 1:
                        tempArr.push(`((O.ORDER_TOTAL_COST - coalesce(O.ORDER_PAY, 0)) * -1) < 0`);
                        break;
                    case 2:
                        tempArr.push(`
                            EXISTS (
                            SELECT P.ID
                            FROM ORDERS_DATE_PLAN P
                            WHERE
                            P.ORDER_ID = O.ID AND
                            (LIST_STATUSES.STATUS_NUM >= 5 AND LIST_STATUSES.STATUS_NUM < 7) AND
                            P.DATE3 < CURRENT_DATE AND
                            UPPER(P.DATE_DESCRIPTION) = UPPER('УПАКОВКА'))`
                        );
                        break;
                    case 3:
                        tempArr.push(`LIST_STATUSES.ID = 7 OR LIST_STATUSES.ID = 8`);
                        break;
                    case 4:
                        tempArr.push(`LIST_STATUSES.ID = 9 OR LIST_STATUSES.ID = 10`);
                        break;
                    default:
                    break;
            }
            }
            queryTxt += `(${tempArr.join(' AND\n')})`;
            tempArr = [];
        }
        const numbers   = queryArr.filter(n => !isNaN(n as any));
        queryArr        = queryArr.filter(n => isNaN(n as any));
        if (numbers.length) {
            if(queryTxt != '') queryTxt += ' AND\n';
            numbers.forEach(n => {
                tempArr.push(`(O.ID = ${n} OR O.ORDERNUM LIKE '%${n}%')`);
            })
            queryTxt += `(${tempArr.join(' OR\n')})`;
            tempArr = [];
        }
        if (queryArr.length) {
            if(queryTxt != '') queryTxt += ' AND\n';
            queryArr.forEach(c => {
                tempArr.push(
                    `upper(
                        O.ID || '_' ||
                        COALESCE(O.MANAGER, '') || '_' ||
                        COALESCE(O.CLIENT, '') || '_' ||
                        COALESCE(O.ORDERNUM, '') || '_' ||
                        COALESCE(O.FASAD_MAT, '') || '_' ||
                        COALESCE(O.FASAD_MODEL, '') || '_' ||
                        COALESCE(O.TEXTURE, '') || '_' ||
                        COALESCE(O.COLOR, '') || '_' ||
                        COALESCE(O.PRIMECH, '') || '_' ||
                        COALESCE(O.ORDER_TYPE, '') || '_' ||
                        COALESCE(O.VIEW_MOD, '') || '_' ||
                        COALESCE(LIST_STATUSES.STATUS_DESCRIPTION, '') || '_' ||
                        COALESCE(C.CITY, ''))
                        like '%${c}%'`
                )
            });
            queryTxt += `(${tempArr.join(' AND\n')})`;
            tempArr = [];
        }
        return queryTxt;
    } catch (error) {return ''}
}

// Тестовая отправка картинки
const getImageTest = (req: Request, res: Response, next: NextFunction) => {
    try {
        const files = fs.readdirSync(__dirn + '/app/assets/images/');
        const item = files[Math.floor(Math.random()*files.length)];
        res.sendFile(__dirn + '/app/assets/images/' + item);
    } catch (e) {next(e);} 
}

// Отправка картинки образца
const getSampleForOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        //Получаем фото образца из папки в заказах
        const ipImageServer: string = '192.168.2.101';
        const dirSample: string = 'Образец';
        let id: number | undefined =  req.params.id as any;
        let options: QueryOptions = {...ordersQuery.getdefaultOptions('get_order_firstsave_date')};

        if (id && !isNaN(id as any) && id > 0) options.$where = 'ID = ' + id;
        else return res.sendFile(getdefaultSample());
        let query: string = ordersQuery.get('get_order_firstsave_date', options);
        const [itemRes] = await db.executeRequest(query);
        if (!itemRes) return res.sendFile(getdefaultSample());
        let dateTxt: string = itemRes.FACT_DATE_FIRSTSAVE.substr(0, 10);
        let parts: any[] = dateTxt.replace(/\./g, '-').replace(/\,/g, '-').replace(/\//g, '-').split('-');
        if (!parts[2]) parts.push(new Date().getFullYear());
        const date = new Date((parts[2].length == 2 ? new Date().getFullYear().toString().substr(0, 2) + 
                                                                    parts[2]: parts[2]), parts[1] - 1, parts[0]);
        let month = date.toLocaleString('default', { month: 'long' });
        month =  month[0].toUpperCase() + month.slice(1);
        try {
            let sampleName: any;
            const pathSample = `//${ipImageServer}/заказы/${date.getFullYear()}/${month}/${id}/${dirSample}/`;
            const files = fs.readdirSync(pathSample);
            [sampleName]= files;
            if (!sampleName) return res.sendFile(getdefaultSample());
            return res.sendFile(pathSample + sampleName);
        } catch (error) {return res.sendFile(getdefaultSample());}
    } catch (e) {next(e);}
}

const orderExists = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let id =  req.params.id
        const result = await db.executeRequest(`
            SELECT O.ID, O.ITM_ORDERNUM, S.STATUS_DESCRIPTION, O.ORDER_GENERALSQ, O.ORDER_FASADSQ
            FROM ORDERS O
            LEFT JOIN LIST_STATUSES S ON (O.ORDER_STATUS = S.STATUS_NUM)
            WHERE O.ID = ${id}  
        `);
        if (!result.length) return res.status(500).json({errors: ['Заказ не найден в базе данных.'], message: 'Заказ не найден.'});
        const [order]: OrderHeader[] = result.map(o => {
            return {
                id: o.ID,
                itmOrderNum: o.ITM_ORDERNUM,
                status: o.STATUS_DESCRIPTION,
                square: o.ORDER_GENERALSQ,
                squareFasad: o.ORDER_FASADSQ
            }
        });
        return res.status(200).json({order});  
    } catch (e) {next(e);}
}

const getOneOrder = async  (req: Request, res: Response, next: NextFunction) => {
    try {
        // Проверка токена, получение пользователя.
        const user: User = await getUserToToken(req.get('Authorization'));
        // Конец проверки токена.

        let id: number =  req.params.id as any
        if (!id) throw ApiError.BadRequest("Не корректный id заказа")
        let options: QueryOptions = {};
        options.$where = `O.ID = ${id}`;
        let query = ordersQuery.get('get_order_header', options);
        const resHeader = await db.executeRequest(query);
        options.$where = `ORDER_ID = ${id}`;
        query = ordersQuery.get('get_order_body', options)
        const resBody = await db.executeRequest(query); 
        options.$where = `ORDER_ID = ${id}`;
        query = ordersQuery.get('get_order_plans', options);
        const resPlans = await db.executeRequest(query);
        if (!resHeader.length) throw ApiError.BadRequest('Заказ не найден.')

         // Права пользователей.
        const isViewCity: boolean            = await user.permissionCompare('Orders [orders] get field City');
        const isViewCost: boolean            = await user.permissionCompare('Orders [orders] get field Cost');
        const isViewPay: boolean             = await user.permissionCompare('Orders [orders] get field Pay');
        const isViewDebt: boolean            = await user.permissionCompare('Orders [orders] get field Debt');

        const isViewDateFirstStage: boolean  = await user.permissionCompare('Orders [orders] get field DateFirstStage');
        const isViewDateSave: boolean        = await user.permissionCompare('Orders [orders] get field DateSave');
        const isViewDatePlanPack: boolean    = await user.permissionCompare('Orders [orders] get field DatePlanPack');


        const header            = resHeader.map(h => {
            let header: OrderHeader =  {
                id: h.ID, manager: h.MANAGER, client: h.CLIENT, 
                itmOrderNum: h.ITM_ORDERNUM, viewMode: h.VIEW_MOD,
                isPrepaid: h.IS_PREPAID,
                profileWidth: h.FASAD_PG_WIDTH,  assemblyAngle: h.ASSEMBLY_ANGLE,
                prisad: h.PRISAD, termoshov: h.TERMOSHOV,
                fasadMaterial: h.FASAD_MAT, fasadModel: h.FASAD_MODEL, texture: h.TEXTURE, textureComment: h.TEXTURE_COMMENT, 
                filenkaMaterial: h.FIL_MAT, filenkaModel: h.FIL_MODEL,  filenkaColor: h.FIL_COLOR,
                color: h.COLOR, colorType: h.COLOR_TYPE, colorLak: h.COLOR_LAK, colorLakComment: h.COLOR_LAK_COMMENT, 
                colorPatina: h.COLOR_PATINA, colorPatinaComment: h.COLOR_PATINA_COMMENT,
                square: h.ORDER_GENERALSQ, squareFasad: h.ORDER_FASADSQ, comment: h.PRIMECH,
                discount: h.ORDER_DISCOUNT, discountComment: h.ORDER_DISCOUNT_COMMENT,
                costPack: h.ORDER_COST_PACK,
                dateLastSave: h.FACT_DATE_LASTSAVE,
                dateCalcCost: h.FACT_DATE_CALCCOST, dateFactPack: h.FACT_DATE_PACK,
                dateFactOrderOut: h.FACT_DATE_ORDER_OUT, 
                statusNum: h.ORDER_STATUS, status: h.STATUS_DESCRIPTION
            }
            
            // Отображение согласно прав.
            if (isViewCity)             header.city             = h.CITY;
            if (isViewCost) {           header.costPriceColumn  = h.ORDER_COST_PRICECOLUMN; 
                                        header.cost             = h.ORDER_COST;
                                        header.totalCost        = h.ORDER_TOTAL_COST;
                                        header.costUp           = h.ORDER_COSTUP;
                                        header.costUpComment    = h.ORDER_COSTUP_COMMENT;
            }
            if (isViewPay)              header.pay              = h.ORDER_PAY;
            if (isViewDebt)             header.debt             = h.ORDER_DEBT;
            if (isViewDateFirstStage)   header.dateFirstStage   = h.PLAN_DATE_FIRSTSTAGE;
            if (isViewDateSave)         header.dateSave         = h.FACT_DATE_FIRSTSAVE;
            if (isViewDatePlanPack)     header.datePlanPack     = h.PLAN_DATE_PACK;
            return header;

        });
        const body              = resBody.map(b => {
            let body: OrderBody = {
                id:             b.ID, 
                orderId:        b.ORDER_ID,
                name:           b.NAME,
                height:         b.HEIGHT,
                width:          b.WIDTH,
                amount:         b.EL_COUNT,
                square:         b.SQUARE,
                comment:        b.COMMENT,
                unit:           b.MEASURE_UNIT?.replace('м2', 'м²')
            }
            // Отображение согласно прав.
            if (isViewCost) {           body.priceCost      = b.PRICE_COST;
                                        body.cost           = b.COST; 
                                        body.calcAs         = b.CALC_AS;
                                        body.costSng        = b.COST_SNG;
                                        body.priceMod       = b.MOD_PRICE;
                                        body.calcComment    = b.CALC_COMMENT;
            }
            return body;
        });
        const plans     = resPlans.map(p => {
            return {
                id:         p.ID,
                orderId:    p.ORDER_ID,
                sector:     p.SECTOR || p.DATE_DESCRIPTION,
                dateSector: p.DATE_SECTOR,
                comment:    p.COMMENT,
                date:       p.DATE3
            }
        });
        const order = {header, body, plans};
        return res.status(200).json({order});   
    } catch (e) {next(e);}
}

const getDataHeaderForCreateOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const db = await createItmDb();
        const result = await db.executeRequest<EmployersDb>(ordersQuery.get('get_employers'));
        const employers = result.map(e=>e.NAME);
        db.detach();
        const lists = {employers}
        res.status(200).json({lists});
    } catch (e) {next(e);}
    
}

const getTest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.status(200).json({okay: true});
    } catch (e) {next(e);}
}

const getdefaultSample = (): string => {
    try {
        const files = fs.readdirSync(__dirn + '/app/assets/images/default/');
        const item = files[Math.floor(Math.random()*files.length)];
        return __dirn + '/app/assets/images/default/' + item;
    } catch (error) {throw error}
}



export default {
    getAllOrders,
    getOneOrder,
    getImageTest,
    getSampleForOrder,
    orderExists,
    getDataHeaderForCreateOrder,
    getTest
}