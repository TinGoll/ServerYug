const db = require('../dataBase');
const Entity = require('./Entity');

module.exports = class User extends Entity {
    static type = 'USER';
    id;
    firstName;
    lastName;
    middleName;
    userName;
    password;
    sectorId;
    departament;
    status;
    location;
    permissionGroupId;
    isOwner = false;
    permissionList = [];
    permissionListData = [];

    constructor (options) {
        super(options);
        this.userName = options.userName;
        this.password = options.password;
        this.departament = options.departament;
        this.sectorId = options.sectorId;
        this.status = options.status;
        this.location = options.location;
        this.permissionGroupId = options.permissionGroupId;
        this.firstName = options.firstName;
        this.lastName = options.lastName;
        this.middleName = options.middleName;
        this.id = options.id;
    }

    setPasword (password) {this.password = password;}
    getPasword () {return this.password;}
    getPermission () {return this.permissionList;}

    setToken (token) {this.token = token;} 
    getToken () {return this.token;}
    getpermissionGroupId () {
        if (!this.permissionGroupId) return 1;
        return this.permissionGroupId;
    }
    async permissionGroupIdreload () {
        const [res] = await db.executeRequest(`select E.PERMISSION_GROUP_ID from EMPLOYERS E where E.ID = ${this.id}`);
        this.permissionGroupId = res.PERMISSION_GROUP_ID;
    }
    async permissionLoad () {
        await this.permissionGroupIdreload();
        const groupId = this.getpermissionGroupId();
        const [group] = await db.executeRequest(`select G.OWNER from PERMISSIONS_GROUP G where G.ID = ${groupId}`); 
        this.isOwner = !!group.OWNER;
        if (this.isOwner) return;

        this.permissionList = await db.executeRequest(`select L.ID, L.ID_PERMISSION, P.NAME, P.DESCRIPTIONS, P.CATEGORY
                                                            from PERMISSION_LIST L
                                                            left join PERMISSIONS P on (L.ID_PERMISSION = P.ID)
                                                            where L.ID_PERMISSION_GROUP = ${groupId}`);

        this.permissionListData = await db.executeRequest(`select D.ID, D.ID_PERMISSION_LIST, D.NAME, D.DATA
                                                            from PERMISSION_DATA D
                                                            left join PERMISSION_LIST L on (D.ID_PERMISSION_LIST = L.ID)
                                                            where L.ID_PERMISSION_GROUP = ${groupId}`); 
    }
    async permissionCompare (name) {
        try {
            if (!this.isOwner && this.permissionList.length == 0) await this.permissionLoad(); 
            if (this.isOwner) return true;
            for (const permission of this.permissionList) 
                if (String(permission.NAME).toUpperCase() == String(name).toUpperCase()) return true; 
            return false;
        } catch (error) {
            console.log(error);
            return false;
        }
    }
    async save () {
        const query = `
        insert into EMPLOYERS (NAME, MGMT_PASS, DEPARTMENT, STATUS, LOCATION, FIRSTNAME, LASTNAME, MIDDLENAME, PERMISSION_GROUP_ID)
        values (
            '${this.userName}', 
            '${this.password}', 
            '${this.departament || ""}', 
            ${this.status || 1}, 
            '${this.location || ""}', 
            '${this.firstName || ""}', 
            '${this.lastName || ""}', 
            '${this.middleName || ""}',
            ${this.permissionGroupId || 1}
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