import { CLOSED } from "ws";
import Engine, { ApiComponent, PropertyValue } from "yug-entity-system-async";
import Entity from "yug-entity-system-async/dist/Entity";

import componentModel from "../db-models/component-model";
import { SocketService } from "../services/socket-service";
import { insertComponents, updateComponents } from "../systems/component-db-system";
import { deleteEntityToKey, getEntityToKey, saveEntities } from "../systems/entity-db-system";
import { saveLog } from "../systems/log-db-system";
import { OrderSocketMessage } from "../types/socket-message-types";
import { YugWebsocket } from "../types/socket-types";

import RoomController from "./RoomController";

type TimerKey = typeof timerKey[number]
const timerKey = [
    "Checking the relevance of subscribers", 
    "Save Changes Timer",
    "Log save check"
] as const;

export interface History {
    userName: string;
    action: string;
    isSaved: boolean;
    entityKey: string;
    ts?:Date;
    importance: "low" | "high" | "error";
    index: number;
}

export default class Room {
    // private observers: Map<string, YugWebsocket>;

    // private entity: Entity;
    // private engine: Engine;
    // private controller: RoomController;
    // private service: SocketService;

    // private history: History[];

    private timers: Map<TimerKey, { time: number, current: number }> = new Map<TimerKey, { time: number, current: number }>();

    // Количество секунд, для таймеров. *****************
    private relevanceOfSubscribersTime: number = 5; //sec
    private saveChangesTime: number = 5; //sec
    private logSaveCheckTime: number = 10; //sec
    // **************************************************

    private historyCount: number = 100;
    // private _live: boolean;

    constructor(entity: Entity, ws: YugWebsocket, service: SocketService, controller: RoomController) {
        // this.engine = createEngine();
        // this.controller = controller;
        // this.service = service;
        // this.entity = entity;
        // this.observers = new Map<string, YugWebsocket>();
        // ws.data!.roomData.roomKey = entity.key;
        // this.history = [];
        // this.subscribe(ws);

        // this._live = true;

        // // Таймеры
        // this.timers.set("Checking the relevance of subscribers", { time: this.relevanceOfSubscribersTime, current: 0 });
        // this.timers.set("Save Changes Timer", { time: this.saveChangesTime, current: 0 });
        // this.timers.set("Log save check", { time: this.logSaveCheckTime, current: 0 });
    }

    /** ****************************************************************************** */
    /** ************************** Методы работы с заказом *************************** */
    /** ****************************************************************************** */

    /**
     * Добавление нового элемента в заказ
     */
    async addElement (ws: YugWebsocket, key: string) {
        try {
        //     // Делать проверку на наличие загружнного шаблона, и брать щаблон из движка.
        //     const sampleApi = await getEntityToKey(key);
        //     const [sample] = this.engine.loadAndReturning(sampleApi);

        //     const element = sample.produceAndRetutning()
        //    // .recalculationFormulas();

        //     this.addActionsToHistory(ws, ...element.getHistoryAndClear());
        //     //this.sendDataToAllUsers(); - ускоренный вывод, не дожидаясь сохранения
        //     this.engine.loadEntities(await saveEntities(this.entity.propertyPredefinition(element).build()));
        //     console.log("Элементов в заказе:", this.entity.getChildren().length);
        //     console.log("Элементы:", this.entity.getChildren().map(e => `${e.name}: ${e.note}`));
        //     //this.entity.recalculationFormulas();
        //     //this.sendDataToAllUsers();
        //     this.sendAddedElement(element);
        //     this.sendChangedDataToAllUsers();
        //     this.pushActionTohistory(ws, `Добавл(а) новый элемент ${element.getName()} в заказ.`, "high")
        } catch (e) {
            console.log(e);
            this.sendErrorsAllUsers(e);
            this.pushActionTohistory(ws, `Ошибка добавления елемента: ${(e as Error).message}`, "error");
        }
    }

    sendAddedElement (element: Entity) {
        try {
            // this.entity.recalculationFormulas();
            // const order =[ element.getOptions() ];
            // this.service.broadcastsystem.broadcast({
            //     method: "order",
            //     action: '/get-order-data',
            //     data: { order }
            // }, { roomKey: this.getKey() })
        } catch (e) {
            console.log(e);
            this.sendErrorsAllUsers(e)
        }
    }

