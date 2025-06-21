import express, { NextFunction, Request, Response } from "express";

import { errorMiddleware } from "./app/middlewares/error-middleware";
import config from "./config/index";

import authRouter from "./app/routes/auth-router";
import timeRouter from "./app/routes/time-router";
import serviceRouter from "./app/routes/service-router";

import { OrderPlanSystem } from "./app/systems/order-plans-system";
import ExtraDataSystem from "./app/systems/extra-data-system";

export const app = express();


/******************************************************************************************* */
config.express(app);
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, HEAD, OPTIONS, POST, PATCH, PUT, DELETE"
  );
  
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

app.use(express.static(__dirname + "/public"));

app.use("/api", authRouter); // Авторизация и создание новых пользователей.
app.use("/api", timeRouter); // Получение времени.
app.use("/api", serviceRouter); // Сервисный роутер, для перезагрузки или отчистки кеша.

//config.routersAuth(app, '/api');

config.routesAtOrder(app, "/api");
config.routesJournals(app, "/api");
config.routesUsers(app, "/api");
config.routesExtraData(app, "/api");
config.routesOrders(app);

// Обработка ошибок.
app.use(errorMiddleware);

app.listen(config.port, async () => {
  try {
    console.log("Обновляем системы...");
    const planSystem = new OrderPlanSystem();
    await planSystem.refrash();
    const extraDataSystem = new ExtraDataSystem();
    await extraDataSystem.refrash();
    console.log("Обновление сисемы завершено.");
  } catch (e) {
    console.log("Ошибка обновления системы", e);
  }
  console.log(`Сервер запущен на порту ${config.port}`);
});

