import createEngine, { ApiComponent, Engine, Entity, PropertyValue } from "yug-entity-system";
import { getComponentSamples } from "../../actions/get-actions/engine-object";
import FirebirdNativeAdapter from "../../data-base/adapters/FirebirdNativeAdapter";
import { ComponentApiModel } from "../../db-models/component-model";
import { getEntityToKey, getGrandfather } from "../../systems/entity-db-system";
import { DbComponent } from "../../types/components/component-types";

interface ResponseOrderChange {
    componentKey: string;
    entityKey: string;
    value: PropertyValue
}

class OrderChangeService {

    async changeProperty(componentKey: string, value: PropertyValue, entityKey?: string): Promise<ResponseOrderChange[]> {
        try {
            //Engine.setMode("DEV")
            console.time('changeProperty');
            let grandFather: Entity | undefined = undefined;
            const changedCmp: ApiComponent[] = []; // Измененные компоненты
            const componentApi = await this.getComponentToKey(componentKey); // Достаем нужный компонент
            if (!componentApi || !componentApi.entityKey) throw new Error("Компонент не найден или не принадлежит сущности.");
            if (entityKey && componentApi.entityKey !== entityKey) throw new Error("Свойство не принадлежит сущности с данным ключем.")
            if (!entityKey ) entityKey = componentApi.entityKey;
            const engine = createEngine();
            engine.clearSamples();
            const entityApi = await getEntityToKey(entityKey) // Находим сущность содержащую компонент.
            const grApi = await getGrandfather(entityKey); // Достаем генеральную, высшую сущность.
            if (grApi) {
                // Если генеральная сущность есть, грузим в движек, поучаем в виде Entity
                const grfatherApi = await getEntityToKey(grApi.key)
                const [grCandidate] = engine.loadAndReturning(grfatherApi); 
                grandFather = grCandidate;
            }
            const [entity] = engine.loadAndReturning(entityApi); // Грузим в движек текущую сущность.
            entity.setPropertyValue<PropertyValue, string>(componentApi.componentName, componentApi.propertyName, value); // Присваиваем значение
            const result = entity.getPropertyValue<PropertyValue, string>(componentApi.componentName, componentApi.propertyName); // Достаем с помощью метода, присвоенное значение.

            if (!result) throw new Error("Не удалось присвоить новое значение.")

            if (grandFather) {
                // Пересчитываем формулы гранд сущности.
                grandFather.recalculationFormulas()
                console.log('grandFather', grandFather.getChangedComponents());
                changedCmp.push(...grandFather.getChangedComponents())
            }else{
                // Если гранд сущности нет, считаем формулы сущности.
                entity.recalculationFormulas()
                console.log('entity',entity.getChangedComponents());
                changedCmp.push(...entity.getChangedComponents())
            }
            console.timeEnd('changeProperty');
            // Сохраняем все изменения в БД
            for (const cmp of changedCmp) {
                await this.changeComponentValueToKey(cmp.key, cmp.propertyValue);
            }
            //Engine.setMode("PROD")
            return changedCmp.map(c => (<ResponseOrderChange>{componentKey: c.key, entityKey: c.entityKey, value: c.propertyValue}));
        } catch (e) {
            throw e;
        }
    }

    async getComponentToKey(key: string): Promise<ApiComponent | null> {
        try {
            const db = new FirebirdNativeAdapter();
            const componentDb = await db.executeRequest<DbComponent>(`SELECT * FROM COMPONENTS C WHERE C."KEY" = ?`, [key]);
            const [ componentApi ] = ComponentApiModel.convertDbDataToObject(componentDb);
            return componentApi || null;
        } catch (e) {
            throw e;
        }
    }

    async changeComponentValueToKey (key: string, value: PropertyValue): Promise<void> {
        try {
            const db = new FirebirdNativeAdapter();
            await db.execute(`UPDATE COMPONENTS C SET C.PROPERTY_VALUE = ? WHERE C."KEY" = ?`, [String(value), key]);
        } catch (e) {
            throw e;
        }
    }
}

export default new OrderChangeService();