    /**
     * Удаление элемента из заказа.
     */
    async deleteElement (ws: YugWebsocket, key: string) {
        try {
            // const element = this.entity.findToKey(key);
            // if (!element) throw new Error("В этом заказе, нет сущности с таким ключем.");
            // const deletedKey = await deleteEntityToKey(key);
            // if (!deletedKey) throw new Error("Сущность не найдена в базе данных.");

            // this.entity.deleteChildByKey(deletedKey);
            // //this.sendDataToAllUsers();
            // this.sendDeletedElementKey(deletedKey, true);
            // this.pushActionTohistory(ws, `Удалил(а) элмент ${element.name} из заказа.`, "high")
        } catch (e) {
            console.log(e);
            this.sendErrorsAllUsers(e);
            this.pushActionTohistory(ws, `Ошибка удаления елемента: ${(e as Error).message}`, "error");
        }
    }

    async deletePropertyFromElement(ws: YugWebsocket, key: string, propertyKey: string) {
        try {
            // const element = this.entity.findToKey(key);
            // if (!element) throw new Error("В этом заказе, нет сущности с таким ключем.");
            // const cmp = element.deleteComponentPropertyToKey(propertyKey);
            // if (cmp) {
            //     componentModel.deleteComponentToKey(cmp.key);
            //     this.sendDeletedElementKey(cmp.key);
            // }
        } catch (e) {
            console.log(e);
            this.sendErrorsAllUsers(e)
            this.pushActionTohistory(ws, `Ошибка удаления свойства: ${(e as Error).message}`, "error");
        }
    }

    async AddComponentToElement(ws: YugWebsocket, key: string, apiComponent: ApiComponent) {
        try {
            // const element = this.entity.findToKey(key);
            // if (!element) throw new Error("В этом заказе, нет сущности с таким ключем.");
            // const cmp =  element.createNewComponent(apiComponent);
            // await insertComponents([cmp]);
            // // Тут ответ на клиент, решение не принято.
            // this.sendChangedDataToAllUsers();   
        } catch (e) {
            console.log(e);
            this.sendErrorsAllUsers(e)
            this.pushActionTohistory(ws, `Ошибка добавления свойства: ${(e as Error).message}`, "error");
        }
    }

    /**
     * Изменение свойств заказа.
     */
    async changeElement(ws: YugWebsocket, editedKey: string, propertyKey: string, value: PropertyValue) {
        try {
            // const element = this.entity.findToKey(editedKey);
            // if (!element) throw new Error("Сущность по данному ключу, не найдена.");
            // element.setPropertyValueToKey(propertyKey, value);
            // // .recalculationFormulas();
            // //this.entity.recalculationFormulas();
            // this.sendChangedDataToAllUsers();            
            // this.addActionsToHistory(ws, ...element.getHistoryAndClear());
        } catch (e) {
            console.log(e);
            this.sendErrorsAllUsers(e);
            this.pushActionTohistory(ws, `Ошибка изменения свойства елемента: ${(e as Error).message}`, "error");
        }
    }

    /** ****************************************************************************** */
    /** ****************************************************************************** */
    /** ****************************************************************************** */

    /** Получение Entity движка */
    getEngine () {
        // return this.engine;
    }
    /**
     * Отправка ключа удаленного компонента.
     */
    sendDeletedElementKey (deletedKey: string, isEntityKey: boolean = false) {
        try {
            // this.entity.recalculationFormulas(); // Пересчет перед отправкой.
            // this.service.broadcastsystem.broadcast({
            //     method: 'success',
            //     message: isEntityKey ? 'Сущность успешно удалёна.' : `Компонент успешно удалён.`,
            //     data: { key: deletedKey },
            // }, { roomKey: this.getKey() });
        } catch (e) {
            console.log(e);
            this.sendErrorsAllUsers(e);
        }
    }

    sendChangedDataToAllUsers () {
        try {
            // this.entity.recalculationFormulas();
            // const changedComponents: ApiComponent[] = [];
            // for (const ent of this.entity.getDynasty()) {
            //     changedComponents.push(...(ent.getOptions().components?.filter(c => c.isChange) || []));
            // }
            // this.service.broadcastsystem.broadcast({
            //     method: "order",
            //     action: '/get-changed-order-data',
            //     data: { changedComponents }
            // }, { roomKey: this.getKey() });
            
        } catch (e) {
            console.log(e);
            this.sendErrorsAllUsers(e);
        }
    }

