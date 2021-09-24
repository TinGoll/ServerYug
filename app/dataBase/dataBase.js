const Firebird = require('node-firebird');
const config = require('../../config');
const options = require('../../config/.firebirdDB/settingsDB');
const Transaction = require('./Transaction');

const pool = Firebird.pool(5, options);

const executeRequest =  (query) => {
    return new Promise((res, rej) => {
        pool.get((err, db) => {
            if (err) return rej(err);
            db.query(query, (err, result) => {
                db.detach();
                if (err) return rej(err);
                return res(result);
            })
        })
        pool.destroy();
    });
}

const beginTransaction = (callback) => {
     // db = DATABASE
    pool.get((err, db) => {
        if (err) callback(err);
        db.transaction(Firebird.ISOLATION_READ_COMMITED, callback);
        db.detach();
        pool.destroy();
    });
}

const newTransaction = (isolationNumber = 1) => {
    if (isolationNumber === 1) return new Transaction(pool, Firebird.ISOLATION_READ_COMMITED);
    if (isolationNumber === 2) return new Transaction(pool, Firebird.ISOLATION_READ_UNCOMMITTED);
    if (isolationNumber === 3) return new Transaction(pool, Firebird.ISOLATION_REPEATABLE_READ);
    if (isolationNumber === 4) return new Transaction(pool, Firebird.ISOLATION_SERIALIZABLE);
    if (isolationNumber === 5) return new Transaction(pool, Firebird.ISOLATION_READ_COMMITED_READ_ONLY);
}

const formatDateToDb = (date) => {
    if (!date) return null;
    return date.toLocaleDateString();
}

module.exports = {
    executeRequest,
    newTransaction,
    formatDateToDb,
    beginTransaction
}
