const { User }  = require("../entities");
const db        = require('../dataBase');
let userList    = [];

const getUser = async (userName) => {
    const condidate = userList.find(item => item.userName.toUpperCase() == userName.toUpperCase());
    if (condidate) return condidate;
    const res = await db.executeRequest(`select E.ID, E.MGMT_PASS, E.NAME, E.DEPARTMENT, E.ID_SECTOR, E.STATUS, E.LOCATION, PERMISSION_GROUP_ID
                                                    from EMPLOYERS E where UPPER(E.NAME) = '${userName.toUpperCase()}'`);
    if (!res || res.length == 0) return null;                                                
    const [item] = res;                               
    const user = new User({
        id: item.ID,
        password: item.MGMT_PASS,
        userName: item.NAME,
        departament: item.DEPARTMENT,
        sectorId: item.ID_SECTOR,
        status: item.STATUS,
        location: item.LOCATION,
        permissionGroupId: item.PERMISSION_GROUP_ID
    });
    userList.push(user);
    return user;
}

const getUserToID = async (id) => {
    try {
        const condidate = userList.find(item => item.id === id);
        if (condidate) return condidate;
        const [item] = await db.executeRequest(`select E.ID, E.MGMT_PASS, E.NAME, E.DEPARTMENT, E.ID_SECTOR, E.STATUS, E.LOCATION, PERMISSION_GROUP_ID
                                                        from EMPLOYERS E where E.id = ${id}`);
        if (!item)  return null;                                                                
        const user = new User({
            id: item.ID,
            password: item.MGMT_PASS,
            userName: item.NAME,
            departament: item.DEPARTMENT,
            sectorId: item.ID_SECTOR,
            status: item.STATUS,
            location: item.LOCATION,
            permissionGroupId: item.PERMISSION_GROUP_ID
        });
        userList.push(user);
        return user;
    } catch (error) {
        throw new Error('Get User To ID: ' + error.message);
    }
}

module.exports = {
    getUser,
    getUserToID,
    userList
}