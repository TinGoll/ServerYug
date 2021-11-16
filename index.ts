import express, { Application, NextFunction, Request, Response } from 'express';
import { errorMiddleware } from './app/middlewares/error-middleware';
import config  from './config/index'

const app: Application = express();

config.express(app);

app.use((req: Request, res: Response, next: NextFunction) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, PATCH, DELETE');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS, POST, PATCH, PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
})
app.use(express.static(__dirname + "/public"))

config.routersAuth(app, '/api');
config.routesAtOrder(app, '/api');

config.routesJournals(app, '/api');
config.routesUsers(app, '/api');
config.routesExtraData(app, '/api');
config.routesOrders(app);

// Обработка ошибок.
app.use(errorMiddleware);

app.listen(config.port, () => {
    console.log(`Сервер запущен на порту ${config.port}`);
});


