import { FirebirdConnectionOptions } from "../types";

const options: FirebirdConnectionOptions = {
  host: "192.168.2.10",
  port: 3050,
  database: "F:/Work/FireBird DB/massiv-yug/MYS.fdb", 
  user: "SYSDBA",
  password: "masterkey",
  lowercase_keys: false, // set to true to lowercase keys
  role: null, // default
  pageSize: 4096, // default when creating database
};

export default options;
