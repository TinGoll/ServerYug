import { Server } from "ws";
import { aWss } from "../../..";
import { CloseSocketMessage, ConnectionSocketMessage, GetSocketMessage, OrderSocketMessage, SocketMessage, SuccessSocketMessage } from "../types/socket-message-types";
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

    /**
     * 
     * @param callback Функция, в которой формируется сообщение.
     * @param condition Функция, должна вернуть bool значение, если true, сообщение будет отправлено.
     */
    extendedMailing(callback: (ws: YugWebsocket) => Promise< SocketMessage | undefined>, condition?: (ws: YugWebsocket) => boolean) {
        try {
            const clients = aWss.clients as Set<YugWebsocket>;
            clients.forEach(async (client) => {
                const msg = await callback(client);
                if (msg) {
                    if (typeof callback === 'function') {
                        if (condition && typeof condition === 'function') {
                            if (condition(client)) client.send(JSON.stringify(msg));
                        }else{
                            client.send(JSON.stringify(msg));
                        }
                    }
                }
            });
        } catch (e) {
            throw e;
        }
    }

    public broadcast(msg: ConnectionSocketMessage): void;
    public broadcast(msg: CloseSocketMessage): void;
    public broadcast(msg: GetSocketMessage): void;
    public broadcast(msg: SuccessSocketMessage, roomKey?: { roomKey?: string }): void;
    public broadcast(msg: OrderSocketMessage, roomFilter: { roomKey?: string }): void;
    public broadcast(msg: SocketMessage, roomFilter: { roomKey?: string } = {}) {
        try {
            const message: string = JSON.stringify(msg);
            const clients = aWss.clients as Set<YugWebsocket>;
            const room = roomFilter.roomKey;
            clients.forEach(client => {
                if (room) {
                    if (client.data?.roomData.roomKey === room) {
                        client.send(message); 
                    }
                }else{
                   client.send(message); 
                }
                
            });
        } catch (error) {
            throw error;
        }
    }

}
