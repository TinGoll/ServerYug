import { Server } from "ws";
import { YugWebsocket } from "../types/socket-types";

export const heartbeat = (wss: Server) => {
  const interval = setInterval(function ping() {
    const clients = wss.clients as Set<YugWebsocket>;
    clients.forEach(function each(ws) {
      if (ws.data.isAlive === false) {
         ws.terminate();
        console.log("terminate", ws);
        return;
        
      }
      ws.data.isAlive = false;
      ws.ping();
    });
  }, 30000);

    wss.on("close", function close() {
    clearInterval(interval);
  });
};

