import { SocketServive } from "../../services/socket-service";
import { GetSocketMessage } from "../../types/socket-message-types";
import { YugWebsocket } from "../../types/socket-types";


const getActions = async (ws: YugWebsocket, service: SocketServive, msg: GetSocketMessage) => {
    try {
        switch (msg.action) {
            case '/sample-components':
                break;
            default:
                break;
        }
    } catch (e) {
        service.sendError(ws, e, msg.headers)
    }
}

export default getActions;