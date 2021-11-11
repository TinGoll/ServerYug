import orders from '../app/pools/orders'
import {Application} from 'express';


export default (app: Application, url: string = ''): void => {
    app.get("/orders", orders.getAllOrders);
    app.get("/orders/:id", orders.getOneOrder);
    app.get("/orders/exists/:id", orders.orderExists);
    app.get("/testimage", orders.getImageTest);
    app.get("/orders/sample/:id", orders.getSampleForOrder);
    app.get("/lists", orders.getDataHeaderForCreateOrder);
};