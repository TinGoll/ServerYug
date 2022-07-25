import e from "express";
import Engine, {
  ApiComponent,
  ApiEntity,
  PropertyValue,
  Room,
  Subscriber,
} from "yug-entity-system-async";
import {
  ComponentDto,
  EntityShell,
} from "yug-entity-system-async/dist/@engine-types";
import Entity from "yug-entity-system-async/dist/Entity";
import { notifyOne } from "../actions/order-action/orderController";
import { SocketService } from "../services/socket-service";
import { OrderSocketMessage } from "../types/socket-message-types";
import { YugWebsocket } from "../types/socket-types";

export default class EntityRoom extends Room<string, YugWebsocket> {
  constructor(key: string, engine: Engine, entity?: Entity) {
    super(key, engine, entity);
  }

  subscribe(
    subscriber: YugWebsocket,
    service: SocketService,
    originalMessage: OrderSocketMessage,
    ...args: any[]
  ): this {
    // console.log(
    //   "subscriber",
    //   subscriber.data.user,
    //   "HAS",
    //   this.subscribers.has(subscriber.data.key)
    // );

    if (!this.subscribers.has(subscriber.data.key)) {
      subscriber.data.rooms = [...subscriber.data.rooms, this.key];
      this.subscribers.set(subscriber.data.key, subscriber);
    }
    // отправка текущего состояния сущности заказа
    const promiseData = this.build<ApiEntity[]>("all data");
    console.log("promiseData unpacked", promiseData);
    promiseData
      .then((data) => {
        console.log("promiseData", data);
        if (data.length) {
          this.sendToOneSubscriber(subscriber, data, originalMessage, this.key);
        }
      })
      .catch((err) => {
        service.sendError(subscriber, <Error>err);
        console.log("\x1b[31m%s\x1b[0m", (<Error>err).message);
      });
    return this;
  }

  unsubscribe(subscriber: YugWebsocket): this {
    if (this.subscribers.has(subscriber.data.key)) {
      this.subscribers.delete(subscriber.data.key);
      subscriber.data.rooms = [
        ...subscriber.data.rooms.filter((key) => key !== this.key),
      ];
    }
    console.log(
      "unsubscribe:",
      subscriber.data?.user?.getUserName(),
      subscriber.data.rooms
    );
    return this;
  }

  // ----------------------------
  recalculation(): Promise<any> {
    throw new Error("Method not implemented.");
  }
  applyChanges(): Promise<any> {
    throw new Error("Method not implemented.");
  }
  // ----------------------------

  async addEntityByKey(
    key: string,
    addedKey: string,
    subscriber: YugWebsocket,
    service: SocketService,
    ...args: any[]
  ): Promise<Entity | null> {
    try {
      const [originalMessage, ...other] = args;
      const entity = await this._entity?.getEntityToKey(key);
      if (entity) {
        const addedEntity = await entity.addChildToKey(
          addedKey,
          (res: EntityShell[]) => {
            // Уведомление всех клиентов.
          }
        );
        if (!addedEntity)
          throw new Error(
            "Неудалось добавить сущность, ввиду возникшей ошибки."
          );
        this.sendToOneSubscriber(
          subscriber,
          [addedEntity.getShell().options],
          originalMessage,
          this.getKey(),
          ...other
        );
        return addedEntity;
      } else {
        throw new Error("Сущности с таким ключем не существует.");
      }
    } catch (e) {
      service.sendError(subscriber, e);
      return null;
    }
  }
  async addPropertyToKey(
    key: string,
    propertyKeys: string[],
    subscriber: YugWebsocket,
    service: SocketService,
    originalMessage: OrderSocketMessage,
    ...args: any[]
  ): Promise<any> {
    try {
      const cmps: ApiComponent[] = [];
      for (const propertyKey of propertyKeys) {
        const candidate = this.engine.components.find(
          (cmp) => cmp.key === propertyKey
        );
        if (candidate) cmps.push(candidate);
      }

      if (cmps.length) {
        const entity = await this.entity?.getEntityToKey(key);
        if (entity) {
          entity.addApiComponents(...cmps);

          // Отправка одному пользователю, добавленных компонентов.
          this.sendToOneSubscriber(
            subscriber,
            [
              {
                ...entity.getShell().options,
                components: [
                  ...entity
                    .getShell()
                    .options.components.filter(
                      (c) => c.indicators.is_not_sent_notification
                    ),
                ],
              },
            ],
            originalMessage,
            this.getKey(),
            ...args
          );

          const addedComponents = entity.getNotRecordedComponents();
          const updatedComponents = entity.getNotUpdatedComponents();

          const added = await this.engine.signComponentApi(...addedComponents);
          const updated = await this.engine.updateComponentApi(
            ...updatedComponents
          );

          entity.setApiComponents(
            ...added.map((c) => ({
              ...c,
              indicators: { ...c.indicators, is_not_sent_notification: true },
            })),
            ...updated.map((c) => ({
              ...c,
              indicators: { ...c.indicators, is_not_sent_notification: true },
            }))
          );

          // Уведомление всех клиентов.
        } else {
          throw new Error("Сущность по данному ключу не найдена.");
        }
      } else {
        throw new Error("все ключи не действительны");
      }
    } catch (e) {
      service.sendError(subscriber, e);
    }
  }

