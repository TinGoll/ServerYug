const Firebird = require('node-firebird');
const config = require('../../config');
const { database } = require('../../config/.firebirdDB/settingsDB');

const pool = Firebird.pool(5, config.configDb);

let d;

pool.get((err, db) => {

    //db.sequentially
    
    if (err)
        throw err;
    /**
     *  select * from employers e where e.name = 'Черемисова'
        select * from employers e where e.name = 'Сергеева Л.'
        select * from employers e where e.name = 'Оля'
        select * from employers e where e.name = 'Алина'
     */


    db.query(`select * from employers e where e.name = 'Алина'`, (err, res) => {
        console.log(res);
       db.detach();
    }).query(`select * from employers e where e.name = 'Оля'`, (err, res) => {
        console.log(res);
       db.detach();
    });


/*
    db.sequentially(`select * from employers e where e.name = 'Алина'`, function(row, index) {
        // EXAMPLE
        //stream.write(JSON.stringify(row));
        //console.log(row);
        db.detach();
    }, function(err) {
        //console.log('1- END');
        // END
        // IMPORTANT: close the connection
        db.detach();
        d = db;
    })
    .sequentially(`select * from employers e where e.name = 'Оля'`, function(row, index) {
        // EXAMPLE
        //stream.write(JSON.stringify(row));
        //console.log(row);
    }, function(err) {
        // END
        // IMPORTANT: close the connection
        db.detach();
    });



    //db.detach();
*/
    /*

    db.on('row', function(row, index, isObject) {
        console.log('row row:', row);
        console.log('row index:', index);
        console.log('row isObject:', isObject);
        // index === Number
        // isObject === is row object or array?
    });

    db.on('result', function(result) {
        console.log('result:', result);
        // result === Array
    });

    db.on('attach', function() {
        console.log('attach:');
    });

    db.on('detach', function(isPoolConnection) {
        console.log('detach:', isPoolConnection);
        // isPoolConnection == Boolean
    });

    db.on('reconnect', function() {
        console.log('reconnect:');

    });

    db.on('error', function(err) {
        console.log('error:', err);

    });

    db.on('transaction', function(isolation) {
        console.log('transaction:', isolation);
        // isolation === Number
    });

    db.on('commit', function() {
        console.log('commit:');

    });

    db.on('rollback', function() {
        console.log('rollback:');

    });

    db.detach();
    */

});

pool.destroy();
