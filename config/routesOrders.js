const {getAllOrders, getOneOrder} = require('../app/pools/orders');

module.exports = (app) => {
    app.get("/orders", getAllOrders);
    app.get("/orders/:id", getOneOrder);
};