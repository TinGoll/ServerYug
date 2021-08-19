const {getAllPackages, getOnePackages} = require('../app/pools/packages');

module.exports = (app) => {
    app.get("/packages", (req, res) => {
        res.send(`<h2>Страница всех заказов на упаковке</h2>`);
    });
    app.get("/packages/:id", (req, res) => {
        res.send(`<h2>Страница заказа № ${req.params.id} на упаковке</h2>`);
    });
};