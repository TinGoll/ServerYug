import Engine, { ApiComponent } from "yug-entity-system";
import { ApiEntity } from "yug-entity-system/dist/types/entity-types";
import ApiError from "../../../exceptions/ApiError";
import componentModel from "../../db-models/component-model";
import { saveEntities } from "../../systems/entity-db-system";
import { EngineObjectData } from "../../types/socket-data-types";
import { PostSocketMessage } from "../../types/socket-message-types";
import { YugWebsocketAction } from "../../types/socket-types";

/** Создание / изменение engine объекта - компонента или сущьности, определяется автоматически. */
export const addEngineObject = async ({ ws, service, msg }: YugWebsocketAction<PostSocketMessage<EngineObjectData>>) => {
    try {
        /*
        const engine = new Engine();
        const creator = engine.creator();
        const component = creator.create('component', 'geometry', { componentDescription: 'Геометрия' });
        component
            .addProperty({ propertyName: 'height', propertyType: 'number', propertyDescription: 'Высота', propertyValue: 0 })
            .addProperty({ propertyName: 'width', propertyType: 'number', propertyDescription: 'Ширина', propertyValue: 0 })
            .addProperty({ propertyName: 'amount', propertyType: 'number', propertyDescription: 'Кол-во', propertyValue: 0 });

        const entity = creator.create('entity', 'Фасад витрина', { category: 'Фасад', note: 'Фасад глухой - содержит 4 профиля и 1 филёнку' });
        const entityProfile1 = creator.create('entity', 'Профиль левый', { category: 'Профиль',}).addComponent(component.build());
        const entityProfile2 = creator.create('entity', 'Профиль правый', { category: 'Профиль', }).addComponent(component.build());
        const entityProfile3 = creator.create('entity', 'Профиль нижний', { category: 'Профиль', }).addComponent(component.build());
        const entityProfile4 = creator.create('entity', 'Профиль верхный', { category: 'Профиль',}).addComponent(component.build());

        entity.addChild(entityProfile1).addChild(entityProfile2).addChild(entityProfile3).addChild(entityProfile4)

        entity.addComponent(component.build());
        */
        const engine = new Engine();
        const creator = engine.creator();
        const data: EngineObjectData = msg.data;
        creator.loadObjects(data.object);

        if (data?.type === "entity" || (data?.object as ApiEntity[]) && (<ApiEntity> data?.object[0])?.name ) {
            /** Если object - entity */
            const entityApiObject = data.object as ApiEntity[];
            const resultEntity = await saveEntities(entityApiObject);
            service.sender<PostSocketMessage<EngineObjectData>>(ws, {
                ...msg, data: { ...data, object: resultEntity }
            });
        } else if ((data?.type === 'component' && Array.isArray(data?.object)) || Array.isArray(data?.object) && (<ApiComponent> data.object[0]).componentName) {
            /** Если object - Component */
            const resultComponent = await componentModel.save(<ApiComponent[]> data.object);
            service.sender<PostSocketMessage<EngineObjectData>>(ws, {
                ...msg, data: { ...data, object: resultComponent }
            });
        } else {
            throw ApiError.BadRequest('Не удалось автоматически определить тип объекта. Используй type что бы конкретно указать тип.');
        }
    } catch (e) {
        console.log(e);
        service.sendError(ws, e);
    }
}
