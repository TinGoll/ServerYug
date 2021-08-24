const processing = require('./processing');

const data = [
        {
            name: 'get_orders',
            query: (opt) => {
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;
                q = `select ${$first} ${$skip} distinct 
                                O.ID, O.MANAGER, O.CLIENT, O.ORDERNUM, O.ITM_ORDERNUM, O.FASAD_MAT, O.FASAD_MODEL, O.FASAD_PG_WIDTH,
                                O.TEXTURE, O.FIL_MAT, O.FIL_MODEL, O.COLOR, O.FIL_COLOR, O.COLOR_TYPE, O.COLOR_LAK, O.COLOR_PATINA, 
                                O.ORDER_GENERALSQ, O.ORDER_FASADSQ, O.GLASS, O.PRIMECH, O.ORDER_COST_PRICECOLUMN, O.ORDER_COST,
                                O.ORDER_PAY, (O.ORDER_TOTAL_COST - coalesce(O.ORDER_PAY, 0)) * -1 as ORDER_DEBT,
                                O.ORDER_TOTAL_COST, O.ORDER_DISCOUNT, O.ORDER_DISCOUNT_COMMENT, O.ORDER_COSTUP, O.ORDER_COSTUP_COMMENT,
                                O.ORDER_COST_PACK, O.ORDER_COST_GLASS, O.FACT_DATE_RECEIVE, O.FACT_DATE_FIRSTSAVE, O.FACT_DATE_LASTSAVE,
                                O.FACT_DATE_CALCCOST, O.FACT_DATE_EXPORT_ITM, O.FIRSTSTAGEBAD, O.FACT_DATE_PACK, O.FACT_DATE_ORDER_OUT,
                                O.ORDER_STATUS, O.FACT_DATE_ORDER_CANCEL, O.REASON_ORDER_CANCEL, O.USER_ORDER_CANCELED, O.ORDER_TYPE,
                                O.TEXTURE_COMMENT, O.COLOR_LAK_COMMENT, O.COLOR_PATINA_COMMENT, O.PRISAD, O.PLAN_DATE_FIRSTSTAGE,
                                O.PLAN_DATE_PACK, O.FILEPATH_CALC_CLIENT, O.FILEPATH_CALC_MANAGER, O.FILEPATH_BILL, O.VIEW_MOD,
                                O.TERMOSHOV, O.ASSEMBLY_ANGLE, LIST_STATUSES.STATUS_DESCRIPTION, LIST_STATUSES.STATUS_NUM,
                                C.IS_PREPAID, C.CLIENTNAME, C.CITY, C.PRICE_COLUMN, C.IS_PREPAID

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
                q = `select first 1 
                O.ID, O.MANAGER, O.CLIENT, O.ORDERNUM, O.ITM_ORDERNUM, O.FASAD_MAT, O.FASAD_MODEL, O.FASAD_PG_WIDTH,
                O.TEXTURE, O.FIL_MAT, O.FIL_MODEL, O.COLOR, O.FIL_COLOR, O.COLOR_TYPE, O.COLOR_LAK, O.COLOR_PATINA, 
                O.ORDER_GENERALSQ, O.ORDER_FASADSQ, O.GLASS, O.PRIMECH, O.ORDER_COST_PRICECOLUMN, O.ORDER_COST,
                O.ORDER_PAY, (O.ORDER_TOTAL_COST - coalesce(O.ORDER_PAY, 0)) * -1 as ORDER_DEBT,
                O.ORDER_TOTAL_COST, O.ORDER_DISCOUNT, O.ORDER_DISCOUNT_COMMENT, O.ORDER_COSTUP, O.ORDER_COSTUP_COMMENT,
                O.ORDER_COST_PACK, O.ORDER_COST_GLASS, O.FACT_DATE_RECEIVE, O.FACT_DATE_FIRSTSAVE, O.FACT_DATE_LASTSAVE,
                O.FACT_DATE_CALCCOST, O.FACT_DATE_EXPORT_ITM, O.FIRSTSTAGEBAD, O.FACT_DATE_PACK, O.FACT_DATE_ORDER_OUT,
                O.ORDER_STATUS, O.FACT_DATE_ORDER_CANCEL, O.REASON_ORDER_CANCEL, O.USER_ORDER_CANCELED, O.ORDER_TYPE,
                O.TEXTURE_COMMENT, O.COLOR_LAK_COMMENT, O.COLOR_PATINA_COMMENT, O.PRISAD, O.PLAN_DATE_FIRSTSTAGE,
                O.PLAN_DATE_PACK, O.FILEPATH_CALC_CLIENT, O.FILEPATH_CALC_MANAGER, O.FILEPATH_BILL, O.VIEW_MOD,
                O.TERMOSHOV, O.ASSEMBLY_ANGLE, LIST_STATUSES.STATUS_DESCRIPTION, LIST_STATUSES.STATUS_NUM,
                C.IS_PREPAID, C.CLIENTNAME, C.CITY, C.PRICE_COLUMN, C.IS_PREPAID
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
                // E.PRICE_COST, E.COST, E.COST_SNG,
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;
                q =`select E.ID, E.ORDER_ID, E.NAME, E.HEIGHT, E.WIDTH, E.EL_COUNT, E.SQUARE, E.comment, E.CALC_AS, 
                    E.COST_SNG, E.CALC_COMMENT,
                    (select first 1 P.MEASURE_UNIT
                 from PRICE_LIST P
                 where upper(P.NOMENCLATURE) = upper(E.NAME)) as MEASURE_UNIT 
                 from ORDERS_ELEMENTS E ${$where} ${$sort}`;
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
        },
        {
            name: 'get_order_firstsave_date',
            query: (opt) => {
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;
                q =`select FACT_DATE_FIRSTSAVE from orders ${$where}`;
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