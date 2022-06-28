import Engine from "yug-entity-system-async";
import { notifyBroadcast, notifyOne } from "../actions/order-action/orderController";
import { deleteComponents, deleteEntities, insertComponents, insertEntities, loadComponents, loadingEntities, loadingEntity, loadingEntityLists, updateComponents, updateEntities } from "./storageMethods";
import YugRoomController from "./YugRoomController";

// Настройка движка, контролера комнат и событий.
 
const engine = Engine.create();

engine.intervalTime = 300; // Устанавливаем период обновления движка в мсек.
// Меняем стандартный контроллер на свой, что бы иметь доступ к управлению на сервере.
engine.roomController = new YugRoomController(engine);


//СОБЫТИЯ

const evenst = engine.events;
// Стандартные события, необходимые для работы движка. 
evenst 
    .onCreatedObjects("entity", insertEntities)         // Метод вставки новых сущностей в БД
    .onCreatedObjects("component", insertComponents);   // Метод вставки новых компонентов в БД

evenst
    .onUpdatableObjects("entity", updateEntities)       // Метод обновления сущностей в БД
    .onUpdatableObjects("component", updateComponents); // Метод обновления компонентов в БД

evenst
    .onDeletedObjects("entity", deleteEntities)         // Метод удаления сущностей в БД
    .onDeletedObjects("component", deleteComponents);   // Метод удаления компонентов в БД

evenst
    .onLoad("entity", "Find One", loadingEntity)        // Метод загрузки сущности в БД
    .onLoad("entity", "Find All", loadingEntities);     // Метод загрузки сущностей в БД


evenst
    // @ts-ignore
    .onLoad("entity", "Find List", loadingEntityLists); // Метод списков сущностей в БД

evenst
    .onLoad("component", "Find All", loadComponents);   // Загрузка компонентов.

evenst
    .onNotify("One", notifyOne)                         // Уведомление одного пользователя
    .onNotify("Broadcast", notifyBroadcast)             // Широковещательное уведомление

// loadingEntityLists({ 
//     componentNames: ["componentNames 1", "componentNames 2"],
//     categories: ["categories 1", "categories 2", "categories 3"],
//     names: ["names 1"],
//     notes: ["notes"],
//     sample: true

// })



// Предварительная загрузка шаблонов сущностей.
engine.loadEntitiyShells({ sample: true }).then((count) => {
    console.log("Загружено шаблонов:", count);
});
// Загрузка комопнентов
engine.loadComponents({ sample: true }).then((cmps) => {
    console.log("Загружено шаблонов компонентов:", cmps?.length)
})


export default engine;
