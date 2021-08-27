const Firebird = require('node-firebird');
const config = require('../../config');
const options = require('../../config/.firebirdDB/settingsDB')

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

module.exports = {
    executeRequest
}
