import { SocketService } from "../../services/socket-service";
import { GetSocketMessage } from "../../types/socket-message-types";
import { YugWebsocket } from "../../types/socket-types";
import { getComponentSamples, getEntityPreparationData, getEntitySamples } from "./engine-object";
import { getApiEntityToKey, getSampleNames } from "./order-actions";



const getActions = async (ws: YugWebsocket, service: SocketService, msg: GetSocketMessage) => {
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
            case '/get-sample-names':
                getSampleNames({ ws, service, msg }); // Получение списка имен шаблонов
                break;
            case '/get-api-entity-to-key':
                getApiEntityToKey({ ws, service, msg }); // Получение списка имен шаблонов
                break;
            default:
                break;
        }
    } catch (e) {
        service.sendError(ws, e, msg.headers)
    }
}

export default getActions;