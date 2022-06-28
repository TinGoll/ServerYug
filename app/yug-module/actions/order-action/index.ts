import { SocketService } from "../../services/socket-service";
import { OrderSocketMessage } from "../../types/socket-message-types";
import { YugWebsocket } from "../../types/socket-types";
import {
  addOrderElement,
  addPropertyToElement,
  changeEntityComponentToKey,
  closeOrder,
  createOrder,
  createSampleComponent,
  createSampleEntity,
  deleteOrderElement,
  editOrderElement,
  editSampleComponents,
  getAllOrders,
  getApiDirectory,
  getApiEntityToKey,
  getPreparationData,
  getSampleComponents,
  getSampleNames,
  openOrder,
  removePropertyFromElement,
} from "./orderController";


const orderActions = async (ws: YugWebsocket, service: SocketService, msg: OrderSocketMessage) => {
    try {
        switch (msg.action) {
            // Метод для заказа
            case "/create-room": // Создание заказа +
                createOrder({ ws, service, msg });
                break
            case "/open-room": // Открытие заказа +
                openOrder({ ws, service, msg });
                break;
            case "/close-room": // Закрытие заказа +
                closeOrder({ ws, service, msg });
                break;
            case "/add-room-element": // Добавление сущности в сущность +
                addOrderElement({ ws, service, msg }); 
                break;
            case "/delete-room-element": // Удаление сущности из заказа +
                deleteOrderElement({ ws, service, msg });
                break;
            case "/edit-room-element": // Редактирование значение сущности заказа. +
                editOrderElement({ ws, service, msg });
                break;
            case "/get-all-orders": // Получение списка заказов (верхний уровень , с компонентами)
                getAllOrders({ ws, service, msg });
                break;
            case "/add-property-to-element": // Получение списка заказов (верхний уровень , с компонентами)
                addPropertyToElement({ ws, service, msg });
                break;
            case "/remove-property-from-element": // Получение списка заказов (верхний уровень , с компонентами)
                removePropertyFromElement({ ws, service, msg });
                break;

            // Методы для конструктора.
            case "/create-sample-entity": // Создание шаблона
                createSampleEntity({ ws, service, msg })
                break;
         
            case "/create-sample-component": // Создание шаблона
                createSampleComponent({ ws, service, msg })
                break;

            case "/get-sample-names": // Получение списка заказов (верхний уровень , с компонентами)
                getSampleNames({ ws, service, msg });
                break;
            case "/get-api-entity-to-key": // Получение сущности по ключу.
                getApiEntityToKey({ ws, service, msg });
                break;
            case "/change-entity-component": // Изменение установка парамметров комопнента сущности по ключу и новому компоненту.
                changeEntityComponentToKey({ ws, service, msg });
                break;

            case "/sample-components":
                getSampleComponents({ ws, service, msg })
                break;
            case "/edit-sample-components": // изменение свойств компонента
                editSampleComponents({ ws, service, msg })
                break;
            case "/formula-preparation-data": // изменение свойств компонента
                getPreparationData({ ws, service, msg })
                break;
            
                // Метод для списка АПИ.
            case "/get-api-directory": // получение списка api.
                getApiDirectory({ ws, service, msg });
                break;
            default:
                break;
        }
    } catch (e) {
        service.sendError(ws, e, msg.headers)
    }
}

export default orderActions;
