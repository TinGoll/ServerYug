import { WebSocket } from "ws";
import { Subscriber } from "yug-entity-system-async";
import User from "../../entities/User";
import { IUser } from "../../types/user-types";
import { GetAllOrderData } from "../actions/order-action/interfaces";
import { SocketService } from "../services/socket-service";
import { SocketMessage } from "./socket-message-types";



export interface YugWebsocket extends Subscriber<string, IUser | null>, WebSocket {
    headers: object;
    tempData: SocketTempData;
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

interface SocketTempData {
    getAllOrderData?: GetAllOrderData;
}

export interface YugWebsocketAction<T extends SocketMessage = SocketMessage> {
    ws: YugWebsocket;
    service: SocketService;
    msg: T;
}
