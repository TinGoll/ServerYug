import { SocketService } from "../../services/socket-service";
import { PutSocketMessage } from "../../types/socket-message-types";
import { YugWebsocket } from "../../types/socket-types";
import { changeEntityComponent } from "./entity-put-actions";



const putActions = async (ws: YugWebsocket, service: SocketService, msg: PutSocketMessage) => {
    try {
        switch (msg.action) {
            case '/change-entity-component':
                changeEntityComponent({ ws, service, msg }); // Добавление нового комопнента или номенклатуры.
                break;
            default:
                break;
        }
    } catch (e) {
        service.sendError(ws, e, msg.headers)
    }
}

export default putActions;