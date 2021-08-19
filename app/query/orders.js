const processing = require('./processing');

const data = [
        {
            name: 'get_orders',
            query: (opt) => {
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;
                q = `select ${$first} ${$skip} distinct 
                            O.ID, O.ITM_ORDERNUM, O.ORDERNUM, O.ORDER_TYPE, O.MANAGER, C.CLIENTNAME, C.CITY,
                            C.PRICE_COLUMN, O.FASAD_MAT, O.FASAD_MODEL, O.COLOR, O.ORDER_TOTAL_COST,
                            O.ORDER_COST, O.ORDER_PAY,
                            (O.ORDER_TOTAL_COST - coalesce(O.ORDER_PAY, 0)) * -1 as ORDER_DEBT, ORDER_GENERALSQ,
                            O.FACT_DATE_FIRSTSAVE, O.PLAN_DATE_FIRSTSTAGE, O.PLAN_DATE_PACK,
                            O.FACT_DATE_ORDER_OUT, LIST_STATUSES.STATUS_DESCRIPTION, LIST_STATUSES.STATUS_NUM,
                            O.FACT_DATE_FIRSTSAVE, C.IS_PREPAID, O.COLOR_TYPE, O.COLOR_PATINA, O.PRIMECH
                                from ORDERS O
                                left join CLIENTS C on (O.CLIENT = C.CLIENTNAME)
                                left join LIST_STATUSES on (LIST_STATUSES.STATUS_NUM = O.ORDER_STATUS)
                                ${$where}
                                ${$sort}`;
                return q;
            } ,
            defaultOptions: {
                $first: '100',
                $sort: 'O.ID desc'
            }
        },
        {
            name: 'get_orders_count',
            query: (opt) => {
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;
                q = `select count(o.id) from orders o ${$where}`;
                return q;
            } ,
            defaultOptions: {$first: '100'}
        },
        {
            name: 'get_order_header',
            query: (opt) => {
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;
                q = `select first 1 O.ID, O.ITM_ORDERNUM, O.ORDERNUM, O.ORDER_TYPE, O.MANAGER, C.CLIENTNAME, C.CITY, C.PRICE_COLUMN,
                O.FASAD_MAT, O.FASAD_MODEL, O.COLOR, O.ORDER_TOTAL_COST, O.ORDER_COST, O.ORDER_PAY,
                (O.ORDER_TOTAL_COST - coalesce(O.ORDER_PAY, 0)) * -1 as ORDER_DEBT, ORDER_GENERALSQ,
                O.FACT_DATE_FIRSTSAVE, O.PLAN_DATE_FIRSTSTAGE, O.PLAN_DATE_PACK, O.FACT_DATE_ORDER_OUT,
                LIST_STATUSES.STATUS_DESCRIPTION, LIST_STATUSES.STATUS_NUM, O.FACT_DATE_FIRSTSAVE, C.IS_PREPAID,
                O.COLOR_TYPE, O.COLOR_PATINA, O.PRIMECH
                    from ORDERS O
                    left join CLIENTS C on (O.CLIENT = C.CLIENTNAME)
                    left join LIST_STATUSES on (LIST_STATUSES.STATUS_NUM = O.ORDER_STATUS)
                    ${$where}`;
                return q;

            },
            defaultOptions: {}
        },
        {
            name: 'get_order_body',
            query: (opt) => {
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;
                q =`select * from ORDERS_ELEMENTS ${$where} ${$sort}`;
                return q;
            },
            defaultOptions: {}
        },
        {
            name: 'get_order_plans',
            query: (opt) => {
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;
                const $tempSort = $sort || 'order by date3, id';
                q =`select * from orders_date_plan ${$where} ${$tempSort}`;
                return q;
            },
            defaultOptions: {}
        }
    ];

    const get = (name ='', opt = {}) => {
        let q = data.find(item => item.name.toUpperCase() == name.toUpperCase());
        if (!q) return null;
        let options = {...q.defaultOptions, ...opt};
        return q.query(processing(options)).replace(/ +/g, ' ').trim();
    }
    const getOptions = () => {
        return {
            $first: undefined,
            $skip: undefined,
            $where: undefined,
            $sort: undefined
        }
    }
    const getdefaultOptions = (name ='') => {
        let q = data.find(item => item.name.toUpperCase() == name.toUpperCase());
        return q ? q.defaultOptions : null;
    }
module.exports = {get, getOptions, getdefaultOptions};