import createEngine, { ApiComponent, ApiEntity, Engine, PropertyValue } from "yug-entity-system";
import Room from "../../room-system/Room";
import RoomController, { Order } from "../../room-system/RoomController";
import { getEntityToKey, saveEntities } from "../../systems/entity-db-system";
import { GetSocketMessage, OrderSocketMessage } from "../../types/socket-message-types";
import { YugWebsocketAction } from "../../types/socket-types";
import { generatorOrderId } from "../../utils/generators";
import _ from "lodash"
import { SocketService } from "../../services/socket-service";
import orderSampleService, { SampleNames } from "../../services/orders/order-sample-service";
import { updateComponents } from "../../systems/component-db-system";

interface CreateOrderData {
    entityKey: string;
}

interface OpenOrderData {
    entityKey: string;
}

interface CloseOrderData {
    entityKey: string;
}

interface AddOrderElementData {
    entityKey: string;
    addedKey: string;
}

interface DeleteOrderElementData {
    entityKey: string;
    deletedKey: string;
}

interface EditOrderElementData {
    entityKey: string;
    editedKey: string;
    propertyKey: string;
    value: PropertyValue;
}

export interface GetAllOrderData {
    filter?: { name?: string, category?: string }
}

export interface GetSampleNames {
    filter?: { key: string; name: string; note?: string; category?: string }
}

export interface GetApiEntityToKey {
    key: string;
}

export interface ChangeEntityComponentToKey {
    entityKey: string;
    apiComponent: ApiComponent;
}

export interface RemovePropertyFromElement {
    entityKey: string;
    elementKey: string;
    propertyKey: string;
}

export interface AddPropertyToElement {
    entityKey: string;
    elementKey: string;
    apiComponent: ApiComponent;
}

/**
 * Создание заказа и открытие комнаты с одним пользовтаелем.
 * @param param сокет, служба управления сообщениями, сообщение.  
 */
export const createOrder = async ({ ws, service, msg }: YugWebsocketAction<OrderSocketMessage<CreateOrderData>>) => {
    try {
        const { entityKey } = msg.data;
        if (!entityKey) throw new Error("Не задан ключ сущности - шаблона.") // Если ключ шаблона не задан.
        const engine = createEngine(); // Создание экземпляра движка.

        const order_id = await generatorOrderId(); // Получение id из генератора.

        const sampleApi = await getEntityToKey(entityKey); // Получение api - объекта, компонента - шаблона.
        const [sample] = engine.loadAndReturning(sampleApi); // Загрузка шаблона в движек;

        const order = sample.produceAndRetutning().setPropertyValue("id", "nomer_zаkаzа", order_id, false).recalculationFormulas(); // Репродуцирование новой сущности заказа на основе шаблона, а так же пересчет формул
 
        engine.loadEntities(await saveEntities(order.build())); // Сохранение заказа в базу данных, и загрузка обновленного объекта в движек.

        const roomController = new RoomController(); // Создание объекта контроллера комнат.
        const room = await roomController.getRoomToKey(order.key, ws, service); // Создание комнаты.
        room.pushActionTohistory(ws, "Создал(а) заказ.", "high");
        room.addActionsToHistory(ws, ...order.getHistoryAndClear());
        sendNewOrderList(service);
    } catch (e) {   
        console.log(e);
        service.sendError(ws, e);
    }
}

const sendNewOrderList = (service: SocketService) => {
    const roomController = new RoomController(); // Создание объекта контроллера комнат.
    // Отправка обновленного списка заказов, всем кто запрашивал заказы.
    let orderList: Order[]; // список заказов.
    let previusFilter: any; // Предыдущий фильтр, если фильтры не отличаются, то новый запрос в базу данных не отправляется.

    // Расширенная система широковещательной рассылки.
    service.broadcastsystem.extendedMailing(async (ws) => {
        const filter = ws.data?.roomData.getAllOrderData?.filter;
        if (filter) {
            if (!_.isEqual(previusFilter, filter) || !orderList) {
                orderList = await roomController.getAllOrders(filter);
                previusFilter = { ...filter };
            }
            const msg: OrderSocketMessage = {
                method: "order",
                action: "/get-all-orders",
                data: { orderList }
            }
            return  msg 
        }
    });
}

/**
 * Открытие заказа
 * @param param0 
 */
