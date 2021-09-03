const express = require("express");


const app = express();

const config = require('./config');
const {appPort} = config.app;

app.use(express.json({extended: true}));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
})

app.use(express.static(__dirname + "/public"))


config.routersAuth(app, '/api')

config.express(app);
config.routesPackages(app);
config.routesOrders(app);

app.listen(appPort, () => console.log(`Сервер запущен на порту ${appPort}`));


