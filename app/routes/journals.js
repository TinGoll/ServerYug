const {Router}                  = require('express');
const db                        = require('../dataBase');
const {check, validationResult} = require('express-validator');
const {format}                  = require('date-format-parse');
const settings                  = require('../settings');
const jwt                       = require('jsonwebtoken');
const { users }                 = require('../systems')
const atOrderQuery              = require('../query/atOrder');
const jfunction                 = require('../systems/virtualJournalsFun');

// /api/journals/

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
                // Проверка прав на получение журналов
                const journals = await jfunction.permissionSet(user);
                if (journals.length == 0) return res.status(500).json({errors:['Список журналов пуст.'], message: defaultError})
                return res.json({journals: journals.filter(j => j.id != 5)}); // Удаляем из списка журнал бухгалтера
            });
        } catch (error) {
            return res.status(500).json({errors: [error.message], message: defaultError});
        }
    }
)

// /api/journals/set-comment
router.post
(
    '/set-comment',
    async (req, res) => {
        try {
            // Проверка токена, получение пользователя.
            let decoded;
            const token = req.get('Authorization');
            try {decoded = jwt.verify(token, settings.secretKey);} 
            catch (error) {return res.status(500).json({errors: [error.message], message: 'Некорректный токен'})}
            const user = await users.getUserToID(decoded.userId);
            // Конец проверки токена.
            const comment = req.body;
            
            if (comment.dataId) {
                if (!comment.text || comment.text == '') {
                    const isDeleted = await db.executeRequest(`DELETE FROM JOURNAL_DATA D WHERE D.ID = ${comment.dataId} RETURNING ID;`);
                    return res.status(200).json({dataId: isDeleted.ID});
                }
                const result = await db.executeRequest(`
                    UPDATE JOURNAL_DATA D
                    SET D.DATA_VALUE = '${comment.text}'
                    WHERE D.ID = ${comment.dataId} RETURNING ID;
                `);
                if (result.ID) {
                    return res.status(201).json({dataId: result.ID});
                }
            }
            const {ID} = await db.executeRequest(`
                INSERT INTO JOURNAL_DATA (ID_ORDER, ID_SECTOR, ID_EMPLOYEE, DATA_GROUP, DATA_NAME, DATA_VALUE)
                VALUES (${comment.orderId}, ${user.sectorId}, ${user.id}, 'Comment', 'Комментарий', '${comment.text}') 
                RETURNING ID;
            `);
            return res.status(201).json({dataId: ID});
        } catch (error) {
            console.log(error);
            res.status(500).json({errors:[error.message], message: 'Ошибка добавления комментария.'})
        }
    }
);

// /api/journals/adopted
router.get (
    '/adopted/:id',
    async (req, res) => {
        const defaultError = 'Ошибка получения принятых заказов';
        const permissionName = 'Journals [adopted] get';
        try {
            const options   = {...atOrderQuery.getdefaultOptions('get_adopted')};
            const limit     = req.query._limit;
            const page      = req.query._page;
            const sort      = req.query._sort;
            const find      = req.params.id;
            const d1        = req.query._d1; 
            const d2        = req.query._d2;

            const filter        = req.query._filter;
            const dateFirst     = d1 ? d1.toDate("dd/mm/yyyy") : undefined;
            const dateSecond    = d2 ? d2.toDate("dd/mm/yyyy") : undefined;
       
            if (limit)  options.$first = limit;
            if (page)   options.$skip = (page * limit) - limit;
            if (sort)   options.$sort = sort; 

            // Проверка токена, получение пользователя.
            let decoded;
            const token = req.get('Authorization');
            try {decoded = jwt.verify(token, settings.secretKey);} 
            catch (error) {return res.status(500).json({errors: [error.message], message: 'Некорректный токен'})}
            const user = await users.getUserToID(decoded.userId);
            // Конец проверки токена.

            // Проверка прав
            const journals = await jfunction.permissionSet(user);
            const journal = journals.find(j => j.id == find);
            if(!journal) return res.status(500)
                .json({errors: ['У тебя нет прав на получение данных этого журнала. Обратись а администатору.'], message: defaultError});
            // Конец проверки прав.

            if (find && find > 0) {
                options.$where =  `${options.$where} and J.ID_JOURNAL_NAMES in (${journal.j.join(', ')})`;
            }

            if (dateFirst) options.$where =  `${options.$where} and CAST(J.TS as date) >= '${format(dateFirst, 'DD.MM.YYYY')}'`;
            if (dateSecond) options.$where =  `${options.$where} and CAST(J.TS as date) <= '${format(dateSecond, 'DD.MM.YYYY')}'`;
            if (filter) {
                const fiters = String(filter).trim().split(' ');
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

router.get(
    '/:id',
    async (req, res) => {
        const defaultError = 'Ошибка получения журнала.';
        try {
            const id =  req.params.id;
            const token = req.get('Authorization');
            jwt.verify(token, settings.secretKey, async (err, decoded) => {
                if (err) return res.status(500)
                    .json({errors: [err.message, err.expiredAt ? 'Срок действия до: ' + format(err.expiredAt, 'DD.MM.YYYY HH:mm:ss') : null], message: 'Токен не действителен.'});
                // Проверка прав на получение журнала
                const user = await users.getUserToID(decoded.userId);
                const journals = await jfunction.permissionSet(user);
                const allowed = journals.find(j => j.id == id);
                if(!allowed) return res.status(500)
                        .json({errors: ['У тебя нет прав на получение данного журнала. Обратись а администатору.'], message: defaultError});
                // Проверка прав завершена
                let journal;
                
                switch (parseInt(id)) {
                    case 1:
                        journal = await jfunction.getJournalToId(id);
                        break;
                    case 2:
                        journal = await jfunction.getJournalToId(id);
                        break;
                    case 3:
                        journal = await jfunction.getJournalToId(id);
                        break;
                    case 4:
                        journal = await jfunction.getJournalToId(id);
                        break;
                    default:
                        break;
                }

                if (!journal) return res.status(500).json({errors: ['Такой журнал не существует.'], message: defaultError});
                //if (!journal) return res.json({arr:[]});
                return res.json({journal});
            });

        } catch (error) {
            return res.status(500).json({errors: [error.message], message: defaultError});
        }
    }
)

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