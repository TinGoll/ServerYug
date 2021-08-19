let options = {};
 
options.host = '192.168.2.101';
options.port = 3050;
options.database = '/mnt/2T/Archive/Work/FireBird DB/itm/data base/ITM_DB.FDB';
options.user = 'ITM';
options.password = 'AdmUser';
options.lowercase_keys = false; // set to true to lowercase keys
options.role = null;            // default
options.pageSize = 4096;        // default when creating database


module.exports = (
    options
)