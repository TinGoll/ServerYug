import { KeyType } from "yug-entity-system";
import componentModel from "../../db-models/component-model";
import { deleteEntityToKey } from "../../systems/entity-db-system";
import { DeleteSocketMessage, ErrorSocketMessage, SuccessSocketMessage } from "../../types/socket-message-types";
import { YugWebsocketAction } from "../../types/socket-types";

/**
 * Удаление объекта из базы данных
 */
export const deleteObject = async({ ws, service, msg }: YugWebsocketAction<DeleteSocketMessage>) => {
    try {
        const key = msg.data.key || '';
        const type: KeyType = <KeyType> key.split(':')[0];
        let deletedKey;
        switch (type) {
            case 'cmp':
                const deletedComponentKey = await componentModel.deleteComponentToKey(key)
                deletedKey = deletedComponentKey;
                break;
            case 'ent':
                const deletedEntityKey = await deleteEntityToKey(key);
                deletedKey = deletedEntityKey;
                break;
            default:
                const spareDeletedComponentKey = await componentModel.deleteComponentToKey(key)
                const spareDeletedEntityKey = await deleteEntityToKey(key);
                deletedKey = spareDeletedComponentKey || spareDeletedEntityKey;
                break;
        }
        if (deletedKey) {
            service.sender<SuccessSocketMessage<{key: string}>>(ws, {
                method:'success',
                message: `${type === 'ent' ? 'Объект' : 'Компонент'} успешно удалён.`,
                data: {key},
                headers: msg.headers
            });
        }else {
            service.sender<ErrorSocketMessage>(ws, {
                method: 'error',
                message: `${type === 'ent' ? 'Объект' : 'Компонент'} не найден в базе данных`,
                errors: []
            });
        }

    } catch (e) {
        service.sendError(ws, e, msg.headers)
    }
}