import { NextFunction, Request } from "express";
import socketService from "../services/socket-service";
import { BroadcastSystem } from "../systems/broadcast-system";

import { YugWebsocket, YugWebsocketData } from "../types/socket-types";

class YugSocketController {
    constructor() {}
    async connect(ws: YugWebsocket, req: Request, next: NextFunction) {
        try {
            /** Регистрация нового пользователя */
            const ip = req.socket.remoteAddress || '';
            const data: YugWebsocketData = {
                isAlive: true,
                isAuth: false,
                key: Date.now().toString(16),
                ip
            }
            ws.data = data;
            socketService.registration(ws);
        } catch (e) {
            next(e)
        }
    }
}

export default new YugSocketController();
