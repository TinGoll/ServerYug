import Room from "../../room-system/Room";
import RoomController from "../../room-system/RoomController";
import {
  OrderActions,
  OrderSocketMessage,
  SocketMessage,
} from "../../types/socket-message-types";
import { YugWebsocket, YugWebsocketAction } from "../../types/socket-types";
import { generatorOrderId } from "../../utils/generators";

import socketService, { SocketService } from "../../services/socket-service";
import orderSampleService, {
  SampleNames,
} from "../../services/orders/order-sample-service";
import Engine, { ApiComponent, Subscriber } from "yug-entity-system-async";
import engine from "../../engine";

import Entity from "yug-entity-system-async/dist/Entity";
import {
  EngineAction,
  EntityShell,
} from "yug-entity-system-async/dist/@engine-types";
import YugRoomController from "../../engine/YugRoomController";
import {
  CreateSampleEntityOrderData,
  CreateSampleComponentOrderData,
  AddPropertyToElement,
  RemovePropertyFromElement,
  GetAllOrderData,
  GetSampleNames,
  EditSampleComponent,
  EntityPreparationData,
  GetApiEntityToKey,
  ChangeEntityComponentToKey,
  AddOrderElementData,
  CloseOrderData,
  CreateOrderData,
  DeleteOrderElementData,
  EditOrderElementData,
  OpenOrderData,
  DeleteSampleComponentOrderData,
} from "./interfaces";
import EntityRoom from "../../engine/EntityRoom";

// ****************************************************************
// ************* Событие для оповещения YugWebsocket **************
// ****************************************************************

/**
 * @param engine
 * @param subscriber
 * @param args первым аргументом, должна быть data, вторым сообщение
 */
export const notifyOne = async (
  engine: Engine,
  subscriber: Subscriber,
  ...args: any[]
) => {
  try {
    const ws = <YugWebsocket>subscriber;
    const service = socketService;
    const [data, OriginalMessage, roomKey, ...other] = <
      [data: any, message: OrderSocketMessage, ...other: any[]]
    >args;
    let msg: OrderSocketMessage | undefined = undefined;
    if (data) {
      msg = {
        method: "order",
        action: "/get-room-data",
        data: { order: data, roomKey },
        headers: ws.headers,
      };
      service.sender(ws, msg);
    }
  } catch (e) {
    throw e;
  }
};

export const notifyBroadcast = async (
  engine: Engine,
  action: string,
  ...args: any[]
) => {
  const service = socketService;
  const [data, message, entityKey, ...other] = <
    [data: any, message: SocketMessage, entityKey: string, ...other: any[]]
  >args;
  const engineAction = <EngineAction>action;
  // Переменные для отправки.
  let msg: OrderSocketMessage | undefined = undefined;
  let condition: (ws: YugWebsocket) => Promise<boolean> = async (
    ws: YugWebsocket
  ) => false;

  if (
    engineAction === "create-entity-shell" ||
    engineAction === "update-entity-shell"
  ) {
    const createdApiEntity = <EntityShell[]>data || [];
    if (!createdApiEntity || !createdApiEntity.length) return;
    msg = {
      method: "order",
      action: "/get-room-data",
      data: { order: createdApiEntity?.map((sh) => ({ ...sh.options })) || [] },
    };

    console.log("notifyBroadcast", engineAction, msg);

    condition = async (ws: YugWebsocket): Promise<boolean> => {
      const firstKey = createdApiEntity[0]?.options?.key; // Первый ключ сущности в массиве
      for (const roomKey of ws.data.rooms) {
        const room = engine.roomController.getRoomToKey(roomKey);
        if (room && (await room.existsEntityKey(firstKey))) return true;
      }
      return false;
    };
  }

  ///delete-order-element
  if (engineAction === "delete-entity-shell") {
    const [deletedKeys, dependencyKeys] = <[string[], string[]]>data || [];
    if (!deletedKeys || !deletedKeys.length) return;
    msg = {
      method: "order",
      action: "/delete-room-element",
      data: {
        keys: deletedKeys,
      },
    };
    condition = async (ws: YugWebsocket): Promise<boolean> => {
      for (const roomKey of ws.data.rooms) {
        const room = engine.roomController.getRoomToKey(roomKey);
        let checkDeletes: boolean = false;
        for (const deletedKey of deletedKeys) {
          if (room && (await room.existsEntityKey(deletedKey))) {
            checkDeletes = true;
            break;
          }
        }
        return checkDeletes;
      }
      return false;
    };
  }
  const orderAction = <OrderActions>action;

  if (!msg) return;
  // console.log('\x1b[42m\x1b[30m%s\x1b[0m', 'Broadcast', action, args);
  service.broadcastsystem.extendedMailing(
    async (ws: YugWebsocket) => {
      msg!.headers = ws.headers;
      return msg!;
    },
    // Условие отправки
    condition
  );
};

