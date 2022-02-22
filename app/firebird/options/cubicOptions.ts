import { FirebirdConnectionOptions } from "../types";

const options: FirebirdConnectionOptions = {
    host:           '192.168.2.101',
    port:           3050,
    database:       '/mnt/2T/Archive/Work/FireBird DB/cubic 3/CUBIC.FDB',
    user:           'CUBIC_USERS',
    password:       'CubicUsers',
    lowercase_keys: false, // set to true to lowercase keys
    role:           null, // default
    pageSize:       4096, // default when creating database
};

export default options;