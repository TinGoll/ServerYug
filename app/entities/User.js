module.exports = class User {
    id = 1;
    password = '$2a$10$OpRNbxmy8t.c5MgqeULpreN4VkQdgMGolZa1oRzVYSnRPzGFtzWhK';
    constructor (userName) {
        this.userName = userName;
    }
    setPasword (password) {this.password = password;}
    getPasword () {return this.password;}
    save () {return true;}
}