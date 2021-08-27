
module.exports =  class Entity {
    static type = 'ENTITY';
    constructor (options) {
        this.id = options.id;
    }

    save () {return false;}
    load (id) {return false;}
}