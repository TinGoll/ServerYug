import db from '../dataBase';
import { format } from 'date-format-parse';


const deffinePermission = async (db: any) => {
    const permissionGroup = [
        {id: 1, name: 'Гость'},
        {id: 2, name: 'Менеджер'},
        {id: 3, name: 'Админ'},
        {id: 4, name: 'Бухгалтер'},
        {id: 5, name: 'Сборка'},
    ]
    const permissions = [
        {id: 9, name: 'Journals [get-journals] get', description: ''},
        {id: 10, name: 'Journals [adopted] get', description: ''},
        {id: 11, name: 'Journals [id] get', description: ''},
    ]
    const permissionList = [
        {
            permissionGroupId: 4, 
            permissionId: 9,
            status: 1,
            data: [
                {name: 'Journal Id', data: 'all'}
            ]
        },
        {
            permissionGroupId: 4, 
            permissionId: 10,
            status: 1,
            data: [
                {name: 'Journal Id', data: 'all'}
            ]
        },
        {
            permissionGroupId: 4, 
            permissionId: 11,
            status: 1,
            data: [
                {name: 'Journal Id', data: 'all'}
            ]
        },
         {
            permissionGroupId: 5, 
            permissionId: 9,
            status: 1,
            data: [
                {name: 'Journal Id', data: '1'}
            ]
        },
        {
            permissionGroupId: 5, 
            permissionId: 10,
            status: 1,
            data: [
                {name: 'Journal Id', data: '1'}
            ]
        },
        {
            permissionGroupId: 5, 
            permissionId: 11,
            status: 1,
            data: [
                {name: 'Journal Id', data: '1'}
            ]
        }
    ]
    // Запись в базу
    try {
        for (const per of permissionList) {
        const query = `
            insert into PERMISSION_LIST (ID_PERMISSION_GROUP, ID_PERMISSION, STATUS)
            values (${per.permissionGroupId}, ${per.permissionId}, ${per.status})
            returning ID`
        const {ID} = await db.executeRequest(query);
        for (const data of per.data) {
            await db.executeRequest(`
                insert into PERMISSION_DATA (ID_PERMISSION_LIST, NAME, DATA)
                values (${ID}, '${data.name}', '${data.data}')  
            `);
        }
    }
    } catch (error) {
        console.log(error);
    }
}

//deffinePermission(db);

const fun = async (db: any) => {
    let query = `select T.ID from salary_transaction t where t.transaction_completed = 1 and t.id > 832`
    const transactions = await db.executeRequest(query);

    for (const transaction of transactions) {
        let query = `select S.ID, S.ID_ORDER, S.REGISTRATION_DATE, 
                            S.STATUS, S.ID_SALARY_TRANSACTION
                        from JOURNAL_SBORKA S
                        where S.ID_SALARY_TRANSACTION = ${transaction.ID}`;
        const orders = await db.executeRequest(query);
        let count = 0;
        for (const order of orders) {
            count ++;
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


//fun(db);