import { Request, NextFunction } from "express";
import WebSocket from "ws";
import { aWss } from "../../..";
import ApiError from "../../exceptions/ApiError";
import { CloseSocketMessage, ConnectionSocketMessage, ConnectionSocketMessageToBot, SocketMessage } from "../types/socket-message-types";
import { YugWebsocket } from "../types/socket-types";
import { eventCloseMessage } from "../utils/event-close-message";


export default class SocketController {
    private connectionHandler(ws: YugWebsocket) {
        try {
            if (!ws) throw ApiError.BadRequest("Некорректный сокет.");
            SocketController.sendMessage(ws, {
                method: "connection",
                message: `Подключение установлено. Ожидаю токен в методе "connection". Твой ip: ${ws.data?.ip}, уникальный ключ: <${ws.data?.key}>`
            });
            SocketController.broadcastConnection(ws, {
                method: "connection",
                message: `Пользователь с ip ${ws.data?.ip}, ключ: <${ws.data?.key}> подключился`
            })
        } catch (e) {
            console.log(e);
        }
    }
    
    static async conntect(ws: YugWebsocket, req: Request, next: NextFunction) {
        try {
            /*****************Подключение нового пользователя *************** */
            const ip = req.socket.remoteAddress || '';
            ws.data = { ...ws.data, ip, isAlive: true, isAuth: false, key: Date.now().toString(16), rooms:[]}
            /*********************************************************** */
            ws.on('message', (data: string, isBinary: boolean) => {
                try {
                    let msg: SocketMessage;
                    try {
                        msg = JSON.parse(data)
                    } catch (e) {
                        return;
                    }
                    switch (msg.method) {
                        case "connection":
                            const connect = <ConnectionSocketMessageToBot>msg;
                            break;
                        default:
                            break;
                    }
                } catch (e) {
                    console.log(e);
                }
            });
            /*********************************************************** */
            ws.on('close', (code: number, reason: Buffer) => {
                ws.terminate();
                SocketController.broadcastConnection(ws, {
                    method: 'close',
                    message: `Пользователь ${ws.data?.user?.getUserName() || ws.data?.key} покинул(а) чат`,
                    reason: `${ SocketController.getCloseEventCode(code)}`
                })
            })
            ws.on('error', (ws: WebSocket, err: Error) => {
                console.log('error', ws, err);
            })
            ws.on('open', (ws: WebSocket) => {
                console.log('open', ws);
            })
        } catch (e) {
            console.log(e);
            next(e);
        }
    }
    /** Широковещательная рассылка */
    public static broadcastConnection(ws: YugWebsocket, msg: CloseSocketMessage): void;
    public static broadcastConnection(ws: YugWebsocket, msg: ConnectionSocketMessage): void;
    public static broadcastConnection(ws: YugWebsocket, msg: SocketMessage) {
        try {
            const message: string = JSON.stringify(msg)
            const clients = aWss.clients as Set<YugWebsocket>
            clients.forEach(client => {
                switch (msg.method) {
                    case "connection":
                        if (client.data?.isAuth) {
                            client.send(message);
                        }
                        break;
                    default:
                        break;
                }
            })
        } catch (e) {
            console.log(e);
        }
    }
    /** Отправка сообщения одному пользователю */
    public static sendMessage(ws: YugWebsocket, msg: Object) {
        try {
            const message = JSON.stringify(msg);
            ws.send(message);
        } catch (e) {
            console.log(e);
            
        }
    }
    /** Расшифровка кода, закрытия соединения */
    public static  getCloseEventCode(code: number): string {
        const msg = eventCloseMessage.find(e => e.code === code)
        return msg?.msg || 'Неизвестная причина отключения.'
    }
}

/*

            private msgBank: string[] = [];

            if (this.msgBank.length > 500) this.msgBank.shift()
            this.msgBank.push(String(data))
            getWss().clients?.forEach(function each(client) {
                client.send('🗣' + this.msgBank.join('') + '✍️', { binary: isBinary });
            });
            */