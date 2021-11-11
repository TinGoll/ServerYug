import { QueryOptions } from '../types/queryTypes';
import processing from './processing';

const data = [
        {
            name: 'get_orders',
            query: (opt: QueryOptions): string => {
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;
                let q: string = `select ${$first} ${$skip} distinct 
                                O.ID, O.MANAGER, O.CLIENT, O.ORDERNUM, O.ITM_ORDERNUM, O.FASAD_MAT, O.FASAD_MODEL, O.FASAD_PG_WIDTH,
                                O.TEXTURE, O.FIL_MAT, O.FIL_MODEL, O.COLOR, O.FIL_COLOR, O.COLOR_TYPE, O.COLOR_LAK, O.COLOR_PATINA, 
                                cast(O.ORDER_GENERALSQ as DECIMAL (8, 3)) AS ORDER_GENERALSQ, 
                                O.ORDER_FASADSQ, O.GLASS, O.PRIMECH, O.ORDER_COST_PRICECOLUMN, O.ORDER_COST,
                                O.ORDER_PAY, (O.ORDER_TOTAL_COST - coalesce(O.ORDER_PAY, 0)) * -1 as ORDER_DEBT,
                                O.ORDER_TOTAL_COST, O.ORDER_DISCOUNT, O.ORDER_DISCOUNT_COMMENT, O.ORDER_COSTUP, O.ORDER_COSTUP_COMMENT,
                                O.ORDER_COST_PACK, O.ORDER_COST_GLASS, O.FACT_DATE_RECEIVE, 
                                CAST(O.FACT_DATE_FIRSTSAVE AS TIMESTAMP) AS FACT_DATE_FIRSTSAVE, O.FACT_DATE_LASTSAVE,
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
             query: (opt: QueryOptions): string => {
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;
                let q: string = `select count(o.id) 
                    from orders o 
                    left join CLIENTS C on (O.CLIENT = C.CLIENTNAME)
                    left join LIST_STATUSES on (LIST_STATUSES.STATUS_NUM = O.ORDER_STATUS)
                    ${$where}`;
                return q;
            } ,
            defaultOptions: {$first: '100'}
        },
        {
            name: 'get_order_header',
            query: (opt: QueryOptions): string => {
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;
                let q: string = `select first 1 
                O.ID, O.MANAGER, O.CLIENT, O.ORDERNUM, O.ITM_ORDERNUM, O.FASAD_MAT, O.FASAD_MODEL, O.FASAD_PG_WIDTH,
                O.TEXTURE, O.FIL_MAT, O.FIL_MODEL, O.COLOR, O.FIL_COLOR, O.COLOR_TYPE, O.COLOR_LAK, O.COLOR_PATINA, 
                O.ORDER_GENERALSQ, O.ORDER_FASADSQ, O.GLASS, O.PRIMECH, O.ORDER_COST_PRICECOLUMN, O.ORDER_COST,
                O.ORDER_PAY, (O.ORDER_TOTAL_COST - coalesce(O.ORDER_PAY, 0)) * -1 as ORDER_DEBT,
                O.ORDER_TOTAL_COST, O.ORDER_DISCOUNT, O.ORDER_DISCOUNT_COMMENT, O.ORDER_COSTUP, O.ORDER_COSTUP_COMMENT,
                O.ORDER_COST_PACK, O.ORDER_COST_GLASS, O.FACT_DATE_RECEIVE, CAST(O.FACT_DATE_FIRSTSAVE AS TIMESTAMP) AS FACT_DATE_FIRSTSAVE, 
                O.FACT_DATE_LASTSAVE,
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
           query: (opt: QueryOptions): string => { 
                // E.PRICE_COST, E.COST, E.COST_SNG,
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;
                let q: string =`select  E.ID, E.ORDER_ID, E.NAME, E.HEIGHT, E.WIDTH, 
                            E.EL_COUNT, E.SQUARE, E.COMMENT, E.CALC_AS, E.MOD_PRICE,
                            E.PRICE_COST, E.COST, E.COST_SNG, E.CALC_COMMENT,
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
            query: (opt: QueryOptions): string => {
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;
                const $tempSort = $sort || 'order by P.DATE3, P.ID';
                let q: string =`
                    SELECT P.ID, P.ORDER_ID, P.DATE_SECTOR, GET_SECTOR_NAME(O.ID_NEW_SECTOR) as SECTOR,
                        P.DATE_DESCRIPTION, P.COMMENT, P.DATE3
                        FROM ORDERS_DATE_PLAN P
                        LEFT JOIN SECTORS_OLD O ON (UPPER(O.NAME_OLD_SECTOR) = UPPER(P.DATE_DESCRIPTION))
                    ${$where} ${$tempSort}`;
                return q;
            },
            defaultOptions: {}
        },
        {
            name: 'get_order_firstsave_date',
            query: (opt: QueryOptions): string => {
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;
                let q: string =`select FACT_DATE_FIRSTSAVE from orders ${$where}`;
                return q;
            },
            defaultOptions: {}
        },
        {
            name: 'get_order_clients',
             query: (opt: QueryOptions): string => {
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;
                let q: string =`select DISTINCT clientname from clients`;
                return q;
            },
            defaultOptions: {}
        },
        {
            name: 'get_order_nomenclature',
             query: (opt: QueryOptions): string => {
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;
                let q: string =`select DISTINCT N.NOMENCLATURE,
                    (select count(L.ID)
                    from ORDERS_ELEMENTS L
                    where L.NAME = N.NOMENCLATURE) as CROLE
                from NOMENCLATURE N
                where N.nomenclature is not null
                order by CROLE DESC`;
                return q;
            },
            defaultOptions: {}
        },
        {
            name: 'get_employers',
            query: (opt: QueryOptions): string => {
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;
                let q: string =`select DISTINCT e.name from employers e ${$where}`;
                return q;
            },
            defaultOptions: {$where: "e.department ='Офис'"}
        }
    ];
    const get = (name: string ='', opt: QueryOptions = {}) => {
        let q = data.find(item => item.name.toUpperCase() == name.toUpperCase());
        if (!q) return '';
        let options = {...q.defaultOptions, ...opt};
        return q.query(processing(options)).replace(/ +/g, ' ').trim();
    }
    const getOptions = (): QueryOptions => {
        return {
            $first: undefined,
            $skip: undefined,
            $where: undefined,
            $sort: undefined
        }
    }
    const getdefaultOptions = (name: string =''): QueryOptions => {
        let q = data.find(item => item.name.toUpperCase() == name.toUpperCase());
        return q ? q.defaultOptions : {};
    }
export default {get, getOptions, getdefaultOptions};