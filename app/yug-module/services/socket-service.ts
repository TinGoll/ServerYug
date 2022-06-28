import { WebSocket } from "ws";
import ApiError from "../../exceptions/ApiError";
import connectionAction from "../actions/connetc-actions";
import deleteActions from "../actions/delete-actions";
import getActions from "../actions/get-actions";
import orderActions from "../actions/order-action";
import postActions from "../actions/post-actions";
import putActions from "../actions/put-actions";
import { BroadcastSystem } from "../systems/broadcast-system";
import { ConnectionSocketMessage, DeleteSocketMessage, ErrorSocketMessage, GetSocketMessage, InfoSocketMessage, OrderSocketMessage, PostSocketMessage, PutSocketMessage, SocketMessage } from "../types/socket-message-types";
import { YugWebsocket } from "../types/socket-types";
import { errorMessage } from "../utils/error-messages";
import { eventCloseMessage } from "../utils/event-close-message";

export class SocketService {
    broadcastsystem: BroadcastSystem;
    constructor () {
        this.broadcastsystem = new BroadcastSystem();
    }
    /** Регистрация клиента */
    async registration (ws: YugWebsocket) {
        try {
            const info: InfoSocketMessage = {
                method: 'info',
                message: `Подключение установлено, ожидаю токен доступа`
            }
            ws.send(JSON.stringify(info));
            ws.on('close', this.closeHandler(this));
            ws.on('error', this.errorHandler(this));
            ws.on('message', this.messageHandler(this));
            ws.on('pong', this.heartbeat(this));
        } catch (e) {
            this.sendError(ws, e);
        }
    }
    /** Причина закрытия сокета */
    getCloseEventCode(code: number): string {
        const msg = eventCloseMessage.find(e => e.code === code)
        return msg?.msg || 'Неизвестная причина отключения.'
    }
    /** Основной метод генерации ошибок */
    sendError(ws: YugWebsocket, error: unknown, headers: object = {}) {
        try {
            const err: ErrorSocketMessage = {
                method: "error",
                headers,
                message: "",
                errors: []
            }
            if (error instanceof Error) {
                err.message = error.message;
            }
            if (error instanceof ApiError) {
                err.message = error.message;
                err.errors = [...error.errors];
            }

            this.sender<ErrorSocketMessage>(ws, err);
        } catch (e) {
            console.log(e);
        }
    }
    /** Основной метод ответа клиенту. */
    sender<T extends SocketMessage = SocketMessage>(ws: YugWebsocket, msg: T) {
        try {
            const message = JSON.stringify(msg);
            ws.send(message);
        } catch (e) {console.log(e);}
    }
    /** Проверка серцебиения клиента. */
    heartbeat(service: SocketService) {
        return function (this: YugWebsocket | WebSocket) {
            (<YugWebsocket>this).data.isAlive = true;
        }
    }
    /** Отлавливает события, когда клиент, отключился */
    closeHandler(service: SocketService)  {
        return function (this: YugWebsocket | WebSocket, code: number, reason: Buffer) {
           service.broadcastsystem.broadcast( {
               method: "close",
               message: `${(<YugWebsocket>this).data?.user?.getUserName() || (<YugWebsocket>this).data.key} отавлился.`,
               reason: service.getCloseEventCode(code)
           });
           this.terminate();
        }
    }
    /** Оталавливает события, когда клиент возвратил ошибку */
    errorHandler (service: SocketService) {
        return function (this: YugWebsocket | WebSocket, err: Error) {
            try {
                console.log('SocketService ERROR', err.message);
            } catch (e) {
                console.log(e);
            }
        }
    }
    /** Отлавливает событие, когда клиент отправил пакет. */
    messageHandler (service: SocketService) {
        return function (this: YugWebsocket | WebSocket, message: string, isBinary: boolean) {
            try {
                /*********************************************************************************************************************************** */
                //                                      Предварительная обработка пакета.
                let msg: SocketMessage;
                /** Обработка сообщения */
                try { msg = JSON.parse(message) } catch (e) { 
                    service.sender((<YugWebsocket>this), errorMessage.get("incorrect message", [message]));
                    return;
                }
                /** Если в пакете отсутвует поле метод */
                if (!msg.method) return service.sender((<YugWebsocket>this), errorMessage.get("incorrect message", ['Пакет должен содержать method', message]));
                /** Если пользователь не авторизован и метод доступа не конект. */
                if (!(<YugWebsocket>this).data.isAuth && msg.method !== 'connection') return service.sender((<YugWebsocket>this), errorMessage.get("not registered"));
                (<YugWebsocket>this).headers = msg.headers || {};

                /*********************************************************************************************************************************** */
                // console.log('*****************************************************');
                // console.log('******************* ORGIN MSG ***********************');
                // console.log(JSON.stringify(msg, null, 2));
                
                // console.log('*****************************************************');
                // console.log('*****************************************************');
                
                switch (msg.method) {
                    case "connection":
                        connectionAction((<YugWebsocket>this), service, <ConnectionSocketMessage>msg);
                        break;
                    case 'post':
                        postActions((<YugWebsocket>this), service, <PostSocketMessage>msg);
                        break;
                    case 'put':
                        putActions((<YugWebsocket>this), service, <PutSocketMessage>msg);
                        break;
                    case 'get':
                        getActions((<YugWebsocket>this), service, <GetSocketMessage>msg);
                        break; 
                    case 'order':
                        orderActions((<YugWebsocket>this), service, <OrderSocketMessage>msg);
                        break; 
                    case 'delete':
                        deleteActions((<YugWebsocket>this), service, <DeleteSocketMessage>msg);
                        break;    
                    default:
                        break;
                }
            } catch (e) {
                service.sendError((<YugWebsocket>this), e);
            }
        }
    }
}

export default new SocketService();