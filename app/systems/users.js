const { User } = require("../entities");
const db = require('../dataBase');
let userList = [];

const getUser = async (userName) => {
    
    const condidate = userList.find(item => item.userName.toUpperCase() == userName.toUpperCase());
    if (condidate) return condidate;
    const res = await db.executeRequest(`select E.ID, E.MGMT_PASS, E.NAME, E.DEPARTMENT, E.STATUS, E.LOCATION 
                                                    from EMPLOYERS E where UPPER(E.NAME) = '${userName.toUpperCase()}'`);
    if (!res || res.length == 0) return null;                                                
    const [item] = res;                               
    const options = {
            id: item.ID,
            password: item.MGMT_PASS,
            userName: item.NAME,
            departament: item.DEPARTMENT,
            status: item.STATUS,
            location: item.LOCATION,
            permissionGroup: item.PERMISSION_GROUP
    }

    const user = new User(options);
    userList.push(user);
    return user;
}

module.exports = {
    getUser,
    userList
}