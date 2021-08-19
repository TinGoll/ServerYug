const app = require('./app');
const express = require('./express');
const routesSettings = require('./routesSettings');
const routesOrders = require('./routesOrders');
const routesPackages = require('./routesPackages');

module.exports = {
    app,
    express,
    routesSettings,
    routesOrders,
    routesPackages
}