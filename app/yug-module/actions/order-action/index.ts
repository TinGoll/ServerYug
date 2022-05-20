import { SocketService } from "../../services/socket-service";
import { OrderSocketMessage } from "../../types/socket-message-types";
import { YugWebsocket } from "../../types/socket-types";
import { addOrderElement, addPropertyToElement, changeEntityComponentToKey, closeOrder, createOrder, deleteOrderElement, editOrderElement, getAllOrders, getApiDirectory, getApiEntityToKey, getSampleNames, openOrder, removePropertyFromElement } from "./orderController";


const orderActions = async (ws: YugWebsocket, service: SocketService, msg: OrderSocketMessage) => {
    try {
        switch (msg.action) {
            // Метод для заказа
            case "/create-order": // Создание заказа
                createOrder({ ws, service, msg });
                break
            case "/open-order": // Открытие заказа
                openOrder({ ws, service, msg });
                break;
            case "/close-order": // Закрытие заказа
                closeOrder({ ws, service, msg });
                break;
            case "/add-order-element": // Добавление элемента
                addOrderElement({ ws, service, msg }); 
                break;
            case "/delete-order-element": // Удаление элемента из заказа
                deleteOrderElement({ ws, service, msg });
                break;
            case "/edit-order-element": // Редактирование значение элемента заказа.
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
            case "/get-sample-names": // Получение списка заказов (верхний уровень , с компонентами)
                getSampleNames({ ws, service, msg });
                break;
            case "/get-api-entity-to-key": // Получение сущности по ключу.
                getApiEntityToKey({ ws, service, msg });
                break;
            case "/change-entity-component": // Изменение установка парамметров комопнента сущности по ключу и новому компоненту.
                changeEntityComponentToKey({ ws, service, msg });
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