const db = require('../dataBase');
const {format} = require('date-format-parse');

const fun = async (db) => {
    let query = `select T.ID from salary_transaction t where t.transaction_completed = 1`
    const transactions = await db.executeRequest(query);

    for (const transaction of transactions) {
        let query = `select S.ID, S.ID_ORDER, S.REGISTRATION_DATE, 
                            S.STATUS, S.ID_SALARY_TRANSACTION
                        from JOURNAL_SBORKA S
                        where S.ID_SALARY_TRANSACTION = ${transaction.ID}`;
        const orders = await db.executeRequest(query);
        for (const order of orders) {
            let query = `
                execute block
                returns (ID integer)
                as
                begin
                    insert into JOURNALS (ID_ORDER, ID_JOURNAL_NAMES, NOTE, TS)
                    values (${order.ID_ORDER}, 1, ${null}, '${format(order.REGISTRATION_DATE, 'DD.MM.YYYY HH:mm:ss')}') returning ID into :ID;
                        
                    insert into JOURNAL_TRANS (ID_EMPLOYEE, ID_SECTOR, ID_JOURNAL, MODIFER)
                    values (${81}, ${2}, :ID, -1);

                    insert into JOURNAL_TRANS (ID_EMPLOYEE, ID_SECTOR, ID_JOURNAL, MODIFER)
                    values (${20}, ${1}, :ID, 1);

                    insert into cost_of_work (id_journal, id_work_price, price)
                    select :ID as id_journal, W.ID_WORK_PRICES, W.PRICE
                    from WAGE W
                    where W.ID_SALARY_TRANSACTION = ${transaction.ID};
                    suspend;
                end`;

                const [journal] =  await db.executeRequest(query);

                query = `insert into salary_trans_el (id_journal, id_transaction)
                            VALUES (${journal.ID}, ${transaction.ID})`;

                await db.executeRequest(query);
        }
    }
}

fun(db);