import port from './port';
import express from './express';
import routesOrders from './routesOrders';
import routersAuth from './routersAuth';
import routesAtOrder from './routesAtOrder';
import routesJournals from './routesJournals';
import routesUsers from './routesUsers';
import routesExtraData from './routerExtraData';
import configDb from './.firebirdDB/settingsDB';

export default {
    port,
    express,
    routesOrders,
    routersAuth,
    routesAtOrder,
    routesJournals,
    routesUsers,
    routesExtraData,
    configDb
}