// ****************************************************************
// ****************************************************************
// ****************************************************************

/**
 * Переопределяем класс стандартной комнаты на свой класс OrderRoom
 * @param key Ключ комнаты
 * @param engine объект движка
 * @param ent сущность
 * @returns Instance Room;
 */
const getRoomClass = (key: string, engine: Engine, ent: Entity): EntityRoom =>
  new EntityRoom(key, engine, ent);

export const createSampleEntity = async ({
  ws,
  service,
  msg,
}: YugWebsocketAction<OrderSocketMessage<CreateSampleEntityOrderData>>) => {
  try {
    const { entityDto, components = [], cloneKey } = msg.data;

    console.log(
      "entityDto",
      entityDto,
      "components",
      components,
      "cloneKey",
      cloneKey
    );

    if (!entityDto || !entityDto.name)
      throw new Error("Некорректный объект dto");
    const sapmles = await (<YugRoomController>(
      engine.roomController
    )).getEntitySamples();
    const candidate = sapmles.findIndex((e) => e?.name === entityDto.name);
    if (candidate > -1)
      throw new Error("Шаблон сущности с таким именем, уже существует.");
    let entity: Entity | null = null;
    if (cloneKey) {
      const promise = new Promise<Entity | null>((res, rej) => {
        engine.creator.CreateFromTemplateKey(
          cloneKey,
          (response) => {
            const [shell] = <EntityShell[]>response;
            engine.creator.open(shell.options.key).then((newEntity) => {
              newEntity?.setDto(entityDto);
              newEntity?.removeSampleKey();
              engine.updateEntityShell([newEntity!.getShell()]);
              // newEntity?.save();
              res(newEntity);
            });
          },
          (err) => {
            rej(err);
          }
        );
      });
      entity = await promise;
    } else {
      entity = await engine.creator.create(
        "entity",
        entityDto,
        undefined,
        undefined,
        ...components
      );
    }

    if (!entity) throw new Error(`Ошибка при создании сущности - шаблона.`);

    openOrder({
      ws,
      service,
      msg: {
        ...msg,
        data: { ...msg.data, entityKey: entity.key, newOrder: true },
      },
    }); // Открываем комнату
  } catch (e) {
    console.log("\x1b[41m%s\x1b[0m", (e as Error).message);
    service.sendError(ws, e);
  }
};

/**
 * Создание шаблона компонента.
 * @param param0
 */
export const createSampleComponent = async ({
  ws,
  service,
  msg,
}: YugWebsocketAction<OrderSocketMessage<CreateSampleComponentOrderData>>) => {
  try {
    const { componentDto, components = [] } = msg.data;
    if (!componentDto || !componentDto.componentName)
      throw new Error("Некорректный объект dto");

    if (!componentDto.propertyType) {
      componentDto.propertyType = "string";
    }
    const component = await engine.createSampleComponent(
      componentDto,
      // Если успех
      (cmps: ApiComponent[]) => {
        // Уведомить всех пользователей.
        service.sender<OrderSocketMessage<{ components: ApiComponent[] }>>(ws, {
          method: "order",
          action: "/sample-components",
          headers: msg.headers,
          data: { components: cmps },
        });
      },
      // Если ошибка
      (err, cmps) => {
        service.sendError(ws, err);
      },
      ...components
    );
    service.sender<OrderSocketMessage<{ components: ApiComponent[] }>>(ws, {
      method: "order",
      action: "/sample-components",
      headers: msg.headers,
      data: { components: component },
    });
  } catch (e) {
    console.log("\x1b[41m%s\x1b[0m", (e as Error).message);
    service.sendError(ws, e);
  }
};

/**
 * Удаление шаблона компонента
 * @param param0
 */
