const firebird = require('node-firebird')
const options = require('../../config/.firebirdDB/settingsDB');
const ordersQuery = require('../query/orders');
const listsData = require('../assets/lists')
const fs = require('fs');

const path = require('path');
const pool = firebird.pool(5, options);

const __dirn = path.resolve();

// Получение всех заказов, лимит по умолчанию - 100
const getAllOrders =  (req, res) => {
    try {
        let options = {...ordersQuery.getdefaultOptions('get_orders')};
        let page = req.query._page;
        let limit = req.query._limit;
        let find = req.query._find;
        //console.log(find);
        if(limit && limit > 0) options.$first = limit;
        if (page) options.$skip = (options.$first * page) - options.$first;
        if(req.query._sort) options.$sort = req.query._sort;
        if (options.$sort) options.$sort += req.query._order ? ' ' + req.query._order : '';
        console.log(options);
        let query = ordersQuery.get('get_orders', options);
        pool.get((err, db) => {
            if (err) return res.status(400).json({error: 'ok', message: 'Ошибка подключения к базе данных.'});
            db.query(query, (e, result) => {
                if (e) return res.status(500).json({error: 'ok', message: 'Ошибка выполнения запроса.'});
                db.detach();
                let orders = result;
                let query = ordersQuery.get('get_orders_count', options);
                db.query(query, (e, result) => {
                    let [ count ] = result;
                    let limit = options.$first;
                    let pages = limit > 0 ? Math.ceil(count.COUNT / limit) : 0;
                    return res.status(200).json({orders: orders, count: count.COUNT, pages});
                })
            })
        });
        pool.destroy();
    } catch (error) {console.log(error);}
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
            if (err) return res.status(400).json({error: 'ok', message: 'Ошибка подключения к базе данных.'});
            db.query(query, (e, result) => {
                if (e) return res.status(500).json({error: 'ok', message: 'Ошибка выполнения запроса.'});
                db.detach();
                if (!result.length) return res.status(400).json({error: 'ok', message: `Заказ № ${id} не найден.`});
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
        if (err) return res.status(400).json({error: 'ok', message: 'Ошибка подключения к базе данных.'});
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