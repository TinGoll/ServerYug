const app               = require('./app');
const express           = require('./express');
const routesSettings    = require('./routesSettings');
const routesOrders      = require('./routesOrders');
const routesPackages    = require('./routesPackages');
const routersAuth       = require('./routersAuth');
const routesAtOrder     = require('./routesAtOrder');
const routesJournals    = require('./routesJournals');
const routesUsers       = require('./routesUsers');
const routesExtraData   = require('./routerExtraData');
const configDb          = require('./.firebirdDB/settingsDB');



module.exports = {
    app,
    express,
    routesSettings,
    routesOrders,
    routesPackages,
    routersAuth,
    routesAtOrder,
    routesJournals,
    routesUsers,
    routesExtraData,
    configDb
}