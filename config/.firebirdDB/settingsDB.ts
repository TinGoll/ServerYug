
export declare interface OtionsNodeFirebirdDb {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    lowercase_keys: boolean;
    role: any;
    pageSize: number;
}

const options: OtionsNodeFirebirdDb = {
    host:           '192.168.2.101',
    port:           3050,
    database:       '/mnt/2T/Archive/Work/FireBird DB/itm/data base/ITM_DB.FDB',
    user:           'ITM',
    password:       'AdmUser',
    lowercase_keys: false, // set to true to lowercase keys
    role:           null, // default
    pageSize:       4096 // default when creating database
};
 
export default options;