    /** Отправка данных, всем пользователям комнаты. */
    sendDataToAllUsers () {
        try {
            // const order = this.entity.recalculationFormulas().getBuildProductionData();
            // this.service.broadcastsystem.broadcast({
            //     method:"order",
            //     action: '/get-order-data',
            //     data: { order }
            // }, {roomKey: this.getKey() })
        } catch (e) {
            console.log(e);
            this.sendErrorsAllUsers(e)
        }
    }

    /** Перезагрузка данных заказа. */
    async refrashOrderData () {
        try {
            // const apiData = await getEntityToKey(this.entity.getKey());
            // this.engine.loadEntities(apiData);
        } catch (e) {
            console.log(e);
            this.sendErrorsAllUsers(e);
        }
    }
    /** Отправка ошибок всем пользователям. */
    sendErrorsAllUsers (error: unknown) {
        // for (const ws of this.observers.values()) {
        //     this.service.sendError(ws, error);
        // }
    }

    /** Подписка сокета на комнату */
    subscribe (ws: YugWebsocket) {
        try {
            // if (!this.observers.has(ws.data!.key)) {
            //     ws.data!.roomData.roomKey = this.entity.key;
            //     this.observers.set(ws.data!.key, ws);
            //     const order = this.entity.getBuildProductionData();

            //     // Уведомление пользовтаеля о подписке, и обновление списка подписчиков.
            //     this.service.sender<OrderSocketMessage>(ws, {
            //         method: 'order',
            //         action: '/get-order-data',
            //         data: { order }
            //     });
                
            //     // Отправка всем участникам комнаты, обновленного списка пользователей.
            //     this.service.broadcastsystem.broadcast({
            //         method: "order",
            //         action: "/get-current-user",
            //         data: { userNames: this.getUserNames() }
            //     }, { roomKey: this.getKey() })
            // }
        } catch (e) {
           // this.service.sendError(ws, e);
        }
    }

    /** Отписка сокета */
    unsubscribe(ws: YugWebsocket) {
        // ws.data!.roomData.roomKey = null;;
        // this.observers.delete(ws.data!.key);
        // this.service.sender(ws, {
        //     method:"info",
        //     data: {message: "Ты вышел из заказа"}
        // })
        // // Отправка всем участникам комнаты, обновленного списка пользователей.
        // this.service.broadcastsystem.broadcast({
        //     method: "order",
        //     action: "/get-current-user",
        //     data: { userNames: this.getUserNames() }
        // }, { roomKey: this.getKey() })
        // this.pushActionTohistory(ws, `покинул(а) чат...`, "high")
    }

    /** Получить ключ комнаты (он же ключ сущности) */
    getKey (): string {
       // return this.entity.getKey();
       return ""
    }

    /** Уничтожить комнату, и закрыть связанный с ней заказ. */
    destroy () {
        // if (this.dataSavingCheck()) {
        //     console.log(`room: ${this.getKey()} destroy`);
        //     this._live = false;
        //     this.engine.removeToKey(this.getKey());
        //     this.observers.clear();
        //     this.controller.romoveRoom(this.getKey());
        // }
    }

    /** Количество подписчиков  в комнате. */
    count () {
      //  return this.observers.size;
    }
    /**
     * Получение пользователей, находящихся в текущей комнате.
     * @returns 
     */
    getUserNames(): string[] {
      //  return [...new Set(Array.from(this.observers).map(obs => obs[1].data!.user!.getUserName()!))];
      return []
    }

    /**
     * Тетод вызывается контроллером с периодом, указанном в переменной timer в контроллере.
     * @param dt время прошедшее между тактами, в секундах.
     */
    async update (dt: number): Promise<void> {
        try {
            this.checkingRelevance(dt); // Проверка на наличие в комнате живых сокетов
            this.saveChanges(dt); // проверка сохраненных изменений
            this.logSaveCheck(dt); // Проверка сохранения лога.
        } catch (e) {
            console.log("update error", e);
            throw e;
        }
    }