  async removePropertyByKeys(
    entityKey: string,
    keys: string[],
    subscriber: YugWebsocket,
    service: SocketService,
    originalMessage: OrderSocketMessage,
    ...args: any[]
  ) {
    try {
      if (this._entity) {
        const entity = await this.entity?.getEntityToKey(entityKey);
        if (!entity)
          throw new Error("Сущности с таким ключом, нет в данной команте.");

        const deletedKeys = await entity.removeComponentsToKeys(keys);
        const msg: OrderSocketMessage = {
          method: "order",
          action: "/remove-property-from-element",
          headers: originalMessage.headers,
          data: {
            keys: deletedKeys,
          },
        };
        service.sender<OrderSocketMessage>(subscriber, msg);
      } else {
        throw new Error("Комната пуста, сущность не открыта.");
      }
    } catch (e) {
      service.sendError(subscriber, e);
      return [];
    }
  }

  async deleteEntityByKey<
    D extends unknown = any,
    K extends unknown = string[]
  >(
    keys: K,
    subscriber: YugWebsocket,
    service: SocketService,
    originalMessage: OrderSocketMessage,
    ...args: any[]
  ): Promise<D> {
    try {
      if (this._entity) {
        let isDeletedRoom: boolean = false;
        const deletedKeys: string[] = [];
        if (keys) {
          const roomKeys = await this.getEntityKeys();
          if (Array.isArray(keys)) {
            for (const key of keys) {
              const candidate = roomKeys.find((k) => k === key);
              if (candidate) deletedKeys.push(candidate);
              if (key === this.key) isDeletedRoom = true;
            }
          } else {
            if (typeof keys === "string") {
              if (roomKeys.find((k) => k === keys)) {
                deletedKeys.push(keys);
              }
            } else {
              throw new Error("Некорректный ключ.");
            }
          }
        } else {
          throw new Error("Некорректный массив ключей.");
        }
        if (deletedKeys.length) {
          const allKeys = await this.engine.deleteEntityShell(deletedKeys);

          const keys = allKeys.reduce<string[]>(
            (acc, item) => [...acc, ...item],
            []
          );
          console.log("allKeys", keys);

          const msg: OrderSocketMessage = {
            method: "order",
            action: "/delete-room-element",
            headers: originalMessage.headers,
            data: {
              // keys: allKeys[0],
              keys: keys, // Изменен ответ при удаленении, для отправки ключей зависимостей
            },
          };
          service.sender<OrderSocketMessage>(subscriber, msg);
          if (isDeletedRoom) this.destroy();

          // Уведомление всех клиентов.
        } else {
          throw new Error("все ключи не действительны");
        }
        return <D>deletedKeys;
      } else {
        throw new Error("Комната пуста, сущность не открыта.");
      }
    } catch (e) {
      service.sendError(subscriber, e);
      return <D>[];
    }
  }

  // Пока не используется, доделать
  async editEntityToKey(
    key: string,
    propertyKey: string,
    value: PropertyValue,
    subscriber: YugWebsocket,
    service: SocketService,
    originalMessage: OrderSocketMessage,
    ...args: any[]
  ): Promise<any> {
    const entity = await this._entity?.getEntityToKey(key);
    if (this._entity && entity) {
      entity.setValueToKey(propertyKey, value);

      const result = await this._entity?.recalculation();
      this.applyChanges();

      // const changedEntity = await this._entity.getChangedEntities();
      // // Запись в базу данных, всех изменений и уведомление.
      // const result = this.engine.updateEntityShell(changedEntity?.map(e => e.getShell()), 'editEntityToKey');

      if (subscriber && subscriber.data?.key) {
        this.engine.events.notifyEmit("One", subscriber, result);
      }
    }
  }

