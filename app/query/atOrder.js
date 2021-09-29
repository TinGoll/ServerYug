const processing = require('./processing');

const data = [
        {
            name: 'get_barcodes',
            query: (opt) => {
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;
                q =`select B.BARCODE, S.ID as ID_SECTOR, S.NAME as SECTOR, E.ID as ID_EMPLOYEE, E.NAME as EMPLOYEE,
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
            query: (opt) => {
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;
                q =`select distinct D.ID_JOURNAL_NAME, N.NAME, S.STATUS_NUM, S.STATUS_DESCRIPTION, D.ID_STATUS_AFTER
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
            query: (opt) => {
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;
                q =`select ${$first} ${$skip}
                distinct O.ID, O.ITM_ORDERNUM,
                (select NAME
                from SECTORS
                where ID =
                (select first 1 T2.ID_SECTOR
                from JOURNALS J2
                left join JOURNAL_TRANS T2 on (T2.ID_JOURNAL = J2.ID)
                where T2.MODIFER = - 1 and
                      J2.ID = J.ID)
                ) as TRANSFER, SECTOR.NAME as ACCEPTED, 
                S.STATUS_DESCRIPTION, O.ORDER_FASADSQ, J.NOTE, J.TRANSFER_DATE
                from JOURNALS J
                left join ORDERS O on (J.ID_ORDER = O.ID)
                left join clients c on (o.client = c.clientname)
                left join LIST_STATUSES S on (O.ORDER_STATUS = S.STATUS_NUM)
                left join JOURNAL_TRANS T on (T.ID_JOURNAL = J.ID)
                left join SECTORS SECTOR on (T.ID_SECTOR = SECTOR.ID)
                ${$where}
                ${$sort}`;
                return q;
            },
            defaultOptions: {
                $first: '100',
                $sort: 'J.TS desc',
                $where: 'T.MODIFER = 1' // обязательный параметр
            }
        },
        {
            name: 'get_adopted_pages_count',
            query: (opt) => {
                const {$first = '', $skip = '', $where = '', $sort = ''} = opt;
                q =`select distinct count(J.ID)
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
        return q ? q.defaultOptions : {};
    }
module.exports = {get, getOptions, getdefaultOptions};