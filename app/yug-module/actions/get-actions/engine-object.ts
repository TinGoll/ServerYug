import Engine from "yug-entity-system";
import { ApiEntity, Components } from "yug-entity-system/dist/types/entity-types";
import componentModel from "../../db-models/component-model";
import { GetSocketMessage } from "../../types/socket-message-types";
import { YugWebsocketAction } from "../../types/socket-types";
import entityDbSysytem from "../../systems/entity-db-system";

/** Получение шаблонов компонентов */
export const getComponentSamples = async ({ ws, service, msg }: YugWebsocketAction<GetSocketMessage>) => {
    try {
        const samples = await componentModel.getSamples();
        const engine = new Engine();
        const creator = engine.creator(); 
        creator.loadTemplateComponents(samples);
        const components =  creator.getComponents();
        const objectComponents = creator.componentConverterArrayToObject(components)
        service.sender<GetSocketMessage<Components>>(ws, {
            method: 'get',
            action: '/sample-components',
            headers: msg.headers,
            data: objectComponents
        })
    } catch (e) {
        service.sendError(ws, e);
    }
}

/** Получение шаблонов компонентов */
export const getEntitySamples = async ({ ws, service, msg }: YugWebsocketAction<GetSocketMessage>) => {
    try {
        const samples = await entityDbSysytem.getEntitySamples();
        const entities = entityBuild(samples)
        //console.log(JSON.stringify(entities, null, 5));
        service.sender<GetSocketMessage<Entities[]>>(ws, {
            method: 'get',
            action: '/sample-entities',
            headers: msg.headers,
            data: entities
        })

    } catch (e) {
        service.sendError(ws, e);
    }
}
/** Временно */
const entityBuild = (apiEnts: ApiEntity[]): Entities[] => {
    const arr: Entities[] = [];
    const parents = apiEnts.filter(p => !p.parentKey);
    for (const parent of parents) {
        arr.push(entityConvert(parent, apiEnts))
    }
    return arr;
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
