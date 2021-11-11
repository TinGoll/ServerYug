import { Application } from "express";
import routes from '../app/routes';

export default (app: Application, url: string): void => {
    app.use(`${url}/at-order`, routes.atOrder);
};