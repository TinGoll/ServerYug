
import componentModel from "../../db-models/component-model";
import { getEntityToKey, getGrandfather, saveEntities } from "../../systems/entity-db-system";
import { EngineBuildtData, EngineObjectData } from "../../types/socket-data-types";
import { GetSocketMessage, PostSocketMessage, SuccessSocketMessage } from "../../types/socket-message-types";
import { YugWebsocketAction } from "../../types/socket-types";
import entityDbSysytem from "../../systems/entity-db-system";
import { saveComponents } from "../../systems/component-db-system";
import { ApiComponent, ApiEntity } from "yug-entity-system-async";

enum TypeTransaction {
    NONE = 0,
    CLONE = 1,
    CREATING_COMPONENT = 2,
    CREATING_ENTITY = 3,
    ATTACHMENT_COMPONENT = 4,
    ATTACHMENT_ENTITY  = 5,
    CHANGE_PROPERTY = 6,
}

/** Регистрация  */
export const registrationObject = async ({ ws, service, msg }: YugWebsocketAction<PostSocketMessage<EngineObjectData>>) => {
    try {
        const object = msg.data.object;
        // for (const o of object) {
        //     Engine.registration(o);
        // }
        
        service.sender<SuccessSocketMessage<{object: ApiComponent[] | ApiEntity[]}>>(ws, {
            method: 'success',
            message: `Ключи успешно присвоены.`,
            data: { object },
            headers: msg.headers
        });

    } catch (e) {
        console.log(e);
        service.sendError(ws, e);
    }
}

/** Создание / изменение engine объекта - компонента или сущьности, определяется автоматически. */
export const addEngineObject = async ({ ws, service, msg }: YugWebsocketAction<PostSocketMessage<EngineObjectData>>) => {
    try {
        throw new Error("Данный пакет больше не используется.")
    } catch (e) {
        console.log(e);
        service.sendError(ws, e);
    }
}

