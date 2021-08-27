const {db} = require('../dataBase');
const Entity = require('./Entity');

module.exports = class User extends Entity {
    static type = 'USER';
    userName;
    password;
    departament;
    status;
    location;
    permissionGroup;

    constructor (options) {
        super(options);
       
        this.userName = options.userName;
        this.password = options.password;
        this.departament = options.departament;
        this.status = options.status;
        this.location = options.location;
        this.permissionGroup = options.permissionGroup;
    }

    setPasword (password) {this.password = password;}
    getPasword () {return this.password;}

    setToken(token) {this.token = token;} 
    getToken() {return this.token;}

    save () {return false;}
    load () {return false}
}