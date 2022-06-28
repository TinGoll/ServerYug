import { NextFunction, Request } from "express";
import { WebSocket } from "ws";
import { Subscriber, SubscriberData } from "yug-entity-system-async";
import { IUser } from "../../types/user-types";
import engine from "../engine";
import socketService from "../services/socket-service";
import { BroadcastSystem } from "../systems/broadcast-system";

import { YugWebsocket } from "../types/socket-types";


class YugSocketController {
    constructor() {
        engine.start()
    }
    async connect(websocket: YugWebsocket | WebSocket, req: Request, next: NextFunction) {
        try {
            /** Регистрация нового пользователя */
            const ws = <YugWebsocket> websocket;
            const ip = req.socket.remoteAddress || '';
            const data: SubscriberData<string, IUser | null> ={
                id: undefined,
                isAlive: true,
                isAuth: false,
                ip,
                key: Date.now().toString(16),
                rooms: [],
                user: null
            }
            ws.data ={...data}
            ws.headers = {};
            ws.tempData = {};
            socketService.registration(ws).then(() => {
            });
        } catch (e) {
            next(e)
        }
    }
}

export default new YugSocketController();
