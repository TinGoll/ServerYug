import { WebSocket } from "ws";
import User from "../../entities/User";
import { SocketServive } from "../services/socket-service";
import { SocketMessage } from "./socket-message-types";

export interface YugWebsocket extends WebSocket {
    data?: YugWebsocketData;
}
export interface YugWebsocketData {
    isAlive: boolean;
    isAuth: boolean;
    ip: string;
    key: string;
    user?: User;
    token?: string;
    userData?: any
}

export interface YugWebsocketAction<T extends SocketMessage = SocketMessage> {
    ws: YugWebsocket;
    service: SocketServive;
    msg: T;
}
