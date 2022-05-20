import { ApiEntity } from "yug-entity-system";
import orderSampleService, { SampleNames } from "../../services/orders/order-sample-service";
import { GetSocketMessage } from "../../types/socket-message-types";
import { YugWebsocketAction } from "../../types/socket-types";


export const getSampleNames = async ({ ws, service, msg }: YugWebsocketAction<GetSocketMessage<SampleNames>>) => {
    try {
        const { key, name, category, note } = msg.data || {};
        const names = await orderSampleService.getSampleNames({ key, name, category, note });
        
        service.sender<GetSocketMessage<SampleNames[]>>(ws, {
            method: 'get',
            action: '/get-sample-names',
            headers: msg.headers,
            data: names
        });
    } catch (e) {
        console.log(e);
        service.sendError(ws, e);
    }
}

export const getApiEntityToKey = async({ ws, service, msg }: YugWebsocketAction<GetSocketMessage<{key: string}>>) => {
    try {
        const { key } = msg.data||{};
        if (!key) throw new Error("Некорректный ключ сущности.")
        const apiData = await orderSampleService.getApiEntityToKey(key);
        service.sender<GetSocketMessage<ApiEntity[]>>(ws, {
            method: 'get',
            action: '/get-api-entity-to-key',
            headers: msg.headers,
            data: apiData
        });
    } catch (e) {
        console.log(e);
        service.sendError(ws, e);
    }
}

export const getEntityCategories = async ({ ws, service, msg }: YugWebsocketAction<GetSocketMessage>) => {
    try {
        const categories = await orderSampleService.getEntityCategories();
        service.sender<GetSocketMessage<string[]>>(ws, {
            method: 'get',
            action: '/get-entity-categories',
            headers: msg.headers,
            data: categories
        });
    } catch (e) {
        console.log(e);
        service.sendError(ws, e);
    }
}
