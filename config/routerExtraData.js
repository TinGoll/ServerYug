const routes = require('../app/routes');

module.exports = (app, url) => {
    app.use(`${url}/extra-data`, routes.extraData);
};