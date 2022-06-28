
import componentModel from "../../db-models/component-model";
import { deleteEntityToKey, getEntityToKey } from "../../systems/entity-db-system";
import { DeleteSocketMessage, ErrorSocketMessage, SuccessSocketMessage } from "../../types/socket-message-types";
import { YugWebsocketAction } from "../../types/socket-types";
import entityDbSysytem from "../../systems/entity-db-system";


/**
 * Удаление объекта из базы данных
 */
export const deleteObject = async({ ws, service, msg }: YugWebsocketAction<DeleteSocketMessage>) => {
    try {
        // const engine = createEngine();
        // const key = msg.data.key || '';
        // //const entity = await getEntityToKey(key); // Получаем удаляемую сущность.
        // if (!key) throw new Error("Не указан ключ, или не корректно сформирован пакет");
        // const type: 'cmp' | 'ent' = <'cmp' | 'ent'> key.split(':')[0];
        // let deletedKey;
        
        // switch (type) {
        //     case 'cmp':
        //         const deletedComponentKey = await componentModel.deleteComponentToKey(key)                
        //         deletedKey = deletedComponentKey;
        //         const ent = engine.getEntityByComponentKey(key);                
        //         if (ent) ent.deleteComponentPropertyToKey(key);
        //         break;
        //     case 'ent':
        //         const deletedEntityKey = await deleteEntityToKey(key);
        //         deletedKey = deletedEntityKey;
        //         engine.removeToKey(key);
        //         break;
        //     default:
        //         const spareDeletedComponentKey = await componentModel.deleteComponentToKey(key)
        //         const spareDeletedEntityKey = await deleteEntityToKey(key);
        //         deletedKey = spareDeletedComponentKey || spareDeletedEntityKey;
        //         engine.removeToKey(key);
        //         break;
        // }

        // if (deletedKey) {
        //     service.sender<SuccessSocketMessage<{key: string}>>(ws, {
        //         method:'success',
        //         message: `${type === 'ent' ? 'Объект' : 'Компонент'} успешно удалён.`,
        //         data: {key},
        //         headers: msg.headers
        //     });
        // }else {
        //     service.sender<ErrorSocketMessage>(ws, {
        //         method: 'error',
        //         message: `${type === 'ent' ? 'Объект' : 'Компонент'} не найден в базе данных`,
        //         headers: msg.headers,
        //         errors: []
        //     });
        // }

        // /** Широковещательная рассылка */
        // (async function () {
        //     if (type === 'ent') {
        //         const samples = await entityDbSysytem.getEntitySamples();
        //         const entitySamples = engine.loadEntities(samples || []);
        //         const entities = entitySamples;
        //         //const entities = entitySamples.map(e => e.assemble())
        //         service.broadcastsystem.broadcast({
        //             method: 'get',
        //             action: '/sample-entities',
        //             headers: msg.headers,
        //             data: entities
        //         });
        //     }

        //     if (type === 'cmp') {
        //         const sampleComponents = await componentModel.getSamples();
        //         const components = sampleComponents;
        //         service.broadcastsystem.broadcast({
        //             method: 'get',
        //             action: '/sample-components',
        //             headers: msg.headers,
        //             data: { components }
        //         });
        //     }
        // })();

    } catch (e) {
        service.sendError(ws, e, msg.headers)
    }
}