    /** Сохранение измененных данных в базу данных. */
    async saveChanges (dt: number): Promise<void> {
        try {
            // this.timers.get("Save Changes Timer")!.current += dt
            // const current = this.timers.get("Save Changes Timer")!.current;
            // const time = this.timers.get("Save Changes Timer")!.time;
            // if (current >= time) {
            //     this.timers.get("Save Changes Timer")!.current = 0;
            //     const apiComponents: ApiComponent[] = []
            //     for (const ent of this.entity.getDynasty()) {
            //         apiComponents.push(...(ent.getOptions().components?.filter( c => c.isChange) || [] ));
            //     }
            //     if (apiComponents.length) {
            //         console.log("Обновление компонентов", apiComponents.length);
            //         await updateComponents(apiComponents);
            //     } 
            //     this.entity.resetСheckСhanges();
            // }
        } catch (e) {
            await this.refrashOrderData();
            this.sendDataToAllUsers();
            this.sendErrorsAllUsers(e);
        }
    }

    /** Проверка на присутствие сокета в комнате. */
    async checkingRelevance(dt: number): Promise<void> {
       try {
            // this.timers.get("Checking the relevance of subscribers")!.current += dt
            // const current = this.timers.get("Checking the relevance of subscribers")!.current;
            // const time = this.timers.get("Checking the relevance of subscribers")!.time;
            // if (current >= time) {
            //     // ******** Код проверки ********
            //     this.timers.get("Checking the relevance of subscribers")!.current = 0;                
            //     for (const obs of this.observers.values()) {
            //         if (!obs || obs.readyState === CLOSED || obs.data?.roomData.roomKey !== this.getKey()) {
            //             this.unsubscribe(obs);
            //             console.log("checkingRelevance", "Отписка");
            //         }
            //     }
            //     // Уничтожение комнаты, если в ней никого нет.
            //     if (!this.observers.size) this.destroy();
            // }
       } catch (e) {
           throw e;
       }
    }
    /**
     * Проверка сохранения лога.
     * @param dt дельта тайм
     */
    async logSaveCheck (dt: number) {
        try {
            // this.timers.get("Log save check")!.current += dt
            // const current = this.timers.get("Log save check")!.current;
            // const time = this.timers.get("Log save check")!.time;
            // if (current >= time) {
            //     this.timers.get("Log save check")!.current = 0;
            //     const tempArr: History[] = []; // Массив несохраненных логов.
            //     for (const hs of this.history) {
            //         if ( !hs.isSaved && hs.importance !== "low" ) {
            //             hs.isSaved = true; // пометка о сохранении.
            //             tempArr.push({...hs});
            //         }
            //     }
            //     if (tempArr.length) saveLog(tempArr);
            // }
        } catch (e) {
            throw e;
        }
    }

    dataSavingCheck (): boolean {
        try {
            // let check: boolean = true;
            // const changes = this.entity.getChangedEntities();
            // if (changes.length) check = false;
            // if (this.history.filter(h => !h.isSaved).length) check = false;
            // return check;
            return false;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Добавление событий в историю, и отправка истории клиентам.
     * @param ws 
     * @param action 
     */
    pushActionTohistory(ws: YugWebsocket, action: string, importance: "low" | "high" | "error" = "low" ) {
        // this.history.push({
        //     userName: ws.data?.user?.getUserName() || "Без имени",
        //     action,
        //     entityKey: this.getKey() ,
        //     isSaved: false,
        //     ts: new Date(),
        //     importance,
        //     index: this.history.length + 1
        // });
        // const history = this.history.sort((a, b) => {
        //     if (a.index < b.index) return -1;
        //     if (a.index > b.index) return 1;
        //     return 0;
        // }).reverse().filter(h => h.importance !== "low").slice(0, this.historyCount);
        // console.log(ws.data?.user?.getUserName(), action);
        // this.service.broadcastsystem.broadcast({
        //     method: "order",
        //     action: "/get-order-history",
        //     data: { history }
        // }, { roomKey: this.getKey() })
    }

    addActionsToHistory(ws: YugWebsocket, ...history: any[]) {
        for (const hs of history) {
            this.pushActionTohistory(ws, hs.action, hs.importance);
        }
    }

    /** Жива ли комната. Умирает при вызове метода destroy */
    isLive() : boolean {
        //return this._live;
        return false
    }
}