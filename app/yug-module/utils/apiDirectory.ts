import { SocketMethods } from "../types/socket-message-types";

interface Api {
    name: string;
    description: string;
    method: SocketMethods;
    action: string;
    data: string;
}

export const apiDirectory = (): Api[] => {
    return [
        {
            name: "Создание нового заказа",
            
            description: "Создание нового заказа по ключу шаблона (и не только, но это другая история)",
            method: "order",
            action: "/create-order",
            data: JSON.stringify({
                entityKey: 'Ключ сущности (шаблона), по которой будет создан заказ'
            }, null, 2)
        },
        {
            name: "Список заказов",
            description: "Получение списка созданных заказов",
            method: "order",
            action: "/get-all-orders",
            data: JSON.stringify({
                filter: 'необязательный параметр, может содержат name?: string, category?: string и другие фильтры'
            }, null, 2)
        },
        {
            name: "Открыть заказ",
            description: "Открытие, ранее созданного заказа, по ключу, который можно получить, по запросу /get-all-orders",
            method: "order",
            action: "/open-order",
            data: JSON.stringify({
                entityKey: 'ключ заказа'
            }, null, 2)
        },
        {
            name: "Получить данные заказа",
            description: "Стандартный ответ, на какие либо действия или измнения, ответ отправляет сервер.",
            method: "order",
            action: "/get-order-data",
            data: JSON.stringify({
                order: 'Данные заказа, как правило, это шапка и ее дочерние сущности. Но в случае изменения, будут приходить только измененные сущности.'
            }, null, 2)
        },
        {
            name: "Получить имена пользователей",
            description: "Стандартный ответ, отправляется сервером, при изменении списка пользователей в комнате.",
            method: "order",
            action: "/get-current-user",
            data: JSON.stringify({
                userNames: 'Массив имен пользователей'
            }, null, 2)
        },
        {
            name: "Получить историю",
            description: "Стандартный ответ, отправляется сервером, при дополнении истории в комнате",
            method: "order",
            action: "/get-order-history",
            data: JSON.stringify({
                history: 'Массив истории, состоящий из имени пользователя, экшена, ключа комнаты и времении'
            }, null, 2)
        },
        {
            name: "Закрыть заказ",
            description: "Закрытие заказа (для отправляющего), точнее выход из комнаты. Если в комнате кто то остался, заказ комната будет висть в памяти. Но Обновления этому пользователю поступать больше не будут.",
            method: "order",
            action: "/close-order",
            data: JSON.stringify({
                entityKey: 'ключ заказа, который надо закрыть'
            }, null, 2)
        },
        {
            name: "Добавить элемент",
            description: "Добавление элемента в открытый заказ. Если заказ закрыт, будет возвращена ошибка.",
            method: "order",
            action: "/add-order-element",
            data: JSON.stringify({
                entityKey: "Ключ открытого заказа ", 
                addedKey: "Ключ шаблона сущности, которую надо добавить."
            }, null, 2)
        },
        {
            name: "Удалить элемент",
            description: "Удаление элемента из открытого заказа. Если заказ закрыт, будет возвращена ошибка.",
            method: "order",
            action: "/delete-order-element",
            data: JSON.stringify({
                entityKey: "Ключ открытого заказа ",
                deletedKey: "Ключ добавленной сущности, которую необходимо удалить."
            }, null, 2)
        },
        {
            name: "Изменить элемент",
            description: "Изменение свойств компоеннтов, в сущностях (в том числе и открытой шапке)",
            method: "order",
            action: "/edit-order-element",
            data: JSON.stringify({
                entityKey: "ключ заказа", 
                editedKey: "ключ сущности", 
                propertyKey: "ключ компонента", 
                value: "значение"
            }, null, 2)
        },


        {
            name: "Добавить компонент",
            description: "Добавить компонент в элемент заказа.",
            method: "order",
            action: "/add-property-to-element",
            data: JSON.stringify({
                entityKey: "ключ заказа",
                elementKey: "ключ сущности",
                apiComponent: "Компонент, который надо добавить",
            }, null, 2)
        },
        {
            name: "Удалить комопнент",
            description: "Удаление компонента из элемента заказа",
            method: "order",
            action: "/remove-property-from-element",
            data: JSON.stringify({
                entityKey: "ключ заказа",
                elementKey: "ключ сущности",
                propertyKey: "ключ компонента",
            }, null, 2)
        },
    ]
}