const routes = require('../app/routes');

module.exports = (app, url) => {
    app.use(`${url}/at-order`, routes.atOrder);
};