export const deleteSampleComponent = async ({
  ws,
  service,
  msg,
}: YugWebsocketAction<OrderSocketMessage<DeleteSampleComponentOrderData>>) => {
  try {
    const { componentKeys } = msg.data;
    if (!componentKeys || !componentKeys.length)
      throw new Error("Некорректный массив с ключами.");
    const deletedKeys = await engine.deleteComponents(componentKeys);
    for (const key of deletedKeys) {
      engine.getComponentList().delete(key);
    }

    service.sender<OrderSocketMessage<{ componentKeys: string[] }>>(ws, {
      method: "order",
      action: "/delete-sample-component",
      headers: msg.headers,
      data: { componentKeys: deletedKeys },
    });
  } catch (e) {
    console.log("\x1b[41m%s\x1b[0m", (e as Error).message);
    service.sendError(ws, e);
  }
};

/**
 * Создание заказа и открытие комнаты с одним пользовтаелем.
 * @param param сокет, служба управления сообщениями, сообщение.
 */
export const createOrder = async ({
  ws,
  service,
  msg,
}: YugWebsocketAction<OrderSocketMessage<CreateOrderData>>) => {
  try {
    const { entityKey } = msg.data;
    if (!entityKey) throw new Error("Не задан ключ сущности - шаблона."); // Если ключ шаблона не задан.
    const order_id = await generatorOrderId(); // Получение id из генератора.
    const entity = await engine.creator.CreateFromTemplateKey(entityKey);
    if (!entity) throw new Error(`Шаблон по указанному ключу не найден.`);
    openOrder({
      ws,
      service,
      msg: {
        ...msg,
        data: { ...msg.data, entityKey: entity.key, newOrder: true },
      },
    }); // Открываем комнату
  } catch (e) {
    console.log("\x1b[41m%s\x1b[0m", (e as Error).message);
    service.sendError(ws, e);
  }
};

const sendNewOrderList = (service: SocketService) => {
  const roomController = new RoomController(); // Создание объекта контроллера комнат.
  // // Отправка обновленного списка заказов, всем кто запрашивал заказы.
  // let orderList: Order[]; // список заказов.
  // let previusFilter: any; // Предыдущий фильтр, если фильтры не отличаются, то новый запрос в базу данных не отправляется.

  // // Расширенная система широковещательной рассылки.
  // service.broadcastsystem.extendedMailing(async (ws) => {
  //     const filter = ws.tempData?.getAllOrderData?.filter;
  //     if (filter) {
  //         if (!_.isEqual(previusFilter, filter) || !orderList) {
  //             orderList = await roomController.getAllOrders(filter);
  //             previusFilter = { ...filter };
  //         }
  //         const msg: OrderSocketMessage = {
  //             method: "order",
  //             action: "/get-all-orders",
  //             data: { orderList }
  //         }
  //         return  msg
  //     }
  // });
};

/**
 * Открытие заказа
 * @param param0
 */
export const openOrder = async ({
  ws,
  service,
  msg,
}: YugWebsocketAction<OrderSocketMessage<OpenOrderData>>): Promise<
  EntityRoom | null | undefined
> => {
  try {
    return new Promise((resolve, reject) => {
      const { entityKey, newOrder } = msg?.data;

      engine.roomController.openRoom(
        entityKey,
        (error, room) => {
          console.log(
            "ОБОЛОЧКА ОТКРЫТОЙ КОМНАТЫ " + room?.entity?.name,
            room?.entity?.getShell()
          );
          
          if (error || !room) {
            service.sendError(
              ws,
              error || new Error("Непредвиденная ошибка открытия комнаты")
            );
            return;
          }
          if (!room) {
            resolve(null);
          } else {
            console.log("subscribe", ws.data.user?.getUserName());
            room?.subscribe(ws, service, msg); // Подписка первого пользователя на комнату.
            resolve(<EntityRoom>room);
          }
        },
        getRoomClass
      ); // Указываем класс своей комнаты (для заказов).
    });
  } catch (e) {
    console.log("\x1b[41m%s\x1b[0m", (e as Error).message);
    service.sendError(ws, e);
  }
};
/**
 * Закрытие заказа
 * @param param0
 */
export const closeOrder = async ({
  ws,
  service,
  msg,
}: YugWebsocketAction<OrderSocketMessage<CloseOrderData>>) => {
  try {
    const { roomKey } = msg?.data;
    console.log("closeOrder", roomKey);
    const room = <EntityRoom | null>engine.roomController.getRoomToKey(roomKey);
    if (room) {
      room.unsubscribe(ws);
    }
  } catch (e) {
    console.log("\x1b[41m%s\x1b[0m", (e as Error).message);
    service.sendError(ws, e);
  }
};

