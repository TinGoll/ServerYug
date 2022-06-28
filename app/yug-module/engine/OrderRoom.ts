import Engine, { ApiEntity, ComponentDto, Room, Subscriber } from "yug-entity-system-async";
import { EntityShell } from "yug-entity-system-async/dist/@engine-types";
import Entity from "yug-entity-system-async/dist/Entity";

import { SocketService } from "../services/socket-service";
import { OrderActions, OrderSocketMessage } from "../types/socket-message-types";
import { YugWebsocket } from "../types/socket-types";

export default class OrderRoom extends Room<string, YugWebsocket> {
 
    constructor(key: string, engine: Engine, entity?: Entity) {
        super(key, engine, entity);
    }

    //************************************************* */
    //****************** Методы сервера *************** */
    //************************************************* */

    /**
     * Метод получения данных, для отправки клиенту.
     */
    async build(onlyChanged: boolean = true): Promise<EntityShell[]> {
        // Реализовать тот формат отправки, который обговорен с клиентом.
        const entityShells: EntityShell[] = [];
        const childsLvl1 = await this.entity?.getChildren() || [];
        for (const cld1 of childsLvl1) {
            if (onlyChanged) {
                // Удалить сбор по меткам, оставить только по "неуведомленным"
                if (cld1.indicators.is_changeable || cld1.indicators.is_changeable_component || cld1.indicators.is_not_sent_notification) {
                    entityShells.push(cld1.getShell());
                }
            }else{
                entityShells.push(cld1.getShell());
            }
            const cildsLvl2 = await cld1.getChildren();
            for (const cld2 of cildsLvl2) {
                if (onlyChanged) {
                    // Удалить сбор по меткам, оставить только по "неуведомленным"
                    if (cld2.indicators.is_changeable || cld2.indicators.is_changeable_component || cld2.indicators.is_not_sent_notification) {
                        entityShells.push(cld2.getShell());
                    }
                } else {
                    entityShells.push(cld2.getShell());
                }
            }
        }
        return entityShells;
    }

    /**
     * Определение свойств компонента по средствам dto.
     * @param editedKey Ключ сущносити
     * @param propertyKey Ключ свойства
     * @param dto Набор определения кмпонента
     * @param subscriber Сокет.
     */
    async editEntityToDto(editedKey: string, propertyKey: string, dto: ComponentDto, subscriber: YugWebsocket, service: SocketService) {
        try {
            const entity = await this.entity?.getEntityToKey(editedKey);

            if (!entity) throw new Error("Сущности с таким ключом, нет в данной команте.");

            const cmp = entity.getComponents().find(c => c.key === propertyKey);

            if (!cmp) throw new Error("Свойства с таким ключом, нет в данной сущности.");

            const component = entity.getComponent(cmp.componentName);

            if (!component) throw new Error("Комопнент не найден в данной сущности.");

            if (dto.componentName && dto.componentName !== component.name) {
                component.rename(dto.componentName);
            }
            if (dto.componentDescription && dto.componentDescription !== component.description) {
                component.setDescription(dto.componentName);
            }
            component.setPropertiesBykey(propertyKey, dto);

            entity.setComponent(component);

            //const recalculation =  await this.recalculation();

            //const changedEntity = await entity.getChangedEntities();

            // Запись в базу данных, всех изменений и уведомление.
            // const result = this.engine.updateEntityShell(changedEntity?.map(e => e.getShell()));

            if (subscriber && subscriber.data?.key) {
               // this.engine.events.notifyEmit("One", subscriber, recalculation[0]);
            }
        } catch (e) {
            console.log('\x1b[41m%s\x1b[0m', 'editEntityToDto: ' +  (e as Error).message);
            service.sendError(subscriber, e);
        }
    }

    //************************************************* */
    
    notifyAllRooms(action: OrderActions, entityKey: string, ...args: any[]): void {
        super.notifyAllRooms(action, entityKey, ...args);
    }

   
    sendNotificationToSubscribers(action: OrderActions, ...args: any[]): void {
       console.log("отправка всем присутствующим");
       
    }

    sendToOneSubscriber(action: '/get-room-data', subscriber: YugWebsocket, service: SocketService,  msg: OrderSocketMessage, ...args: any[]): void;
    sendToOneSubscriber(action: OrderActions, subscriber: YugWebsocket, ...args: any[]): void {
        try {
            const [service, msg, ...other] = <[service: SocketService, msg: OrderSocketMessage, ...other: any[]]> args;
            msg.headers = subscriber.headers; // Передаем headers в сообщение.
            //console.log('msg', msg);
            
            service.sender<OrderSocketMessage>(subscriber, msg);
        } catch (e) {
            this.errorLoger("sendToOneSubscriber", e)
        }
    }

    subscribe(subscriber: YugWebsocket, service: SocketService, msg: OrderSocketMessage, ...args: any[]): this 
    subscribe(subscriber: YugWebsocket, ...args: any[]): this {
        const [service, ...other] = <[service: SocketService, ...other: any[]]>args;
        if (!this.subscribers.has(subscriber.data.key)) {
            subscriber.data.rooms = [...subscriber.data.rooms, this.key]
            this.subscribers.set(subscriber.data.key, subscriber);
            // отправка текущего состояния сущности заказа
            const promiseData = this.build(false);
            if (promiseData) {
                promiseData.then((order) => this.sendToOneSubscriber("/get-room-data", subscriber, service, {
                    method: "order", action: "/get-room-data", data:{
                        roomKey: this.key,
                        order: order.map(e => e.options)
                    }
                }))
            }
        }
        return this;
    }

    unsubscribe(subscriber: YugWebsocket): this {
        console.log("subscriber", subscriber.data.key, subscriber.data.rooms);
        
        if (this.subscribers.has(subscriber.data.key)) {
            this.subscribers.delete(subscriber.data.key);
            subscriber.data.rooms = [...subscriber.data.rooms.filter(key => key !== this.key)];
        }
        console.log("subscriber", subscriber.data.key, subscriber.data.rooms);
        console.log("order", this.entity?.name);
        return this;
    }
   
    async update(dt: number): Promise<void> {
        super.update(dt); // Вызов метода супер класса (обязательно).
    }
    destroy(): void {
        super.destroy() // Вызов метода супер класса (обязательно).  
    }
   
  
    errorLoger (methodName: string, error: any) {
        console.log('\x1b[41m\x1b[33m%s\x1b[0m', `Ошибка в методе: ${methodName} =>`, error?.message ? error?.message : error);
    }

}