"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const date_format_parse_1 = require("date-format-parse");
const deffinePermission = (db) => __awaiter(void 0, void 0, void 0, function* () {
    const permissionGroup = [
        { id: 1, name: 'Гость' },
        { id: 2, name: 'Менеджер' },
        { id: 3, name: 'Админ' },
        { id: 4, name: 'Бухгалтер' },
        { id: 5, name: 'Сборка' },
    ];
    const permissions = [
        { id: 9, name: 'Journals [get-journals] get', description: '' },
        { id: 10, name: 'Journals [adopted] get', description: '' },
        { id: 11, name: 'Journals [id] get', description: '' },
    ];
    const permissionList = [
        {
            permissionGroupId: 4,
            permissionId: 9,
            status: 1,
            data: [
                { name: 'Journal Id', data: 'all' }
            ]
        },
        {
            permissionGroupId: 4,
            permissionId: 10,
            status: 1,
            data: [
                { name: 'Journal Id', data: 'all' }
            ]
        },
        {
            permissionGroupId: 4,
            permissionId: 11,
            status: 1,
            data: [
                { name: 'Journal Id', data: 'all' }
            ]
        },
        {
            permissionGroupId: 5,
            permissionId: 9,
            status: 1,
            data: [
                { name: 'Journal Id', data: '1' }
            ]
        },
        {
            permissionGroupId: 5,
            permissionId: 10,
            status: 1,
            data: [
                { name: 'Journal Id', data: '1' }
            ]
        },
        {
            permissionGroupId: 5,
            permissionId: 11,
            status: 1,
            data: [
                { name: 'Journal Id', data: '1' }
            ]
        }
    ];
    // Запись в базу
    try {
        for (const per of permissionList) {
            const query = `
            insert into PERMISSION_LIST (ID_PERMISSION_GROUP, ID_PERMISSION, STATUS)
            values (${per.permissionGroupId}, ${per.permissionId}, ${per.status})
            returning ID`;
            const { ID } = yield db.executeRequest(query);
            for (const data of per.data) {
                yield db.executeRequest(`
                insert into PERMISSION_DATA (ID_PERMISSION_LIST, NAME, DATA)
                values (${ID}, '${data.name}', '${data.data}')  
            `);
            }
        }
    }
    catch (error) {
        console.log(error);
    }
});
//deffinePermission(db);
const fun = (db) => __awaiter(void 0, void 0, void 0, function* () {
    let query = `select T.ID from salary_transaction t where t.transaction_completed = 1 and t.id > 832`;
    const transactions = yield db.executeRequest(query);
    for (const transaction of transactions) {
        let query = `select S.ID, S.ID_ORDER, S.REGISTRATION_DATE, 
                            S.STATUS, S.ID_SALARY_TRANSACTION
                        from JOURNAL_SBORKA S
                        where S.ID_SALARY_TRANSACTION = ${transaction.ID}`;
        const orders = yield db.executeRequest(query);
        let count = 0;
        for (const order of orders) {
            count++;
            let query = `
                execute block
                returns (ID integer)
                as
                begin
                    insert into JOURNALS (ID_ORDER, ID_JOURNAL_NAMES, NOTE, TS)
                    values (${order.ID_ORDER}, 1, ${null}, '${(0, date_format_parse_1.format)(order.REGISTRATION_DATE, 'DD.MM.YYYY HH:mm:ss')}') returning ID into :ID;
                        
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
            const [journal] = yield db.executeRequest(query);
            query = `insert into salary_trans_el (id_journal, id_transaction)
                            VALUES (${journal.ID}, ${transaction.ID})`;
            yield db.executeRequest(query);
        }
    }
});
//fun(db);