/**
 * Добавление Сущности в заказ, по ключу
 * @param param0
 */
export const addOrderElement = async ({
  ws,
  service,
  msg,
}: YugWebsocketAction<OrderSocketMessage<AddOrderElementData>>) => {
  try {
    const { roomKey, entityKey, addedKey } = msg.data;

    console.log(roomKey, entityKey, addedKey);

    engine.roomController.openRoom(
      roomKey,
      (error, room) => {
        if (error || !room) {
          service.sendError(
            ws,
            error || new Error("Непредвиденная ошибка открытия комнаты")
          );
          return;
        }
        room.addEntityByKey(entityKey, addedKey, ws, service, msg);
      },
      getRoomClass
    );
  } catch (e) {
    console.log("\x1b[41m%s\x1b[0m", (e as Error).message);
    service.sendError(ws, e);
  }
};

export const addPropertyToElement = async ({
  ws,
  service,
  msg,
}: YugWebsocketAction<OrderSocketMessage<AddPropertyToElement>>) => {
  try {
    const { roomKey, entityKey, propertyKeys } = msg.data;

    engine.roomController.openRoom(
      roomKey,
      (error, room) => {
        if (error || !room) {
          service.sendError(
            ws,
            error || new Error("Непредвиденная ошибка открытия комнаты")
          );
          return;
        }
        room.addPropertyToKey(entityKey, propertyKeys, ws, service, msg);
      },
      getRoomClass
    );
  } catch (e) {
    console.log("\x1b[41m%s\x1b[0m", (e as Error).message);
    service.sendError(ws, e);
  }
};

export const removePropertyFromElement = async ({
  ws,
  service,
  msg,
}: YugWebsocketAction<OrderSocketMessage<RemovePropertyFromElement>>) => {
  try {
    const { roomKey, entityKey, propertyKeys } = msg.data;
    
    engine.roomController.openRoom(
      roomKey,
      (error, room) => {
        if (error || !room) {
          service.sendError(
            ws,
            error || new Error("Непредвиденная ошибка открытия комнаты")
          );
          return;
        }
        room.removePropertyByKeys(entityKey, propertyKeys, ws, service, msg);
      },
      getRoomClass
    );
  } catch (e) {
    console.log("\x1b[41m%s\x1b[0m", (e as Error).message);
    service.sendError(ws, e);
  }
};

/**
 * Удаление элемента заказа по ключу
 * @param param0
 */
export const deleteOrderElement = async ({
  ws,
  service,
  msg,
}: YugWebsocketAction<OrderSocketMessage<DeleteOrderElementData>>) => {
  try {
    const { roomKey, deletedKeys } = msg.data;

    engine.roomController.openRoom(
      roomKey,
      (error, room) => {
        if (error || !room) {
          service.sendError(
            ws,
            error || new Error("Непредвиденная ошибка открытия комнаты")
          );
          return;
        }
        room.deleteEntityByKey(deletedKeys, ws, service, msg);
      },
      getRoomClass
    );
  } catch (e) {
    console.log("\x1b[41m%s\x1b[0m", (e as Error).message);
    service.sendError(ws, e);
  }
};
/**
 * Редактирование елемента и шапки заказа
 * @param param0
 */
export const editOrderElement = async ({
  ws,
  service,
  msg,
}: YugWebsocketAction<OrderSocketMessage<EditOrderElementData>>) => {
  try {
    const { roomKey, editedKey, propertyKey, dto } = msg.data;
    engine.roomController.openRoom(
      roomKey,
      (error, room) => {
        if (error || !room) {
          service.sendError(
            ws,
            error || new Error("Непредвиденная ошибка открытия комнаты")
          );
          return;
        }
        // Изменен метод присвоения значнеия компоненту.
        //room.editEntityToKey(editedKey, propertyKey, value, ws);
        room.editEntityToDto(editedKey, propertyKey, dto, ws, service, msg);
      },
      getRoomClass
    );
  } catch (e) {
    console.log("\x1b[41m%s\x1b[0m", (e as Error).message);
    service.sendError(ws, e);
  }
};

/**
 * Получение спика заказов.
 * @param param0
 */
