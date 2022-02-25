import { ApiComponent } from "yug-entity-system";
import componentModel from "../../db-models/component-model";
import { GetSocketMessage } from "../../types/socket-message-types";
import { YugWebsocketAction } from "../../types/socket-types";

/** Получение шаблонов компонентов */
export const getComponentSamples = async ({ ws, service, msg }: YugWebsocketAction<GetSocketMessage>) => {
    try {
        const samples = await componentModel.getSamples();
        service.sender<GetSocketMessage<ApiComponent[]>>(ws, {
            method: 'get',
            action: '/sample-components',
            headers: msg.headers,
            data: samples
        })
    } catch (e) {
        service.sendError(ws, e);
    }
}

/** Получение шаблонов компонентов */
export const getEntitySamples = async ({ ws, service, msg }: YugWebsocketAction<GetSocketMessage>) => {
    try {

    } catch (e) {
        service.sendError(ws, e);
    }
}
