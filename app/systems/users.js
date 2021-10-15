const { User }  = require("../entities");
const db        = require('../dataBase');
let userList    = [];

const getAllUsers = async () => {
    try {
        const res = await db.executeRequest(`
            SELECT DISTINCT
                E.ID, E.MGMT_PASS, E.NAME, E.FIRSTNAME, E.LASTNAME, E.MIDDLENAME,
                E.BANK_CARD, E.PHONE, E.CARD_HOLDER,
                E.DEPARTMENT, E.ID_SECTOR, E.STATUS, E.LOCATION,
                PERMISSION_GROUP_ID, G.NAME AS PERMISSION_GROUP
            FROM EMPLOYERS E
            LEFT JOIN PERMISSIONS_GROUP G ON (E.PERMISSION_GROUP_ID = G.ID)
        `);
        if (res.length) {
            const tempUserList = res.map(item => {
                return createUser(item);
            });
            userList = [...tempUserList];
        }
        return userList;
    } catch (error) {
        console.log(error);
        return [];
    }
}

const getUser = async (userName) => {
    try {
        const condidate = userList.find(item => item?.userName.toUpperCase() == userName.toUpperCase());
        if (condidate) return condidate;
        const res = await db.executeRequest(`
            SELECT
            E.ID, E.MGMT_PASS, E.NAME, E.FIRSTNAME, E.LASTNAME, E.MIDDLENAME,
            E.BANK_CARD, E.PHONE, E.CARD_HOLDER,
            E.DEPARTMENT, E.ID_SECTOR, E.STATUS, E.LOCATION,
            PERMISSION_GROUP_ID, G.NAME AS PERMISSION_GROUP
                FROM EMPLOYERS E
                LEFT JOIN PERMISSIONS_GROUP G ON (E.PERMISSION_GROUP_ID = G.ID)
                WHERE UPPER(E.NAME) = UPPER('${userName}')`);

        if (!res || res.length == 0) return null;                                                
        const [item] = res;                               
        const user = createUser(item);
        userList.push(user);
        return user;
    } catch (error) {
        console.log('Ошибка getUser', error);
        return null;
    }  
}

const getUserToID = async (id) => {
    try {
        const condidate = userList.find(item => item.id === id);
        if (condidate) return condidate;
        const [item] = await db.executeRequest(`
            SELECT
            E.ID, E.MGMT_PASS, E.NAME, E.FIRSTNAME, E.LASTNAME, E.MIDDLENAME,
            E.BANK_CARD, E.PHONE, E.CARD_HOLDER,
            E.DEPARTMENT, E.ID_SECTOR, E.STATUS, E.LOCATION,
            PERMISSION_GROUP_ID, G.NAME AS PERMISSION_GROUP
                FROM EMPLOYERS E
                LEFT JOIN PERMISSIONS_GROUP G ON (E.PERMISSION_GROUP_ID = G.ID)
                WHERE E.id = ${id}`);
        if (!item)  return null; 
        const user = createUser(item);
        userList.push(user);
        return user;
    } catch (error) {
        throw new Error('Get User To ID: ' + error.message);
    }
}

const createUser = options => {
    const user = new User({
        id:                     options.ID,
        password:               options.MGMT_PASS,
        userName:               options.NAME,
        firstName:              options.FIRSTNAME,
        lastName:               options.LASTNAME,
        middleName:             options.MIDDLENAME,
        departament:            options.DEPARTMENT,
        sectorId:               options.ID_SECTOR,
        status:                 options.STATUS,
        location:               options.LOCATION,
        permissionGroupId:      options.PERMISSION_GROUP_ID,
        permissionGroupName:    options.PERMISSION_GROUP,
        card:                   options.BANK_CARD,
        cardHolder:             options.CARD_HOLDER,
        phone:                  options.PHONE
    });
    return user;
}

module.exports = {
    getUser,
    getUserToID,
    getAllUsers,
    userList
}