export const getAllOrders = async ({
  ws,
  service,
  msg,
}: YugWebsocketAction<OrderSocketMessage<GetAllOrderData>>) => {
  try {
    // СТАРЫЙ МЕТОД
    const { filter = {} } = msg.data || {};
    ws.tempData.getAllOrderData = { filter: { ...filter } };
    console.log(filter);
    const orders = await engine.events.loadEmit("entity", "Find List", {
      ...filter,
      sample: false,
    });

    service.sender<OrderSocketMessage>(ws, {
      method: "order",
      action: "/get-all-orders",
      data: { orderList: orders },
    });
  } catch (e) {
    console.log("\x1b[41m%s\x1b[0m", (e as Error).message);
    service.sendError(ws, e);
  }
};

/**
 * Получение списка имен/ключей номенклатуры.
 * @param param0
 */
export const getSampleNames = async ({
  ws,
  service,
  msg,
}: YugWebsocketAction<OrderSocketMessage<GetSampleNames>>) => {
  try {
    const { key, name, category, note } = msg.data.filter || {};
    const names = await orderSampleService.getSampleNames({
      key,
      name,
      category,
      note,
    });
    service.sender<OrderSocketMessage<SampleNames[]>>(ws, {
      method: "order",
      action: "/get-sample-names",
      headers: msg.headers,
      data: names,
    });
  } catch (e) {
    console.log("\x1b[41m%s\x1b[0m", (e as Error).message);
    service.sendError(ws, e);
  }
};

/**
 * Получение списка компонентов - шаблонов.
 * @param param0
 */
export const getSampleComponents = async ({
  ws,
  service,
  msg,
}: YugWebsocketAction<OrderSocketMessage<GetSampleNames>>) => {
  const components = await (<YugRoomController>(
    engine.roomController
  )).getComponentSamples();
  service.sender<OrderSocketMessage<{ components: ApiComponent[] }>>(ws, {
    method: "order",
    action: "/sample-components",
    headers: msg.headers,
    data: { components },
  });
};

/**
 * Редактирование компонента - шаблона.
 * @param param0
 */
export const editSampleComponents = async ({
  ws,
  service,
  msg,
}: YugWebsocketAction<OrderSocketMessage<EditSampleComponent>>) => {
  try {
    const { componentKey, componentDto } = msg.data;

    const cmp = engine.components.find((c) => c.key === componentKey);
    if (!cmp) throw new Error("Компонент не найден.");
    const component = await engine.creator.openSampleComponent(
      cmp.componentName
    );
    if (!component) throw new Error(" Комопнент не найдет");
    if (componentDto.componentName !== component.name) {
      component.name = componentDto.componentName;
    }
    if (
      componentDto.componentDescription &&
      componentDto.componentDescription !== component.description
    ) {
      component.description = componentDto.componentDescription;
    }

    console.log("editSampleComponents", componentKey, componentDto);

    component.setPropertiesBykey(componentKey, componentDto);
    const changed = component.changedComponents();

    engine
      .updateComponentApi(...changed)
      .then((cmps) => {
        // Обновление в движке
        for (const cmp of cmps) {
          const { is_unwritten_in_storage, is_changeable, ...indicators } =
            cmp.indicators;
          cmp.indicators = { ...indicators };

          if (engine.getComponentList().has(cmp.key)) {
            const currenCmp = engine.getComponentList().get(cmp.key);
            if (currenCmp) {
              engine.getComponentList().set(cmp.key, {
                ...cmp,
                id: currenCmp.id,
                key: currenCmp.key,
              });
            } else {
              engine.getComponentList().set(cmp.key, cmp);
            }
          }
        }
        // уведомление
        const msg = {
          method: "order",
          action: "/sample-components",
          data: { components: cmps },
        };
        // рассылка измененных комопнентов всем пользователям.
        service.broadcastsystem.broadcast(msg as any);
      })
      .catch((e) => service.sendError(ws, e));
  } catch (e) {
    console.log("\x1b[41m%s\x1b[0m", (e as Error).message);
    service.sendError(ws, e);
  }
};

/**
 * Функция для подготовки данных для редактора кода.
 * @param param0
 */
