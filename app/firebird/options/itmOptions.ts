import { FirebirdConnectionOptions } from "../types";

const options: FirebirdConnectionOptions = {
    host:           '192.168.2.101',
    port:           3050,
    database:       '/mnt/2T/Archive/Work/FireBird DB/itm/data base/ITM_DB.FDB',
    user:           'ITM',
    password:       'AdmUser',
    lowercase_keys: false, // set to true to lowercase keys
    role:           null, // default
    pageSize:       4096, // default when creating database
    retryConnectionInterval: 1000
};

export default options;