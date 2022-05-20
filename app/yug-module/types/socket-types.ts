import { WebSocket } from "ws";
import User from "../../entities/User";
import { GetAllOrderData } from "../actions/order-action/orderController";
import { SocketService } from "../services/socket-service";
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
    userData?: any;
    roomData: {
        roomKey: string | null;
        getAllOrderData?: GetAllOrderData;
    }
}

export interface YugWebsocketAction<T extends SocketMessage = SocketMessage> {
    ws: YugWebsocket;
    service: SocketService;
    msg: T;
}