/** Универсальный метод создания и сборки объекта */
export const constructionObject = async ({ ws, service, msg }: YugWebsocketAction<PostSocketMessage<EngineBuildtData>>) => {
    try {
        // /** Тип транзакции */
        // let transaction: TypeTransaction = TypeTransaction.NONE;
        // const engine = createEngine();
        // engine.clearSamples();

        // const key = msg.data?.key;
        // const attachmentKeys = msg.data?.attachmentKeys; // пока не задействованно.
        // const attachment = msg.data?.attachment;
        // const object = msg.data?.object;
        // const cloneKey = msg.data.cloneKey;

        // // Результат работы.
        // let result: ApiEntity[] | ApiComponent[] | undefined = undefined;

        // // Если создание комопнента.
        // if (!key && !attachmentKeys && !attachment && 
        //     !cloneKey && object && (<ApiComponent>object[0]).propertyName) {
        //         let isChange: boolean = false;
        //         ((<ApiComponent[]> object)||[]).forEach(c => {
        //             if (c.entityKey) isChange = true;
        //         })
        //     if (isChange) transaction = TypeTransaction.CHANGE_PROPERTY;
        //     else transaction = TypeTransaction.CREATING_COMPONENT;   
        // }
        // // Если создание сущности.
        // if (!key && !attachmentKeys && !attachment &&
        //     !cloneKey && object && (<ApiEntity>object[0]).name)
        //     transaction = TypeTransaction.CREATING_ENTITY;

        // // Вложение компонента в сущность.
        // if (!attachmentKeys && !cloneKey && !object && key && 
        //     attachment && (<ApiComponent>attachment[0]).propertyName)
        //     transaction = TypeTransaction.ATTACHMENT_COMPONENT;

        // // Вложение сущности в сущность.
        // if (!attachmentKeys && !cloneKey && !object && key &&
        //     attachment && (<ApiEntity>attachment[0]).name)
        //     transaction = TypeTransaction.ATTACHMENT_ENTITY;

        // if (!key && !attachmentKeys && !attachment && object && (<ApiEntity>object[0]).name && cloneKey)
        //     transaction = TypeTransaction.CLONE;
        
        // if (transaction === TypeTransaction.NONE) throw new Error("Неопределен тип желаемой транзакции.");
        // // ****************************************************************************************************
        // // ********************************  Выполняем транзакцию  ********************************************
        // // ****************************************************************************************************

        // switch (transaction) {
        //     case TypeTransaction.CREATING_COMPONENT:
        //         console.log('*******************************');
        //         console.log('*******CREATING_COMPONENT******');
        //         console.log('*******************************');
        //         break;
        //     case TypeTransaction.CREATING_ENTITY:
        //         console.log('*******************************');
        //         console.log('********CREATING_ENTITY********');
        //         console.log('*******************************');
        //         break;
        //     case TypeTransaction.ATTACHMENT_COMPONENT:
        //         console.log('*******************************');
        //         console.log('******ATTACHMENT_COMPONENT*****');
        //         console.log('*******************************');
        //         break;
        //     case TypeTransaction.ATTACHMENT_ENTITY:
        //         console.log('*******************************');
        //         console.log('*******ATTACHMENT_ENTITY*******');
        //         console.log('*******************************');
        //         break;      
        //     case TypeTransaction.CLONE:
        //         console.log('*******************************');
        //         console.log('**************CLONE************');
        //         console.log('*******************************');
        //         break;    
        //     case TypeTransaction.CHANGE_PROPERTY:
        //         console.log('*******************************');
        //         console.log('******** CHANGE_PROPERTY ******');
        //         console.log('*******************************');
        //         break;  
        //     default:
        //         break;
        // }

        // console.time('Work Time');

        // // Если создаем компонент
        // if (transaction === TypeTransaction.CREATING_COMPONENT){
        //     result = await createComponent(engine.cloneComponents(<ApiComponent[]>object), engine);
        // }    

        // // Если изменяем компонент
        // if (transaction === TypeTransaction.CHANGE_PROPERTY) {
        //     result = await createComponent(<ApiComponent[]>object, engine);
        // }  

        // // Если вкладываем комопнент
        // if (transaction === TypeTransaction.ATTACHMENT_COMPONENT) {
        //     result = await attachmentComponent(<string>key, <ApiComponent[]> attachment, engine);
        // } 

        // // Если создаем сущность
        // if (transaction === TypeTransaction.CREATING_ENTITY) {
        //     const [creatingEntity] = <ApiEntity[]> object;
        //     result = await createEntity(creatingEntity, engine);
        // } 

        // // Если вкладываем сущность
        // if (transaction === TypeTransaction.ATTACHMENT_ENTITY) {
        //     result = await attachmentEntity(<string>key, <ApiEntity[]>attachment, engine);
        // }   
        // // Если клонируем сущность.
        // if (transaction === TypeTransaction.CLONE) {
        //     result = await cloneEntity(<string>cloneKey, <ApiEntity[]> object, engine);
        // }   

        // if (!result) throw new Error("Ошибка обработки данных. Не определена транзакция или данные некорректны.");

        // console.log('*****************************************');
        // console.log('********* Время работы программы ********');
        // console.log('*****************************************');

        // console.timeEnd('Work Time');
        
        // // Ответ клиенту
        // service.sender<PostSocketMessage<EngineBuildtData>>(ws, {
        //     method: 'post',
        //     action: '/construction-object',
        //     headers: msg.headers,
        //     data: {
        //         attachment,
        //         attachmentKeys,
        //         cloneKey,
        //         key,
        //         object: result
        //     }
        // });

        // /** Широковещательная рассылка */
        // (async function () {
        //     if (transaction === TypeTransaction.ATTACHMENT_COMPONENT ||
        //         transaction === TypeTransaction.ATTACHMENT_ENTITY ||
        //         transaction === TypeTransaction.CLONE ||
        //         transaction === TypeTransaction.CREATING_ENTITY) {
        //             const samples = await entityDbSysytem.getEntitySamples();
        //             //const entitySamples = engine.loadAndReturning(samples || []);
        //             //const entities = entitySamples.map(e => e.assemble())
        //         const entities = engine.loadEntities(samples || [])

        //             service.broadcastsystem.broadcast({
        //                 method: 'get',
        //                 action: '/sample-entities',
        //                 headers: msg.headers,
        //                 data: entities
        //             });
        //     }
        //     if (transaction === TypeTransaction.CREATING_COMPONENT) {
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
        // engine.clearSamples()
    } catch (e) {
        console.log(e);
        service.sendError(ws, e);
    }
}

/********************************************************* */
// const createEntity = async (object: ApiEntity, engine: Engine): Promise<ApiEntity[]> => {
//     // Проверено
//    // const deassembleObject = engine.deassembleObject(object)
//     Engine.registration(object);
//     const resultEntity = await saveEntities([object]);
//     const [entity] = engine.loadAndReturning(resultEntity);
//     return entity.build();
// }