export const openOrder = async ({ ws, service, msg }: YugWebsocketAction<OrderSocketMessage<OpenOrderData>>) => {
    try {
        const { entityKey } = msg.data;
        const roomController = new RoomController(); // Создание объекта контроллера комнат.
        const engine = createEngine();
        let room: Room;
        if (roomController.has(entityKey)) {
            room = await roomController.getRoomToKey(entityKey, ws, service);
        }else{
            const orderApi = await getEntityToKey(entityKey); // Получение api - объекта
            const [order] = engine.loadAndReturning(orderApi);
            room = await roomController.getRoomToKey(order.key, ws, service)
        }
        if (!room) throw new Error("Заказ не найден.")
        room.pushActionTohistory(ws, "Открыл(а) заказ.", "high");
    } catch (e) {
        console.log(e);
        service.sendError(ws, e);
    }
}
/**
 * Закрытие заказа
 * @param param0 
 */
export const closeOrder = async ({ ws, service, msg }: YugWebsocketAction<OrderSocketMessage<CloseOrderData>>) => {
    try {
        const { entityKey } = msg.data;
        const roomController = new RoomController(); // Создание объекта контроллера комнат.
        if (roomController.has(entityKey)) {
            const room = roomController.get(entityKey);
            if (!room) throw new Error("Комната с заказом не найдена.");
            room.unsubscribe(ws);
        }else {
            ws.data!.roomData.roomKey = null
            throw new Error("Заказ с таким ключем не был открыт.");
        }
    } catch (e) {
        console.log(e);
        service.sendError(ws, e);
    }
}

/**
 * Добавление элемента в заказ, по ключу
 * @param param0 
 */
export const addOrderElement = async ({ ws, service, msg }: YugWebsocketAction<OrderSocketMessage<AddOrderElementData>>) => {
    try {
        const { entityKey, addedKey } = msg.data;
        const roomController = new RoomController(); // Создание объекта контроллера комнат.
        if (roomController.has(entityKey)) {
            const room = await roomController.getRoomToKey(entityKey, ws, service);
            room.addElement(ws, addedKey);
        }else {
            ws.data!.roomData.roomKey = null
            throw new Error("Заказ с таким ключем не был открыт.");
        }
    } catch (e) {
        console.log(e);
        service.sendError(ws, e);
    }
}

export const addPropertyToElement = async ({ ws, service, msg }: YugWebsocketAction<OrderSocketMessage<AddPropertyToElement>>) => {
    try {
        const { entityKey, elementKey, apiComponent } = msg.data;
        const roomController = new RoomController(); // Создание объекта контроллера комнат.
        if (roomController.has(entityKey)) {
            const room = await roomController.getRoomToKey(entityKey, ws, service);
            room.AddComponentToElement(ws, elementKey, apiComponent);
        } else {
            ws.data!.roomData.roomKey = null
            throw new Error("Заказ с таким ключем не был открыт.");
        }
    } catch (e) {
        console.log(e);
        service.sendError(ws, e);
    }
}

export const removePropertyFromElement = async ({ ws, service, msg }: YugWebsocketAction<OrderSocketMessage<RemovePropertyFromElement>>) => {
    try {
        const { entityKey, elementKey, propertyKey } = msg.data;
        const roomController = new RoomController(); // Создание объекта контроллера комнат.
        if (roomController.has(entityKey)) {
            const room = await roomController.getRoomToKey(entityKey, ws, service);
            room.deletePropertyFromElement(ws, elementKey, propertyKey);
        } else {
            ws.data!.roomData.roomKey = null
            throw new Error("Заказ с таким ключем не был открыт.");
        }
    } catch (e) {
        console.log(e);
        service.sendError(ws, e);
    }
}

/**
 * Удаление элемента заказа по ключу
 * @param param0 
 */
export const deleteOrderElement = async ({ ws, service, msg }: YugWebsocketAction<OrderSocketMessage<DeleteOrderElementData>>) => {
    try {
        const { entityKey, deletedKey } = msg.data;
        const roomController = new RoomController(); // Создание объекта контроллера комнат.
        if (roomController.has(entityKey)) {
            const room = await roomController.getRoomToKey(entityKey, ws, service);
            room.deleteElement(ws, deletedKey);
        } else {
            ws.data!.roomData.roomKey = null
            throw new Error("Заказ с таким ключем не был открыт.");
        }
    } catch (e) {
        console.log(e);
        service.sendError(ws, e);
    }
}
/**
 * Редактирование елемента и шапки заказа
 * @param param0 
 */
