/*
import path from 'path';

export default class FirebirdConfig {
    username?:string    = 'ITM';
    password?:string    = 'AdmUser';
    host?:string        = '192.168.2.101';
    port?:string        = '3050';
    tmpDir?:string      = '/mnt/2T/Archive/Work/FireBird DB/itm/data base/';
    rootPath: string;

    //rootPath: string;
    constructor () {
        this.rootPath =  path.resolve(); 
    }

    create(name: string): string {
        const database = `${this.tmpDir}/${name}`;
        return (this.host ?? '') +
        (this.host && this.port ? `/${this.port}` : '') +
        (this.host ? ':' : '') +
        database;
    }
    isLocal (): boolean {
        return this.host == undefined ||
        this.host == 'localhost' ||
        this.host == '127.0.0.1';
    }
}

*/