import Engine, { ApiComponent, ApiEntityOptions } from "yug-entity-system";
import ApiError from "../../../exceptions/ApiError";
import componentModel from "../../db-models/component-model";
import { saveEntities } from "../../systems/entity-db-system";
import { EngineObjectData } from "../../types/socket-data-types";
import { PostSocketMessage } from "../../types/socket-message-types";
import { YugWebsocketAction } from "../../types/socket-types";

/** Создание / изменение engine объекта - компонента или сущьности, определяется автоматически. */
export const addEngineObject = async ({ ws, service, msg }: YugWebsocketAction<PostSocketMessage<EngineObjectData>>) => {
    try {
        const data = {...msg.data};
        if (data?.type === "entity" || (data?.object as ApiEntityOptions)?.signature) {
            /** Если object - entity */
            console.time('save component-entity');
            const entityApiObject = data.object as ApiEntityOptions;
            const resultEntity = await saveEntities([entityApiObject]);
            console.timeEnd('save component-entity');
            service.sender<PostSocketMessage<EngineObjectData>>(ws, {
                ...msg, data: { ...data, object: resultEntity[0] }
            });
        } else if ((data?.type === 'component' && Array.isArray(data?.object)) || Array.isArray(data?.object) && data.object[0].componentName) {
            /** Если object - Component */
            const resultComponent = await componentModel.save(data.object);
            service.sender<PostSocketMessage<EngineObjectData>>(ws, {
                ...msg, data: { ...data, object: resultComponent }
            });
        } else {
            throw ApiError.BadRequest('Не удалось автоматически определить тип объекта. Используй type что бы конкретно указать тип.');
        }
    } catch (e) {
        service.sendError(ws, e);
    }
}
