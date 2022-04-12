import { SocketServive } from "../../services/socket-service";
import { GetSocketMessage } from "../../types/socket-message-types";
import { YugWebsocket } from "../../types/socket-types";
import { getComponentSamples, getEntityPreparationData, getEntitySamples } from "./engine-object";



const getActions = async (ws: YugWebsocket, service: SocketServive, msg: GetSocketMessage) => {
    try {
        switch (msg.action) {
            case '/sample-components':
                getComponentSamples({ ws, service, msg }); // Получение комонентов
                break;
            case '/sample-entities':
                getEntitySamples({ ws, service, msg }) // Получение шаблонов сущностей
                break;
            case '/formula-preparation-data':
                getEntityPreparationData({ ws, service, msg }) // Получение шаблонов сущностей
                break;
            default:
                break;
        }
    } catch (e) {
        service.sendError(ws, e, msg.headers)
    }
}

export default getActions;