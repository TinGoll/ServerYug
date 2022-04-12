import { Server } from "ws";
import { aWss } from "../../..";
import { CloseSocketMessage, ConnectionSocketMessage, GetSocketMessage, SocketMessage } from "../types/socket-message-types";
import { YugWebsocket } from "../types/socket-types";

export class BroadcastSystem {
    private static instance: BroadcastSystem;
    private static wss: Server;
    constructor() {
        if (BroadcastSystem.instance) {
            return BroadcastSystem.instance;
        }
        BroadcastSystem.instance = this;
    }

    /**  broadcasts */

    public broadcast(ws: YugWebsocket, msg: ConnectionSocketMessage): void;
    public broadcast(ws: YugWebsocket, msg: CloseSocketMessage): void;
    public broadcast(ws: YugWebsocket, msg: GetSocketMessage): void;
    public broadcast(ws: YugWebsocket, msg: SocketMessage) {
        try {
            const message: string = JSON.stringify(msg);
            const clients = aWss.clients as Set<YugWebsocket>;
            clients.forEach(client => {
                client.send(message);
            })
        } catch (error) {
            throw error;
        }
    }

}
