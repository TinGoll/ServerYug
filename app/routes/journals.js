const {Router}                  = require('express');
const db                        = require('../dataBase');
const {check, validationResult} = require('express-validator');
const {format}                  = require('date-format-parse');
const settings                  = require('../settings');
const jwt                       = require('jsonwebtoken');
const { users }                 = require('../systems')
const atOrderQuery              = require('../query/atOrder');

// /api/journals/

const journals = [
    {id: 1, name: 'Журнал сборки'},
    {id: 2, name: 'Журнал шлифовки'}
]

const router = Router();
// /api/journals/get-journals

router.get(
    '/get-journals', 
    async (req, res) => {
        const defaultError = 'Ошибка получения списка журналов.';
        try {
            const token = req.get('Authorization');
            jwt.verify(token, settings.secretKey, async (err, decoded) => {
                if (err) return res.status(500)
                    .json({errors: [err.message, err.expiredAt ? 'Срок действия до: ' + format(err.expiredAt, 'DD.MM.YYYY HH:mm:ss') : null], message: 'Токен не действителен.'});
                const user = await users.getUserToID(decoded.userId);
                return res.json({journals});
            });
        } catch (error) {
            return res.status(500).json({errors: [error.message], message: defaultError});
        }
    }
)
// /api/journals/adopted
router.get (
    '/adopted',
    async (req, res) => {
        try {
            const options   = {...atOrderQuery.getdefaultOptions('get_adopted')};
            const limit     = req.query._limit;
            const page      = req.query._page;
            const find      = req.query._find;
            const sort      = req.query._sort;

            const d1        = req.query._d1; 
            const d2        = req.query._d2;

            const filter    = req.query._filter;

            const dateFirst     = d1 ? d1.toDate("dd/mm/yyyy") : undefined;
            const dateSecond    = d2 ? d2.toDate("dd/mm/yyyy") : undefined;
       
            if (limit)  options.$first = limit;
            if (page)   options.$skip = (page * limit) - limit;
            if (sort)   options.$sort = sort; 

            if (find && find > 0) {
                options.$where =  `${options.$where} and J.ID_JOURNAL_NAMES = ${find}`;
            }

            if (dateFirst) options.$where =  `${options.$where} and CAST(J.TS as date) >= '${format(dateFirst, 'DD.MM.YYYY')}'`;
            if (dateSecond) options.$where =  `${options.$where} and CAST(J.TS as date) <= '${format(dateSecond, 'DD.MM.YYYY')}'`;
            if (filter) {
                const fiters = filter.trim().split(' ');
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

            const orders        = await db.executeRequest(query);
            const [count]       = await db.executeRequest(queryCount);
            const pages         = count.COUNT ? Math.ceil(count.COUNT / options.$first) : 0;
            return res.json({orders, count: count.COUNT , pages: pages});
        } catch (error) {
            res.status(500).json({errors:[error.message], message: 'Ошибка запроса: "Принятые заказы".'})
        }
    }
);

// /api/journals/:id
router.get(
    '/:id',
    async (req, res) => {
        const defaultError = 'Ошибка получения журнала.';
        try {
            let journal;
            const id =  req.params.id;
            switch (parseInt(id)) {
                case 1:
                    journal = await journalSborka();
                    break;
                default:
                    break;
            }
            
            if (!journal) return res.status(500).json({errors: ['Такой журнал не существует.'], message: defaultError});
            return res.json({journal});
/*
            const token = req.get('Authorization');
            jwt.verify(token, settings.secretKey, async (err, decoded) => {
                if (err) return res.status(500)
                    .json({errors: [err.message, err.expiredAt ? 'Срок действия до: ' + format(err.expiredAt, 'DD.MM.YYYY HH:mm:ss') : null], message: 'Токен не действителен.'});
                const user = await users.getUserToID(decoded.userId);
                return res.json({journals});
            });

*/
        } catch (error) {
            return res.status(500).json({errors: [error.message], message: defaultError});
        }
    }
)

/*
 * Функции для возврата журналов 
 */

const journalSborka = async () => {
    try {
        let query = `select * from REPORT_SBORKA (1);`
        const overdue = await db.executeRequest(query);
        query = `select * from REPORT_SBORKA (2);`
        const forToday = await db.executeRequest(query);
        query = `select * from REPORT_SBORKA (3);`
        const forFuture = await db.executeRequest(query);
        return {overdue, forToday, forFuture}
    } catch (error) {
        throw error;
    }
}


String.prototype.toDate = function(format)
{
  var normalized      = this.replace(/[^a-zA-Z0-9]/g, '-');
  var normalizedFormat= format.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
  var formatItems     = normalizedFormat.split('-');
  var dateItems       = normalized.split('-');

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


module.exports = router;