import { QueryOptions } from '../types/queryTypes';
import processing from './processing';

const data = [
        {
            name: 'get_barcodes',
            query: (opt: QueryOptions): string => {
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;

                let q: string =`select B.BARCODE, S.ID as ID_SECTOR, S.NAME as SECTOR, E.ID as ID_EMPLOYEE, E.NAME as EMPLOYEE,
                coalesce(B.STATUS_BARCODE, 0) as BLOCKED
                    from SECTORS_BARCODE B
                    left join EMPLOYERS E on (B.ID_EMPLOYERS = E.ID)
                    left join SECTORS S on (B.ID_SECTOR = S.ID)
                    ${$where}`
                return q;
            },
            defaultOptions: {}
        },
        {
            name: 'get_dep',
           query: (opt: QueryOptions): string => {
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;
                let q: string =`select distinct D.ID_JOURNAL_NAME, N.NAME, S.STATUS_NUM, S.STATUS_DESCRIPTION, D.ID_STATUS, D.ID_STATUS_AFTER
                from JOURNAL_DEP D
                left join JOURNAL_NAMES N on (D.ID_JOURNAL_NAME = N.ID)
                left join LIST_STATUSES S on (D.ID_STATUS = S.ID)   
                ${$where}
                `
                return q;
            },
            defaultOptions: {}
        },
        {
            name: 'get_adopted',
            query: (opt: QueryOptions): string => {
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;
                let q: string =`SELECT ${$first} ${$skip} DISTINCT
                    O.ID, O.ITM_ORDERNUM, O.ORDER_FASADSQ, O.ORDER_GENERALSQ,
                    GET_STATUS_NAME_TO_NUM(O.ORDER_STATUS) AS STATUS_DESCRIPTION,
                    GET_STATUS_NAME(GET_JSTATUS_ID(O.ID)) AS STATUS_NAME,
                    J.ID AS JOURNAL_ID,  J.TRANSFER_DATE, J.ID_JOURNAL_NAMES,
                    T.ID_EMPLOYEE, T.ID_SECTOR, T.MODIFER
                FROM JOURNALS J
                LEFT JOIN ORDERS O ON (J.ID_ORDER = O.ID)
                LEFT JOIN JOURNAL_TRANS T ON (T.ID_JOURNAL = J.ID)
                ${$where}
                ${$sort}`;
                return q;
            },
            defaultOptions: {
                $first: '100',
                $sort: 'J.TRANSFER_DATE desc'
            }
        },
         {
            name: 'get_adopted_extra_data',
            query: (opt: QueryOptions): string => {
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;
                let q: string =`
                    SELECT * FROM JOURNAL_DATA WHERE EXISTS (
                        SELECT ${$first} ${$skip} DISTINCT O.ID
                        FROM JOURNALS J
                        LEFT JOIN ORDERS O ON (J.ID_ORDER = O.ID)
                        ${$where}
                        ${$sort}
                    ) ORDER BY ID`;
                return q;
            },
            defaultOptions: {
                $first: '100',
                $sort: 'J.TRANSFER_DATE desc'
            }
        },
        {
            name: 'get_adopted_pages_count',
            query: (opt: QueryOptions): string => {
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;
                let q: string =`select distinct count(J.ID)
                from JOURNALS J
                left join ORDERS O on (J.ID_ORDER = O.ID)
                left join LIST_STATUSES S on (O.ORDER_STATUS = S.STATUS_NUM)
                left join JOURNAL_TRANS T on (T.ID_JOURNAL = J.ID)
                left join clients c on (o.client = c.clientname)
                left join SECTORS SECTOR on (T.ID_SECTOR = SECTOR.ID)
                ${$where}`
                return q;
            },
            defaultOptions: {
            }
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