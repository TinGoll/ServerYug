import Engine, { ApiComponent, ApiEntity, Entity } from "yug-entity-system";
import componentModel from "../../db-models/component-model";
import { GetSocketMessage, SuccessSocketMessage } from "../../types/socket-message-types";
import { YugWebsocketAction } from "../../types/socket-types";
import entityDbSysytem, { getEntityToKey, getGrandfather } from "../../systems/entity-db-system";
import createEngine from "yug-entity-system";

/** Получение шаблонов компонентов */
export const getComponentSamples = async ({ ws, service, msg }: YugWebsocketAction<GetSocketMessage>) => {
    try {
        const samples = await componentModel.getSamples();
        const components = samples;
       
        service.sender < GetSocketMessage < {components: ApiComponent[]}>>(ws, {
            method: 'get',
            action: '/sample-components',
            headers: msg.headers,
            data: {components}
        })
        
    } catch (e) {
        service.sendError(ws, e);
    }
}

/** Получение шаблонов компонентов */
export const getEntitySamples = async ({ ws, service, msg }: YugWebsocketAction<GetSocketMessage>) => {
    try {
        const engine = createEngine();
        engine.clearEntity();
        const samples = await entityDbSysytem.getEntitySamples();   

        //const entitySamples = engine.loadAndReturning(samples||[]);

        //const entities = entitySamples.map(e => e.assemble())
        const entities = engine.loadEntities(samples || []);
        service.sender<GetSocketMessage<ApiEntity[]>>(ws, {
            method: 'get',
            action: '/sample-entities',
            headers: msg.headers,
            data: entities
        });
        engine.clearEntity();
    } catch (e) {
        service.sendError(ws, e);
    }
}

/** Получение шаблонов компонентов */
export const getEntityPreparationData= async ({ ws, service, msg }: YugWebsocketAction<GetSocketMessage>) => {
    try {
        let fatherKey: string | undefined = undefined;
        const engine = createEngine();
        engine.clearEntity();

        const grandfatherApi = await getGrandfather(msg.data.key);
        const componentKey = msg.data.componentKey;
        if (!componentKey) throw new Error("Не задан ключ компонента")

        if (grandfatherApi) {
            fatherKey = grandfatherApi.key;
        }
        const apiEntity = await getEntityToKey(fatherKey || msg.data.key); //
        if (!apiEntity) throw new Error("Сушность не найдена в базе данных");

        const [entity] =  engine.loadAndReturning(apiEntity);
        const preparationData = entity.getPreparationData(componentKey) ;

        service.sender<GetSocketMessage>(ws, {
            method: 'get',
            action:  '/formula-preparation-data',
            headers: msg.headers,
            data: {
                ...msg.data,
                preparationData,
            }
        });
    } catch (e) {
        service.sendError(ws, e);
    }
}

const entityConvert = (entity: ApiEntity, arr: ApiEntity[] = []): Entities => {
    const child = arr.filter(ch => ch.parentId === entity.id);
    const echild: Entities[] = [];
    for (const ch of child) {
        const ech = entityConvert(ch, arr);
        echild.push(ech)
    }
    return {
        ...entity,
        childEntities: [...echild]
    }
}

interface Entities extends ApiEntity {
    childEntities: Entities[]
}
