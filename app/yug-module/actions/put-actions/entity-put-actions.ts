import createEngine, { PropertyValue } from "yug-entity-system";
import orderChangeService from "../../services/orders/order-change-service";
import { GetSocketMessage, PutSocketMessage } from "../../types/socket-message-types";
import { YugWebsocketAction } from "../../types/socket-types";

interface ChangeEntity {
    componentKey: string;
    entityKey?: string;
    value: PropertyValue
}

/** Создание / изменение engine объекта - компонента или сущьности, определяется автоматически. */
export const changeEntityComponent = async ({ ws, service, msg }: YugWebsocketAction<PutSocketMessage<ChangeEntity>>) => {
    try {
        const { componentKey, entityKey, value } = msg.data;
        if (!componentKey) throw new Error("Не задан ключь свойства компонента.");
        if (!value) throw new Error("Значение некоррктно.");
        const data = await orderChangeService.changeProperty(componentKey, value, entityKey);
        
        service.sender<GetSocketMessage>(ws, {
            method: 'get',
            action: '/get-api-entity-to-key',
            headers: msg.headers,
            data: data
        });

        const engine = createEngine();
        engine.clearSamples()

    } catch (e) {
        console.log(e);
        service.sendError(ws, e);
    }
}