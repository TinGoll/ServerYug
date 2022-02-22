import { SocketServive } from "../../services/socket-service";
import { GetSocketMessage } from "../../types/socket-message-types";
import { YugWebsocket } from "../../types/socket-types";
import { getComponentSamples } from "../post-actions/engine-object";


const getActions = async (ws: YugWebsocket, service: SocketServive, msg: GetSocketMessage) => {
    try {
        switch (msg.action) {
            case '/sample-components':
                getComponentSamples({ ws, service, msg }); // Получение комонентов
                break;
            default:
                break;
        }
    } catch (e) {
        service.sendError(ws, e, msg.headers)
    }
}

export default getActions;