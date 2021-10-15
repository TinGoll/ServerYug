const firebird           = require('node-firebird')
const options            = require('../../config/.firebirdDB/settingsDB');
const ordersQuery        = require('../query/orders');
const listsData          = require('../assets/lists')
const fs                 = require('fs');
const db                 = require('../dataBase');

const path               = require('path');
const pool               = firebird.pool(5, options);

const __dirn             = path.resolve();
const _                  = require('lodash');

const jfunction          = require('../systems/virtualJournalsFun');
const { query }          = require('express-validator');

const settings           = require('../settings');

// Получение всех заказов, лимит по умолчанию - 100
const getAllOrders = async (req, res) => {
    try {
        // Получение пользователя.
        let decoded;
        const token = req.get('Authorization');
        try {decoded = jwt.verify(token, settings.secretKey);} 
        catch (error) {return res.status(500).json({errors: [error.message], message: 'Некорректный токен'})}
        const user = await users.getUserToID(decoded.userId);

        if (!user.permissionCompare('Orders [orders] get orders all')) 
            return res.status(500).json({errors: ['Не хватает прав, на получение данных журнала заказов.'], message: 'Нет прав.'})

        let options     = {...ordersQuery.getdefaultOptions('get_orders')};
        const page      = req.query._page;
        const limit     = req.query._limit;
        const filter    = req.query._filter;
        const sort      = req.query._sort;

        if (limit && !isNaN(limit))     options.$first  = limit;
        if (page && !isNaN(page))       options.$skip   = (page * options.$first ) - options.$first;
        if (sort)                       options.$sort   = sort; 
        if (filter)                     options.$where  = await finderEngine (filter);

        const result = await db.executeRequest(ordersQuery.get('get_orders', options));

        // Права пользователей.
        const isViewCity            = user.permissionCompare('Orders [orders] get field City');
        const isViewCost            = user.permissionCompare('Orders [orders] get field Cost');
        const isViewTotalCost       = user.permissionCompare('Orders [orders] get field Cost');
        const isViewPay             = user.permissionCompare('Orders [orders] get field Pay');
        const isViewDebt            = user.permissionCompare('Orders [orders] get field Debt');

        const isViewDateFirstStage  = user.permissionCompare('Orders [orders] get field DateFirstStage');
        const isViewDateSave        = user.permissionCompare('Orders [orders] get field DateSave');
        const isViewDatePlanPack    = user.permissionCompare('Orders [orders] get field DatePlanPack');

        const orders = result.map(o => {
            let order = 
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
                dataFactOrderOut:       o.FACT_DATE_ORDER_OUT,
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

        const [count] = await db.executeRequest(ordersQuery.get('get_orders_count', options));
        const pages = parseInt(options.$first) > 0 ? Math.ceil(parseInt(count.COUNT) / parseInt(options.$first)) : 0;
        return res.status(200).json({count: parseInt(count.COUNT), pages, orders});

    } catch (error) {
        console.log(error);
        return res.status(500).json({errors:[error.message], message: 'Ошибка запроса...'})
    }
}
// Конструктор условий по запросу "ORDERS"
const finderEngine = async txt => {
    try {
        // Определяем запрос на статусы
        // Меняем запятую на пробел, удаляем лишние пробелы.
        let queryTxt = '';
        let queryStatuses = [];
        let queryKeyword = []
        let findStr = txt.replaceAll(',', ' ').replace(/ +/g, ' ').trim().toUpperCase(); 
        const statuses = await jfunction.getStatuses();
        const keywords = [
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
                findStr = findStr.replaceAll(status.STATUS_DESCRIPTION.toUpperCase(), '').replace(/ +/g, ' ');
            }
        }
        for (const keyword of keywords) {
            if (findStr.includes(keyword.txt.toUpperCase())) {
                queryKeyword.push(keyword.id);
                findStr = findStr.replaceAll(keyword.txt.toUpperCase(), '').replace(/ +/g, ' ');
            }
        }
        queryStatuses   = _.uniqWith(queryStatuses, _.isEqual);
        queryKeyword    = _.uniqWith(queryKeyword, _.isEqual);
        let queryArr    = findStr.trim().split(' ');
        queryArr = queryArr.filter(c => c != '');
        let tempArr     = [];
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
                            (LIST_STATUSES.STATUS_NUM > 5 AND LIST_STATUSES.STATUS_NUM < 7) AND
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
        const numbers   = queryArr.filter(n => !isNaN(n));
        queryArr        = queryArr.filter(n => isNaN(n));
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
                        COALESCE( O.PRIMECH, '') || '_' ||
                        COALESCE(O.ORDER_TYPE, '') || '_' ||
                        COALESCE(O.VIEW_MOD, '') || '_' ||
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
const getImageTest = (req, res) => {
    const files = fs.readdirSync(__dirn + '/app/assets/images/');
    const item = files[Math.floor(Math.random()*files.length)];
    res.sendFile(__dirn + '/app/assets/images/' + item);
}

// Отправка картинки образца
const getSampleForOrder = (req, res) => {
    //Получаем фото образца из папки в заказах
    const ipImageServer = '192.168.2.101';
    const dirSample = 'Образец';
    let id =  req.params.id;
    let options = {...ordersQuery.getdefaultOptions('get_order_firstsave_date')};
    if (id > 0) options.$where = 'ID = ' + id;
    else return res.sendFile(getdefaultSample());
    let query = ordersQuery.get('get_order_firstsave_date', options);
        pool.get((err, db) => {
            if (err) return res.sendFile(getdefaultSample());
            db.query(query, (e, result) => {
                if (e) return res.sendFile(getdefaultSample());
                db.detach();
                const [itemRes] = result;
                if (!itemRes) return res.sendFile(getdefaultSample());
                dateTxt = itemRes.FACT_DATE_FIRSTSAVE.substr(0, 10);
                let parts = dateTxt.replace(/\./g, '-').replace(/\,/g, '-').replace(/\//g, '-').split('-');
                if (!parts[2]) parts.push(new Date().getFullYear());
                const date = new Date((parts[2].length == 2 ? new Date().getFullYear().toString().substr(0, 2) + 
                                                                                parts[2]: parts[2]), parts[1] - 1, parts[0]);
                let month = date.toLocaleString('default', { month: 'long' });
                month =  month[0].toUpperCase() + month.slice(1)
                try {
                    const pathSample = `//${ipImageServer}/заказы/${date.getFullYear()}/${month}/${id}/${dirSample}/`;
                    const files = fs.readdirSync(pathSample);
                    [sampleName]= files;
                    if (!sampleName) return res.sendFile(getdefaultSample());
                    return res.sendFile(pathSample + sampleName);
                } catch (error) {return res.sendFile(getdefaultSample());}
            });
        });
        pool.destroy();
}

const getOneOrder =  (req, res) => {
    try {
        let id =  req.params.id
        let options = {};
        options.$where = `O.ID = ${id}`;
        let query = ordersQuery.get('get_order_header', options);
        let order = {};
        pool.get((err, db) => {
            if (err) return res.status(400).json({errors: ['ok'], message: 'Ошибка подключения к базе данных.'});
            db.query(query, (e, result) => {
                if (e) return res.status(500).json({errors: ['ok'], message: 'Ошибка выполнения запроса.'});
                db.detach();
                if (!result.length) return res.status(400).json({errors: ['ok'], message: `Заказ № ${id} не найден.`});
                order.header = result;
                options = {};
                options.$where = `ORDER_ID = ${id}`;
                let query = ordersQuery.get('get_order_body', options);
                db.query(query, (e, result) => {
                    db.detach();
                    result.forEach((element, index, arr) => {
                        if (element.MEASURE_UNIT) element.MEASURE_UNIT = element.MEASURE_UNIT.replace('м2', 'м²')
                    });
                    order.body = result;
                    options = {};
                    options.$where = `ORDER_ID = ${id}`;
                    let query = ordersQuery.get('get_order_plans', options);
                    db.query(query, (e, result) => {
                        db.detach();
                        order.plans = result;
                        return res.status(200).json({order});
                    });
                });
            })
        })
        pool.destroy();
    } catch (error) {
        console.log(error);
    }
}

const getDataHeaderForCreateOrder = (req, res) => {
    let lists = {};
    pool.get((err, db) => {
        if (err) return res.status(400).json({errors: ['ok'], message: 'Ошибка подключения к базе данных.'});
        db.query(ordersQuery.get('get_order_clients'), (err, result) => {
            if (!err) lists.clients = result.map(item => item.CLIENTNAME.trim());
            db.query(ordersQuery.get('get_order_nomenclature'), (err, result) => {
                if (!err) lists.nomenclature = result.map(item => item.NOMENCLATURE.trim());
                db.query(ordersQuery.get('get_employers'), (err, result) => {
                    if (!err) lists.employers = result.map(item => item.NAME);
                    db.detach();
                    lists = {... lists, ...listsData.orderdata};
                    //console.log(req.get('Authorization'));
                    return res.status(200).json({lists});
                })
            });
        });
    });
    pool.destroy();
}

const getdefaultSample = () => {
    try {
        const files = fs.readdirSync(__dirn + '/app/assets/images/default/');
        const item = files[Math.floor(Math.random()*files.length)];
        return __dirn + '/app/assets/images/default/' + item;
    } catch (error) {return null;}
}

module.exports = {
    getAllOrders,
    getOneOrder,
    getImageTest,
    getSampleForOrder,
    getDataHeaderForCreateOrder
}