export const getPreparationData = async ({
  ws,
  service,
  msg,
}: YugWebsocketAction<OrderSocketMessage<EntityPreparationData>>) => {
  try {
    const { roomKey, entityKey, componentKey } = msg.data;

    engine.roomController.openRoom(
      roomKey,
      async (error, room) => {
        if (error || !room) {
          service.sendError(
            ws,
            error || new Error("Непредвиденная ошибка открытия комнаты")
          );
          return;
        }
        const entity = await room.getRoomEntity(entityKey);
        if (!entity) throw new Error("Сущность с таким ключем, не найдена.");
        const preparationData = await entity.getPreparationData(componentKey);

        service.sender<OrderSocketMessage>(ws, {
          method: "order",
          action: "/formula-preparation-data",
          headers: msg.headers,
          data: {
            ...msg.data,
            preparationData,
          },
        });
      },
      getRoomClass
    );
  } catch (e) {
    console.log("\x1b[41m%s\x1b[0m", (e as Error).message);
    service.sendError(ws, e);
  }
};

/**
 * Получение сущности (со всеми дочерними), по ключу.
 * @param param0
 */
export const getApiEntityToKey = async ({
  ws,
  service,
  msg,
}: YugWebsocketAction<OrderSocketMessage<GetApiEntityToKey>>) => {
  try {
    // const { key } = msg.data;
    // if (!key) throw new Error("Некорректный ключ сущности.")
    // const apiData = await orderSampleService.getApiEntityToKey(key);
    // service.sender<OrderSocketMessage<ApiEntity[]>>(ws, {
    //     method: 'order',
    //     action: '/get-api-entity-to-key',
    //     headers: msg.headers,
    //     data: apiData
    // });
  } catch (e) {
    console.log("\x1b[41m%s\x1b[0m", (e as Error).message);
    service.sendError(ws, e);
  }
};

/**
 * Изменить сущность по ключу.
 * @param param0
 */
export const changeEntityComponentToKey = async ({
  ws,
  service,
  msg,
}: YugWebsocketAction<OrderSocketMessage<ChangeEntityComponentToKey>>) => {
  try {
    // const { entityKey, apiComponent } = msg.data;
    // let changedComponents: ApiComponent[];
    // const engine = createEngine();
    // //  Engine.setMode("DEV")
    // if (!entityKey) {
    //     changedComponents = [apiComponent]
    // }else {
    //     const orderApi = await getEntityToKey(entityKey); // Получение api - объекта
    //     const [entity] = engine.loadAndReturning(orderApi); // загрузка сущности в движек.
    //     if (!apiComponent?.entityKey) throw new Error("Некорректный объект apiComponent");
    //     const editableEntity = entity.findToKey(apiComponent.entityKey); // Поиск редактируемой сущности.
    //     if (!editableEntity) throw new Error("Компонент не принадлижит данной сущности.");
    //     editableEntity.setApiComponentToKey(apiComponent.key, apiComponent);
    //     changedComponents = entity.recalculationFormulas().getChangedComponents();
    //     entity.resetСheckСhanges();
    //     const apiData = entity.build();
    //     engine.removeToKey(entity.key); // Удаляем шаблон из движка по ключу.
    // }
    // if (changedComponents.length) {
    //     await updateComponents(changedComponents);
    // }
    // service.sender<OrderSocketMessage<ApiComponent[]>>(ws, {
    //     method: 'order',
    //     action: '/change-entity-component',
    //     headers: msg.headers,
    //     data: changedComponents
    // });
  } catch (e) {
    console.log("\x1b[41m%s\x1b[0m", (e as Error).message);
    service.sendError(ws, e);
  }
};

/**
 * Получение списка API
 * @param param0
 */
export const getApiDirectory = async ({
  ws,
  service,
  msg,
}: YugWebsocketAction<OrderSocketMessage>) => {
  try {
    const roomController = new RoomController(); // Создание объекта контроллера комнат.
    const api = roomController.getApiDirectory();
    service.sender<OrderSocketMessage>(ws, {
      method: "order",
      action: "/get-api-directory",
      data: { api },
    });
  } catch (e) {
    console.log("\x1b[41m%s\x1b[0m", (e as Error).message);
    service.sendError(ws, e);
  }
};

/**
 * Получение списка API
 * @param param0
 */
export const tagActualization = async ({
  ws,
  service,
  msg,
}: YugWebsocketAction<OrderSocketMessage>) => {
  try {
    const message: OrderSocketMessage = {
      method: "order",
      action: "/tag-actualization",
      data: {
        ...msg.data,
      },
    };
    service.broadcastsystem.extendedMailing(
      async (ws: YugWebsocket) => {
        return message!;
      },
      async () => {
        return true;
      }
    );
  } catch (e) {
    console.log("\x1b[41m%s\x1b[0m", (e as Error).message);
    service.sendError(ws, e);
  }
};
