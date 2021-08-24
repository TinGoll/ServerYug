const {getAllOrders, getOneOrder, getImageTest, getSampleForOrder} = require('../app/pools/orders');

module.exports = (app) => {
    app.get("/orders", getAllOrders);
    app.get("/orders/:id", getOneOrder);
    app.get("/testimage", getImageTest);
    app.get("/orders/sample/:id", getSampleForOrder);
};