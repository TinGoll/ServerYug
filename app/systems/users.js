const { User } = require("../entities")

const getUser = (userName) => {
    return new User(userName);
}

module.exports = {
    getUser
}