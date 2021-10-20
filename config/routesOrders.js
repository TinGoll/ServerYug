const {getAllOrders, getOneOrder, getImageTest, getSampleForOrder, getDataHeaderForCreateOrder, orderExists} = require('../app/pools/orders');

module.exports = (app, url) => {
    app.get("/orders", getAllOrders);
    app.get("/orders/:id", getOneOrder);
    app.get("/orders/exists/:id", orderExists);
    app.get("/testimage", getImageTest);
    app.get("/orders/sample/:id", getSampleForOrder);
    app.get("/lists", getDataHeaderForCreateOrder);
};