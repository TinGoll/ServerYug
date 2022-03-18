import Engine, { ApiComponent } from "yug-entity-system";
import { ApiEntity } from "yug-entity-system/dist/types/entity-types";
import ApiError from "../../../exceptions/ApiError";
import componentModel from "../../db-models/component-model";
import { saveEntities } from "../../systems/entity-db-system";
import { EngineObjectData } from "../../types/socket-data-types";
import { PostSocketMessage, SuccessSocketMessage } from "../../types/socket-message-types";
import { YugWebsocketAction } from "../../types/socket-types";

export const registrationObject = async ({ ws, service, msg }: YugWebsocketAction<PostSocketMessage<EngineObjectData>>) => {
    try {
        const object = msg.data.object;
        for (const o of object) {
            Engine.registration(o);
        }
        console.log(object);
        service.sender<SuccessSocketMessage<{object: ApiComponent[] | ApiEntity[]}>>(ws, {
            method: 'success',
            message: `Ключи успешно присвоены.`,
            data: { object },
            headers: msg.headers
        });
    } catch (e) {
        console.log(e);
        service.sendError(ws, e);
    }
}

/** Создание / изменение engine объекта - компонента или сущьности, определяется автоматически. */
export const addEngineObject = async ({ ws, service, msg }: YugWebsocketAction<PostSocketMessage<EngineObjectData>>) => {
    try {
        /*
        const engine = new Engine();
        const creator = engine.creator();
        const component = creator.create('component', 'geometry', { componentDescription: 'Геометрия' });
        component
            .addProperty({ propertyName: 'height', propertyType: 'number', propertyDescription: 'Высота', propertyValue: 0 })
            .addProperty({ propertyName: 'width', propertyType: 'number', propertyDescription: 'Ширина', propertyValue: 0 })
            .addProperty({ propertyName: 'amount', propertyType: 'number', propertyDescription: 'Кол-во', propertyValue: 0 });

        const entity = creator.create('entity', 'Фасад витрина', { category: 'Фасад', note: 'Фасад глухой - содержит 4 профиля и 1 филёнку' });
        const entityProfile1 = creator.create('entity', 'Профиль левый', { category: 'Профиль',}).addComponent(component.build());
        const entityProfile2 = creator.create('entity', 'Профиль правый', { category: 'Профиль', }).addComponent(component.build());
        const entityProfile3 = creator.create('entity', 'Профиль нижний', { category: 'Профиль', }).addComponent(component.build());
        const entityProfile4 = creator.create('entity', 'Профиль верхный', { category: 'Профиль',}).addComponent(component.build());

        entity.addChild(entityProfile1).addChild(entityProfile2).addChild(entityProfile3).addChild(entityProfile4)

        entity.addComponent(component.build());
        */

        /*
        const engine = new Engine();
        const creator = engine.creator();
        const data: EngineObjectData = msg.data;
        creator.loadObjects(data.object);
        */
        /*
        const engine = new Engine();
        const creator = engine.creator();


        const geometry = creator.create('component', "geometry", {componentDescription:"Геометрия"})
            .addProperty({ propertyName: 'height', propertyType: 'number', propertyDescription: 'Высота', propertyValue: 0, attributes: "required" })
            .addProperty({ propertyName: 'width', propertyType: 'number', propertyDescription: 'Высота', propertyValue: 0, attributes: "required" })
            .addProperty({ propertyName: 'depth', propertyType: 'number', propertyDescription: 'Высота', propertyValue: 0 })
            .addProperty({ propertyName: 'amount', propertyType: 'number', propertyDescription: 'Высота', propertyValue: 0, attributes: "required" });
        const money = creator.create('component', "money", { componentDescription: "Деньги" })
            .addProperty({ propertyName: 'price', propertyType: 'number', propertyDescription: 'Цена', propertyValue: 0, attributes: "required" })
            .addProperty({ propertyName: 'cost', propertyType: 'number', propertyDescription: 'Стоимость', propertyValue: 0, attributes: "required" })
            .addProperty({ propertyName: 'type', propertyType: 'string', propertyDescription: 'Тип', propertyValue: 'Стоимость элемента', attributes: "required" });
        
        const workSborka = creator.create('component', "workSborka", { componentDescription: "Работа сборка" })
            .addProperty({ propertyName: 'cost', propertyType: 'number', propertyDescription: 'Стоимость', propertyValue: 0, attributes: "required" });
        const workShlif = creator.create('component', "workShlif", { componentDescription: "Работа шлифовка" })
            .addProperty({ propertyName: 'cost', propertyType: 'number', propertyDescription: 'Стоимость', propertyValue: 0, attributes: "required" });
        const workFinishing = creator.create('component', "workFinishing", { componentDescription: "Работа отделка" })
            .addProperty({ propertyName: 'cost', propertyType: 'number', propertyDescription: 'Стоимость', propertyValue: 0, attributes: "required" });

        const fasadGluhoy = creator.create('entity', 'Фасад глухой', {category:"Фасад", note:"Это описание фасада."});

        const profileTop = creator.create('entity', 'Профиль верхний', { category: "Профиль", });
        const profileLeft = creator.create('entity', 'Профиль левый', { category: "Профиль", });
        const profileBot = creator.create('entity', 'Профиль нижний', { category: "Профиль", });
        const profileRight = creator.create('entity', 'Профиль правый', { category: "Профиль", });

        const filenka = creator.create('entity', 'Филенка Мария Ивановна', { category: "Филёнка", });
        const mdfShild = creator.create('entity', 'Мдф Плита 6 мм.', { category: "МДФ", });
        const rubashka = creator.create('entity', 'Рубашка 1,2 мм', { category: "Рубашка", });

        fasadGluhoy.addComponent(geometry.build()).addComponent(money.build()).addComponent(workFinishing.build()).addComponent(workShlif.build()).addComponent(workSborka.build());
        filenka.addComponent(geometry.build()).addComponent(money.build()).addComponent(workFinishing.build()).addComponent(workShlif.build());
        profileTop.addComponent(geometry.build()).addComponent(money.build());
        profileBot.addComponent(geometry.build()).addComponent(money.build());
        profileLeft.addComponent(geometry.build()).addComponent(money.build());
        profileRight.addComponent(geometry.build()).addComponent(money.build());

        mdfShild.addComponent(geometry.build()).addComponent(money.build());
        rubashka.addComponent(geometry.build()).addComponent(money.build());

        fasadGluhoy.addChild(filenka.addChild(mdfShild).addChild(rubashka)).addChild(profileTop).addChild(profileBot).addChild(profileLeft).addChild(profileRight);
        */

        /*
        const component = creator.create('component', 'geometry', { componentDescription: 'Геометрия' });
        component
            .addProperty({ propertyName: 'height', propertyType: 'number', propertyDescription: 'Высота', propertyValue: 0 })
            .addProperty({ propertyName: 'width', propertyType: 'number', propertyDescription: 'Ширина', propertyValue: 0 })
            .addProperty({ propertyName: 'amount', propertyType: 'number', propertyDescription: 'Кол-во', propertyValue: 0 });


        const entity = creator.create('entity', 'Фасад витрина', { category: 'Фасад', note: 'Фасад глухой - содержит 4 профиля и 1 филёнку' });
        const entityProfile1 = creator.create('entity', 'Профиль левый', { category: 'Профиль', }).addComponent(component.build());
        const entityProfile2 = creator.create('entity', 'Профиль правый', { category: 'Профиль', }).addComponent(component.build());
        const entityProfile3 = creator.create('entity', 'Профиль нижний', { category: 'Профиль', }).addComponent(component.build());
        const entityProfile4 = creator.create('entity', 'Профиль верхный', { category: 'Профиль', }).addComponent(component.build());

        entity.addChild(entityProfile1).addChild(entityProfile2).addChild(entityProfile3).addChild(entityProfile4)

        entity.addComponent(component.build());
        */

        const data: EngineObjectData = msg.data;
        console.log('keys', data.object?.map(d => d.key));
        Engine.loadObjects(data.object);
        if (data?.type === "entity" || (data?.object as ApiEntity[]) && (<ApiEntity> data?.object[0])?.name ) {
            /** Если object - entity */
            const entityApiObject = data.object as ApiEntity[];
            const resultEntity = await saveEntities(entityApiObject);
            service.sender<PostSocketMessage<EngineObjectData>>(ws, {
                ...msg, data: { ...data, object: resultEntity }
            });
        } else if ((data?.type === 'component' && Array.isArray(data?.object)) || Array.isArray(data?.object) && (<ApiComponent> data.object[0]).componentName) {
            /** Если object - Component */
            const resultComponent = await componentModel.save(<ApiComponent[]> data.object);
            service.sender<PostSocketMessage<EngineObjectData>>(ws, {
                ...msg, data: { ...data, object: resultComponent }
            });
        } else {
            throw ApiError.BadRequest('Не удалось автоматически определить тип объекта. Используй type что бы конкретно указать тип.');
        }
    } catch (e) {
        console.log(e);
        service.sendError(ws, e);
    }
}
