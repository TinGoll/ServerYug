import { SocketService } from "../../services/socket-service";
import { DeleteSocketMessage } from "../../types/socket-message-types";
import { YugWebsocket } from "../../types/socket-types";
import { deleteObject } from "./delete-object";


const deleteActions = async (ws: YugWebsocket, service: SocketService, msg: DeleteSocketMessage) => {
    try {
        switch (msg.action) {
            case '/delete-object':
                deleteObject({ ws, service, msg });
                break;
            default:
                break;
        }
    } catch (e) {
       service.sendError(ws, e, msg.headers)
    }
}

export default deleteActions;