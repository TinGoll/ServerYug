const db = require('../dataBase');
const Entity = require('./Entity');

module.exports = class User extends Entity {
    static type = 'USER';
    firstName;
    lastName;
    middleName;
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
        this.firstName = options.firstName;
        this.lastName = options.lastName;
        this.middleName = options.middleName;
    }

    setPasword (password) {this.password = password;}
    getPasword () {return this.password;}

    setToken(token) {this.token = token;} 
    getToken() {return this.token;}

    async save () {
        const query = `
        insert into EMPLOYERS (NAME, MGMT_PASS, DEPARTMENT, STATUS, LOCATION, FIRSTNAME, LASTNAME, MIDDLENAME)
        values (
            '${this.userName}', 
            '${this.password}', 
            '${this.departament || ""}', 
            ${this.status || 1}, 
            '${this.location || ""}', 
            '${this.firstName || ""}', 
            '${this.lastName || ""}', 
            '${this.middleName || ""}'
        )
        returning ID;`;

        const result = await db.executeRequest(query);
        const {ID} = result;

        if (ID && ID > 0) {
            this.id = ID;
            return true;
        }
        else return false
    }
    async load (id) {return false}
}