  /**
   * Определение свойств компонента по средствам dto.
   * @param editedKey Ключ сущносити
   * @param propertyKey Ключ свойства
   * @param dto Набор определения кмпонента
   * @param subscriber Сокет.
   */
  async editEntityToDto(
    editedKey: string,
    propertyKey: string,
    dto: ComponentDto,
    subscriber: YugWebsocket,
    service: SocketService,
    originalMessage: OrderSocketMessage,
    ...args: any[]
  ) {
    try {
      const entity = await this.entity?.getEntityToKey(editedKey);
      if (!entity)
        throw new Error("Сущности с таким ключом, нет в данной команте.");
      const cmp = entity.getComponents().find((c) => c.key === propertyKey);
      if (!cmp)
        throw new Error("Свойства с таким ключом, нет в данной сущности.");
      const component = entity.getComponent(cmp.componentName);
      if (!component) throw new Error("Комопнент не найден в данной сущности.");

      if (dto.componentName && dto.componentName !== component.name) {
        component.rename(dto.componentName);
      }
      if (
        dto.componentDescription &&
        dto.componentDescription !== component.description
      ) {
        component.setDescription(dto.componentName);
      }

      component.setPropertiesBykey(propertyKey, dto);

      console.log("editEntityToDto", [...component]);

      entity.setComponent(component);

      // Отправка одному пользователю, добавленных компонентов.
      this.sendToOneSubscriber(
        subscriber,
        [
          {
            ...entity.getShell().options,
            components: [
              ...entity
                .getShell()
                .options.components.filter((c) => c.indicators.is_changeable),
            ],
          },
        ],
        originalMessage,
        this.getKey(),
        ...args
      );

      const updatedComponents = entity.getNotUpdatedComponents();
      const updated = await this.engine.updateComponentApi(
        ...updatedComponents
      );

      entity.setApiComponents(
        ...updated.map((c) => ({
          ...c,
          indicators: { ...c.indicators, is_not_sent_notification: true },
        }))
      );
      // Уведомление всех клиентов.
    } catch (e) {
      console.log(
        "\x1b[41m%s\x1b[0m",
        "editEntityToDto: " + (e as Error).message
      );
      service.sendError(subscriber, e);
    }
  }

  async build<D extends unknown = any>(
    type: "all data" | "only changed",
    ...args: any[]
  ): Promise<D> {
    try {
      const data: ApiEntity[] = [];
      if (!this.entity) throw new Error("Комната не содержит сущность.");
      await this.entity.recalculation();
      const buildData = await this.entity.fullBuild();
      data.push(...buildData);
      // if (type === "all data") {
      //     // Собираем сущности на двух уровнях. 0 - Сама сущность. 1 - шапки. 2 - Элементы заказа.

      //     data.push(this.entity?.getShell().options);
      //     const chldsLvl1 = await this.entity.getChildren();
      //     for (const iterator1 of chldsLvl1) {
      //         data.push(iterator1.getShell().options);
      //         const chldLvl2 = await iterator1.getChildren();
      //         for (const iterator2 of chldLvl2) {
      //             data.push(iterator2.getShell().options);
      //         }
      //     }
      // }

      // if (type === "only changed") {

      //     // Собираем сущности на двух уровнях. 0 - Сама сущность. 1 - шапки. 2 - Элементы заказа.
      //     const entityIndicators = this.entity?.getShell().options.indicators;
      //     if (entityIndicators.is_not_sent_notification) data.push(this.entity?.getShell().options);
      //     const chldsLvl1 = await this.entity.getChildren();
      //     for (const iterator1 of chldsLvl1) {
      //         const iterator1Indicators = iterator1.getShell().options.indicators;
      //         if (iterator1Indicators.is_not_sent_notification) data.push(iterator1.getShell().options);
      //         const chldLvl2 = await iterator1.getChildren();
      //         for (const iterator2 of chldLvl2) {
      //             const iterator2Indicators = iterator2.getShell().options.indicators;
      //             if (iterator2Indicators.is_not_sent_notification) data.push(iterator2.getShell().options);
      //         }
      //     }
      // }

      return <D>data;
    } catch (e) {
      throw e;
    }
  }
  notifyRooms(...args: any[]): Promise<any> {
    throw new Error("Method not implemented.");
  }
  sendNotificationToSubscribers(...args: any[]): void {
    throw new Error("Method not implemented.");
  }
  // Отправка одному подписчику в этой комнате.
  sendToOneSubscriber(
    subscriber: YugWebsocket,
    data: ApiEntity[],
    originalMessage: OrderSocketMessage,
    roomKey: string,
    ...args: any[]
  ): void {
    console.log("notifyOne", data);

    notifyOne(this.engine, subscriber, data, originalMessage, roomKey, ...args);
  }

  errorLoger(...args: any[]) {
    throw new Error("Method not implemented.");
  }
}
