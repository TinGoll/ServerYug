const firebird = require('node-firebird')
const options = require('../../config/.firebirdDB/settingsDB');
const ordersQuery = require('../query/orders');
const path = require('path');
const pool = firebird.pool(5, options);

const __dirn = path.resolve();

const getAllOrders =  (req, res) => {
    try {
        let options = {...ordersQuery.getdefaultOptions('get_orders')};

        let page = req.query._page;
        let limit = req.query._limit;

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
                    let [ count ] = result
                    let limit = options.$first;
                    let pages = limit > 0 ? parseInt(count.COUNT / limit) : 0;
                    return res.status(200).json({orders: orders, count: count.COUNT, pages});
                })
            })
        })
        pool.destroy();
    } catch (error) {
        console.log(error);
    }
}

const getImageTest = (req, res) => {
    res.sendFile(__dirn + '/app/assets/images/testImage.jpg');
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
module.exports = {
    getAllOrders,
    getOneOrder,
    getImageTest
}