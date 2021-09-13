module.exports = class Transaction {
    pool;
    db;
    transaction;

    constructor (pool, isolation) {
        this.pool = pool;
        pool.get((err, db) => {
            if (err) throw err;
            this.db = db;
            db.transaction(isolation, async (err, trans) => {
                if (err) throw err;
                this.transaction = await trans;
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
        this.transaction.commit((err) => {
            if (err) {
                this.transaction.rollback();
                throw err;
            }
        });
    }
    rollback () {this.transaction.rollback();}
    detach   () {this.db.detach();}
    destroy  () {this.pool.destroy();}
}