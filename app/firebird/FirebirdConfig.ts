import path from 'path';

export default class FirebirdConfig {
    username?:string    = process.env.ISC_FB_USER;
    password?:string    = process.env.ISC_FB_PASSWORD;
    host?:string        = process.env.NODE_FB_HOST;
    port?:string        = process.env.NODE_FB_PORT;
    tmpDir?:string      = process.env.NODE_FB_TMP_DIR;
    rootPath: string;

    //rootPath: string;
    constructor () {
        this.rootPath =  path.resolve(); 
    }

    create(name: string): string {
        const database = `${this.rootPath}/${this.tmpDir}/${name}`;
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