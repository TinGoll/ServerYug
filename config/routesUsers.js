const routes = require('../app/routes');

module.exports = (app, url) => {
    app.use(`${url}/users`, routes.users);
};