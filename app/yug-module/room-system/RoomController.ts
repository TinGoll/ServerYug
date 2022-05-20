import createEngine, { Engine, Entity } from "yug-entity-system";
import FirebirdNativeAdapter from "../data-base/adapters/FirebirdNativeAdapter";
import { SocketService } from "../services/socket-service";
import { getEntityToKey } from "../systems/entity-db-system";
import { YugWebsocket } from "../types/socket-types";
import { apiDirectory } from "../utils/apiDirectory";
import databaseQuery from "../utils/db-query";
import Room from "./Room";

export default class RoomController {
    private static instance?: RoomController;
    private static interval: NodeJS.Timer;
    private _delta: number = 0;
    private roomList: Map<string, Room> = new Map<string, Room>();

    private timer: number = 1000;
    private test_timer = 0;

    constructor() {
        if (RoomController.instance) { return RoomController.instance; }
        RoomController.instance = this;
        this._delta = Date.now();
        this.start();
    }
    /**
     * Получение комнаты по ключу.
     * @param entityKey Ключ сущности
     * @param ws сокет
     * @param service сокет - сервис.
     * @returns комнату, завернутую в промис.
     */
    async getRoomToKey (entityKey: string, ws: YugWebsocket, service: SocketService): Promise<Room> {
        try {

            if (this.roomList.has(entityKey)) {
                const room = this.roomList.get(entityKey)!;
                room.subscribe(ws);
                return room;
            }

            const engine = createEngine();
            if (!engine.has(entityKey)) {
                const entityApi = await getEntityToKey(entityKey);
                engine.loadEntities(entityApi);
            }

            const entity = engine.creator().getEntityToKey(entityKey);
            if (!entity) throw new Error("Сущность не найдена.")
            const newRoom = this.createRoom(entity, ws, service);
            return this.addRoom(newRoom);
        } catch (e) {
            throw e;
        }
    }

    createRoom (entity: Entity, ws: YugWebsocket, service: SocketService) {
       // Engine.setMode("DEV")
        return new Room(entity, ws, service, this);
    }

    /**
     * Добавление новой комнаты
     * @param room объект комнаты.
     * @returns добавленная комната.
     */
    addRoom (room: Room): Room {
        try {
            const key = room.getKey();
            if (this.roomList.has(key)) return this.roomList.get(key)!;
            this.roomList.set(key, room);
            return room;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Удаление комнаты по ключу
     * @param key ключ 
     * @returns 
    */
    romoveRoom (key: string): RoomController {
        if (this.roomList.has(key)) {
            if (this.roomList.get(key)?.isLive()) this.roomList.get(key)?.destroy();
            this.roomList.delete(key);
        }
        return this;
    }

    /**
     * Вызываеться с частотой указанной в timer
     * @param dt время прошедшее между тактами.
     */
    update (dt: number) {
        try {
            //this.test_timer += dt;
            if (this.test_timer >= 5) {
                this.test_timer = 0;
                console.log("count", this.count());
                
            }
            this.roomList.forEach(room => room.update(dt));
        } catch (e) {
            console.log("Update Error: ", e); 
        }
    }


    /** Старт цикла */
    private start () {
        RoomController.interval = setInterval(() => {
            const delta = this._delta;
            this._delta = Date.now(); 
            const deltaTime: number = this._delta - delta;
            this.update(deltaTime * 0.001)
        }, this.timer);
    }

    /**
     * Остановка цикла
     */
    private stop() {
        clearInterval(RoomController.interval);
    }

    /**
     * Количество действующих комнат.
     * @returns number
     */
    count (): number {
        return this.roomList.size;
    }

    /**
     * Уничтожение комнаты.
     */
    destroy () {
        this.stop();
        this.roomList.forEach(room => {
            room.destroy();
        });
        this.romoveRoom.caller();
        RoomController.instance = undefined;
    }

    has(key: string) {
        try {
            return this.roomList.has(key);
        } catch (e) {
            throw e;
        }
    }
    /** Получение существующей комнаты по ключу, предварительно нужно проверить методом has */
    get(key: string): Room | undefined {
        try {
            return this.roomList.get(key);
        } catch (e) {
            throw e;
        }
    }

    //******************************************************* */
    //************** Получение общих списков.**************** */
    //******************************************************* */

    // Получение списка имен номенклатуры.
    async getSampleNames(filter: { name?: string, category?: string } = {}) {
        try {
            
        } catch (e) {
            throw e;
        }
    }

    // Получение списка заказов (ключи, имена и список компонентов)
    async getAllOrders (filter: {name?: string, category?: string} = {}) {
        try {
            const db = new FirebirdNativeAdapter();
            const ordersDb = await db.executeRequest<OrderDb>(databaseQuery("get all orders"), []);
            const dataOrders =  ordersDb
                .filter(o => {
                    // Сделать фильтрацию
                    return true;
                })
                .map(o => {
                    return {
                        id: o.ID,
                        key: o.KEY,
                        name: o.NAME,
                        note: o.NOTE,
                        category: o.CATEGORY,
                        componentName: o.COMPONENT_NAME,
                        componentDescription: o.COMPONENT_DESCRIPTION,
                        propertyName: o.PROPERTY_NAME,
                        propertyDescription: o.PROPERTY_DESCRIPTION,
                        propertyValue: o.PROPERTY_VALUE
                    }
                });
            const entityId = [ ...new Set(dataOrders.map(o => o.id)) ];
            const orders: Order[] = [];
            for (const id of entityId) {
                const items = dataOrders.filter(o => o.id === id);
                const components = items.map(c => {
                    return {
                        componentName: c.componentName, componentDescription: c.componentDescription,
                        propertyName: c.propertyName, propertyDescription: c.propertyDescription,
                        propertyValue: c.propertyValue
                    }
                })
                orders.push({
                    id: items[0].id,
                    key: items[0].key,
                    name: items[0].name,
                    note: items[0].note,
                    category: items[0].category,
                    components
                })
            }

            return orders;
        } catch (e) {
            throw e;
        }
    }

    getApiDirectory () {
        return apiDirectory();
    }

    //******************************************************* */
    //******************************************************* */
    //******************************************************* */
}

/** Интерфейсы для списков */
interface OrderDb {
    ID: number;
    KEY: string;
    NAME: string;
    NOTE: string;
    CATEGORY: string;
    COMPONENT_NAME: string;
    COMPONENT_DESCRIPTION: string;
    PROPERTY_NAME: string
    PROPERTY_DESCRIPTION: string
    PROPERTY_VALUE: string;
}

export interface Order {
    id: number;
    key: string;
    name: string;
    note: string;
    category: string;
    components: Array<{
        componentName: string;
        componentDescription: string;
        propertyName: string;
        propertyDescription: string;
        propertyValue: string;
    }>
}
