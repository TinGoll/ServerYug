import { Application } from 'express-serve-static-core';
import routes from '../app/routes';

export default (app: Application, url: string = '') => {
    app.use(`${url}/journals`, routes.journals);
};