import Engine, { ApiEntityOptions } from "yug-entity-system";
import ApiError from "../../../exceptions/ApiError";
import componentModel from "../../db-models/component-model";
import { saveEntities } from "../../systems/entity-db-system";
import { EngineObjectData } from "../../types/socket-data-types";
import { GetSocketMessage, PostSocketMessage } from "../../types/socket-message-types";
import { YugWebsocketAction } from "../../types/socket-types";

/** Создание / изменение engine объекта - компонента или сущьности, определяется автоматически. */
export const addEngineObject = async ({ ws, service, msg }: YugWebsocketAction<PostSocketMessage<EngineObjectData>>) => {
    try {
        
        const data = {...msg.data};
        if (data?.type === "entity" || (data?.object as ApiEntityOptions)?.signature) {
            /** Если object - entity */

            console.time('save component-entity');
            const entityApiObject = data.object as ApiEntityOptions;
            const engine = new Engine('SERVER');
            const creator = engine.nomenclatureCreator()
            const entity = creator.create('nomenclature', { signature: { name: 'Тестовая род сущьность' } });
            const component = creator.create('component', 'geometry');
            component.setComponentDescription('Геометрия')
            .addProperty({ propertyName: 'height', propertyType: 'number', propertyDescription: 'Высота', propertyValue: 916 })
                .addProperty({ propertyName: 'width', propertyType: 'number', propertyDescription: 'Ширина', propertyValue: 396 })
                .addProperty({ propertyName: 'depth', propertyType: 'number', propertyDescription: 'Глубина', propertyValue: 21 })
                .addProperty({ propertyName: 'amount', propertyType: 'number' , propertyDescription: 'Кол-во', propertyValue: 5 });
            entity.addComponent(component);
            for (let i = 0; i < 100; i++) {
                const reb1 =  entity.produce({
                    signature: { name: 'ребьёнка ' + i },
                    components: component.build()
                })
            }

            const resultEntity = await saveEntities([entity.build()]);
            //console.log(resultEntity);
            console.timeEnd('save component-entity');
            /*
            
            const db = new FirebirdAdapter();
            const transaction = await db.transactionAdapter();
            console.time('save component-entity');
            const resultEntity = await entityModel.save(entity.build(), transaction);
            console.timeEnd('save component-entity');

            resultEntity.сhildEntities.forEach(e => {
                for (const comp of e.components) {
                    comp.propertyFormula = 'Тестовое обновление'
               }
            })

            console.time('update component-entity');
            const resultEntity2 = await entityModel.save(resultEntity, transaction);
            console.timeEnd('update component-entity');

            transaction.commitAndDetach();
            */
            
            // const resultEntity = await entityModel.save(entityApiObject);

            
            
            service.sender<PostSocketMessage<EngineObjectData>>(ws, {
                ...msg, data: { ...data, object: resultEntity[0] }
            })
            Engine.clear()
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
/** Получение шаблонов компонентов */
export const getComponentSamples = async ({ ws, service, msg }: YugWebsocketAction<GetSocketMessage>) => {
    try {
        
    } catch (e) {
        service.sendError(ws, e);
    }
}