// const createComponent = async (object: ApiComponent[], engine: Engine): Promise<ApiComponent[]> => {
//     // Проверено
//     engine.clearSamples()
//     for (const obj of object) {
//         Engine.registration(obj)

//     }
//     const resultComponent = await saveComponents(object);
//     return resultComponent;
// }

// const attachmentEntity = async (key: string, attachment: ApiEntity[], engine: Engine): Promise<ApiEntity[]> => {
//     // Проверено.
//     try {

//         console.log('******************************');
//         console.log('******************************');
    
//         console.log('key', key);
//         console.log('******************************');
//         console.log('******************************');
//         console.log('attachment', attachment);
        
//         console.log('******************************');
//         console.log('******************************');


//         let grandFather: Entity| undefined = undefined;
//         const apiEntities = await getEntityToKey(key);
//         if (!apiEntities || !apiEntities.length) throw new Error("По данному ключу, сущность не найдена.");
//         const grandfatherApi = await getGrandfather(key);

//         if (grandfatherApi) {
//             const [candidateGrandfather] = engine.loadAndReturning([grandfatherApi]);
//             if (candidateGrandfather) grandFather = candidateGrandfather;
//         }

//         //const [att] = attachment;
//         //const tempAtt = engine.deassembleObjectAndReturning(att); // Не использовать, при переходе на apiEntity (tempAtt = att)

//         const tempAtt = attachment;
//         const [entity] = engine.loadAndReturning(apiEntities);

//         entity.addChild(tempAtt);
//         /** Сохранение сущности. */
//         const resultEntity = await saveEntities(entity.build()); 
//         const [resD] = engine.loadAndReturning(resultEntity);

//         if (grandFather && grandFather.getKey() === resD.getKey()) {
//             return resD.build(); // Изменить на метод build(), при переходе на apiEntity // Готово
//         }else {
//             const grfatherApi = await getEntityToKey(grandFather!.getKey())
//             const [grfather] = engine.loadAndReturning(grfatherApi)
//             return grfather.build(); // Изменить на метод build(), при переходе на apiEntity // Готово
//         }
//     } catch (e) {
//         throw e;
//     }
// }

// const attachmentComponent = async (key: string, attachment: ApiComponent[], engine: Engine): Promise<ApiEntity[]> => {
//     // Проверено
//     try {
//         let grandFather: Entity | undefined = undefined;
//         const apiEntities = await getEntityToKey(key);
//         if (!apiEntities || !apiEntities.length) throw new Error("По данному ключу, сущность не найдена.");
//         const [entity] = engine.loadAndReturning(apiEntities)
//         const grandfatherApi = await getGrandfather(key);
//         if (grandfatherApi) {
//             const [candidateGrandfather] = engine.loadAndReturning([grandfatherApi]);
//             if (candidateGrandfather) grandFather = candidateGrandfather;
//         }
//         entity.addComponent(attachment);
//         /** Сохранение сущности. */
//         const resultEntity = await saveEntities(entity.build());
//         engine.clearSamples();
//         const [resD] = engine.loadAndReturning(resultEntity);
//         if (grandFather && grandFather.getKey() === resD.getKey()) {
//             return resD.build(); // Изменить на метод build(), при переходе на apiEntity // Готово
//         } else {
//             const grfatherApi = await getEntityToKey(grandFather!.getKey())
//             const [grfather] = engine.loadAndReturning(grfatherApi)
//             return grfather.build(); // Изменить на метод build(), при переходе на apiEntity //Готово
//         }
//     } catch (e) {
//         throw e;
//     }
// }

// const cloneEntity = async (cloneKey: string, object: ApiEntity[], engine: Engine) => {
//     try {
//         const apiEntities = await getEntityToKey(cloneKey);
//         if (!apiEntities || !apiEntities.length) throw new Error("По данному ключу, сущность не найдена.");

//         engine.clearSamples();

//         const [entity] = engine.loadAndReturning(apiEntities)
//         const [cloneEntity] = engine.loadAndReturning([entity.clone()]); 

//         const [originalEntity] = object;
//         cloneEntity.setName(originalEntity.name!);
//         cloneEntity.setCategory(originalEntity.category!);
//         cloneEntity.setNote(originalEntity.note!);
//         const resultEntity = await saveEntities(cloneEntity.build());
//         engine.clearSamples()
//         return engine.loadEntities(resultEntity);
//         //return engine.loadAndReturning(resultEntity).map(e => e.assemble());

//     } catch (e) {
//         throw e;
//     }
// }