export const editOrderElement = async ({ ws, service, msg }: YugWebsocketAction<OrderSocketMessage<EditOrderElementData>>) => {
    try {
        const { entityKey, editedKey, propertyKey, value } = msg.data;
        const roomController = new RoomController(); // Создание объекта контроллера комнат.
        if (roomController.has(entityKey)) {
            const room = await roomController.getRoomToKey(entityKey, ws, service);;
            room.changeElement(ws, editedKey, propertyKey, value);
        } else {
            ws.data!.roomData.roomKey = null
            throw new Error("Заказ с таким ключем не был открыт.");
        }
    } catch (e) {
        console.log(e);
        service.sendError(ws, e);
    }
}

/**
 * Получение спика заказов.
 * @param param0 
 */
export const getAllOrders = async ({ ws, service, msg }: YugWebsocketAction<OrderSocketMessage<GetAllOrderData>>) => {
    try {
        const { filter = {} } = msg.data || {};
        ws.data!.roomData.getAllOrderData = { filter: { ...filter } };
        const roomController = new RoomController(); // Создание объекта контроллера комнат. 
        const orderList = await roomController.getAllOrders(filter);
        service.sender<OrderSocketMessage>(ws, {
            method: "order",
            action: "/get-all-orders",
            data: { orderList }
        });
    } catch (e) {
        console.log(e);
        service.sendError(ws, e);
    }
}

/**
 * Получение списка имен/ключей номенклатуры.
 * @param param0 
 */
export const getSampleNames = async ( { ws, service, msg }: YugWebsocketAction<OrderSocketMessage<GetSampleNames>> ) => {
    try {
        const { key, name, category, note } = msg.data.filter || {};
        const names = await orderSampleService.getSampleNames({ key, name, category, note });
        service.sender<OrderSocketMessage<SampleNames[]>>(ws, {
            method: 'order',
            action: '/get-sample-names',
            headers: msg.headers,
            data: names
        });
    } catch (e) {
        console.log(e);
        service.sendError(ws, e);
    }
}

/**
 * Получение сущности (со всеми дочерними), по ключу.
 * @param param0 
 */
export const getApiEntityToKey = async ({ ws, service, msg }: YugWebsocketAction<OrderSocketMessage<GetApiEntityToKey>>) => {
    try {
        const { key } = msg.data;
        if (!key) throw new Error("Некорректный ключ сущности.")
        const apiData = await orderSampleService.getApiEntityToKey(key);
        service.sender<OrderSocketMessage<ApiEntity[]>>(ws, {
            method: 'order',
            action: '/get-api-entity-to-key',
            headers: msg.headers,
            data: apiData
        });
    } catch (e) {
        console.log(e);
        service.sendError(ws, e);
    }
}

/**
 * Изменить сущность по ключу.
 * @param param0 
 */
export const changeEntityComponentToKey = async ({ ws, service, msg }: YugWebsocketAction<OrderSocketMessage<ChangeEntityComponentToKey>>) => {
    try {
        const { entityKey, apiComponent } = msg.data;
        let changedComponents: ApiComponent[];
        const engine = createEngine();
        //  Engine.setMode("DEV")
        if (!entityKey) {
            changedComponents = [apiComponent]
        }else {
            const orderApi = await getEntityToKey(entityKey); // Получение api - объекта
            const [entity] = engine.loadAndReturning(orderApi); // загрузка сущности в движек.

            if (!apiComponent?.entityKey) throw new Error("Некорректный объект apiComponent");
            const editableEntity = entity.findToKey(apiComponent.entityKey); // Поиск редактируемой сущности.
            if (!editableEntity) throw new Error("Компонент не принадлижит данной сущности.");

            editableEntity.setApiComponentToKey(apiComponent.key, apiComponent);
            changedComponents = entity.recalculationFormulas().getChangedComponents();
            entity.resetСheckСhanges();
            const apiData = entity.build();
            engine.removeToKey(entity.key); // Удаляем шаблон из движка по ключу.
        }

        if (changedComponents.length) {
            await updateComponents(changedComponents);
        }
        service.sender<OrderSocketMessage<ApiEntity[]>>(ws, {
            method: 'order',
            action: '/change-entity-component',
            headers: msg.headers,
            data: changedComponents
        });
        
        
    } catch (e) {
        console.log(e);
        service.sendError(ws, e);
    }
}

/**
 * Получение списка API
 * @param param0 
 */
export const getApiDirectory = async ({ ws, service, msg }: YugWebsocketAction<OrderSocketMessage>) => {
    try {
        const roomController = new RoomController(); // Создание объекта контроллера комнат. 
        const api = roomController.getApiDirectory()
        service.sender<OrderSocketMessage>(ws, {
            method: "order",
            action: "/get-api-directory",
            data: { api }
        });
    } catch (e) {
        console.log(e);
        service.sendError(ws, e);
    }
}
