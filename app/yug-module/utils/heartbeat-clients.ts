import { Server } from "ws";
import { InfoSocketMessage } from "../types/socket-message-types";
import { YugWebsocket } from "../types/socket-types";

export const heartbeat = (wss: Server) => {
  const interval = setInterval(function ping() {
    const clients = wss.clients as Set<YugWebsocket>;
    clients.forEach(function each(ws) {
      if (ws.data?.isAlive === false) return ws.terminate();
      ws.data!.isAlive = false;
      ws.ping();
    });
  }, 30000);

    wss.on("close", function close() {
    clearInterval(interval);
  });
};


export const testSocket = (wss: Server) => {
  const interval = setInterval(function ping() {
    const clients = wss.clients as Set<YugWebsocket>;
    clients.forEach(function each(ws) {
        try {
          if (!ws.data!.userData) ws.data!.userData = 1;
            const msg: InfoSocketMessage = {
              method: "info",
              message: "Тестовый таймер",
              testTimer: ws.data!.userData
            }
            ws.data!.userData += 1;
            ws.send(JSON.stringify(msg))
        } catch (error) {
          console.log(error);}
    });
  }, 10);

  wss.on("close", function close() {
    clearInterval(interval);
  });
};


