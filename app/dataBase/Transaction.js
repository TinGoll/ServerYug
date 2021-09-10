module.exports = class Transaction {
    pool;
    db;
    transaction;


    constructor (pool, isolation) {
        this.pool = pool;
        pool.get((err, db) => {
            if (err) throw err;
            this.db = db;
            db.transaction(isolation,  (err, transaction) => {
                if (err) throw err;
                this.transaction = transaction;
            })
        });
    }
    query (query) {
        return new Promise ((res, rej) => {
            this.transaction.query(query, (err, result) => {
                if (err) return rej(err);
                return res(result);
            });
        });
    }
    commit () {
        transaction.commit((err) => {
            if (err) {
                transaction.rollback();
                throw err;
            }
        });
    }
    rollback () {
        this.transaction.rollback();
    }

    detach() {
        this.db.detach();
    }
    
    destroy() {
        this.pool.destroy();
    }
}