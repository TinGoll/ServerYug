import { toInteger } from "lodash";
import { ApiComponent } from "yug-entity-system";
import { FirebirdYugAdapter } from "../../dataBase/adapters/FirebirdAdapter";
import FirebirdAdapter from "../data-base/adapters/FirebirdAdapter";
import { ISQLAdapter } from "../data-base/adapters/ISQLAdapter";
import { DbComponent, EntityComponentNames } from "../types/components/component-types";

class ComponentApiModel {
    /** Соответсвие ключей базы данных и интерфейса комопнентов Api */
    private static keys: [keyof DbComponent, keyof ApiComponent][] = [
        ['ID', 'id'],
        ['ID_ENTITY', 'entityId'],
        ['COMPONENT_NAME', 'componentName'],
        ['COMPONENT_DESCRIPTION', 'componentDescription'],
        ['PROPERTY_NAME', 'propertyName'],
        ['PROPERTY_DESCRIPTION', 'propertyDescription'],
        ['PROPERTY_VALUE', 'propertyValue'],
        ['PROPERTY_FORMULA', 'propertyFormula'],
        ['PROPERTY_TYPE', 'propertyType'],
        ['ATTRIBUTES', 'attributes'],
        ['BINDING_TO_LIST', 'bindingToList'],
    ]

    async save(component: ApiComponent[], db: ISQLAdapter = new FirebirdAdapter()): Promise<ApiComponent[]> {
        try {
            const resultComponent: ApiComponent[] = [];
            const samples = [...component.filter(c => !c.entityId)];
            const comps = [...component.filter(c => !!c.entityId)];
            /** Получаем уже существующие шаблоны компонентов, в том случае, если это требуется */
            let existingSamples: ApiComponent[] = [];
            if (samples.length) {existingSamples = await this.getSamples();}
            /********************************************************************** */
            //               Добавление / Обновление компонента шаблона.
            /********************************************************************** */
            for (const component of samples) {
                try {
                    const candidate = existingSamples.find(c => 
                        c.componentName === component.componentName && 
                        c.propertyName === component.propertyName);
                    if (candidate) {
                        component.id = candidate.id;
                        await this.updateComponent({ ...candidate, ...component}, db)
                    }else {
                        const newEntry = await this.addComponent({...component}, db);
                        component.id = newEntry.id;
                    }
                } catch (e) { console.log(`save component <${component.componentName} - ${component.propertyName}> sample error`, e);}
            }
            /********************************************************************** */
            //               Добавление / Обновление компонента.
            /********************************************************************** */
            for (const component of comps) {
                try {
                    if (component.id) {
                        await this.updateComponent({...component});
                    }else {
                        const newEntry = await this.addComponent({...component});
                        component.id = newEntry.id;
                    }
                } catch (e) { console.log(`save component <${component.componentName} - ${component.propertyName}> error`, e);}
            }
            resultComponent.push(...samples, ...comps);
            return resultComponent;
        } catch (e) {
            throw e;
        }
    }
    /** Приватный метод, добавления компонента в базу данных.
     * @returns Возвращает мутированный компонент, с ID
     */
    private async addComponent(comp: ApiComponent, db: ISQLAdapter = new FirebirdAdapter()): Promise<ApiComponent> {
        try {
            const newEntry = await db.executeAndReturning<{ID: number}>(`
                INSERT INTO COMPONENTS (
                    ID_ENTITY, COMPONENT_NAME, COMPONENT_DESCRIPTION, PROPERTY_NAME, 
                    PROPERTY_DESCRIPTION, PROPERTY_VALUE, PROPERTY_FORMULA, PROPERTY_TYPE,
                    ATTRIBUTES, BINDING_TO_LIST
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING ID;`, 
            [
                comp.entityId || null, 
                comp.componentName || null, 
                comp.componentDescription || null, 
                comp.propertyName || null, 
                comp.propertyDescription || null, 
                comp.propertyValue ? String(comp.propertyValue) : null,
                comp.propertyFormula || null,
                comp.propertyType || null,
                comp.attributes || null,
                String(!!comp.bindingToList)
            ]);
            comp.id = newEntry.ID;
            return comp;
        } catch (e) {
            throw e
        }
    }
    /** Приватный метод обновления комопонента в базе данных
     * @returns возвращает компонент без изменений.
     */
    private async updateComponent(comp: ApiComponent, db: ISQLAdapter = new FirebirdAdapter()): Promise<ApiComponent> {
        try {
            db.execute(`
                UPDATE COMPONENTS C SET
                    C.ID_ENTITY = ?, C.COMPONENT_NAME = ?, C.COMPONENT_DESCRIPTION = ?, C.PROPERTY_NAME = ?, C.PROPERTY_DESCRIPTION = ?,
                    C.PROPERTY_VALUE = ?, C.PROPERTY_FORMULA = ?, C.PROPERTY_TYPE = ?, C.ATTRIBUTES = ?, C.BINDING_TO_LIST = ?
                WHERE C.ID = ?
            `,
            [
                comp.entityId || null, comp.componentName || null, comp.componentDescription || null, comp.propertyName || null,
                comp.propertyDescription || null, comp.propertyValue ? String(comp.propertyValue) : null,
                comp.propertyFormula || null, comp.propertyType || null, comp.attributes || null, String(!!comp.bindingToList),
                comp.id || null
            ]);
            return comp;
        } catch (e) {
            throw e;
        }
    }
    /** Получить все шаблоны комонентов. */
    async getSamples() {
        try {
            const db = new FirebirdAdapter();
            const result = await db.executeRequest<DbComponent>(`SELECT * FROM COMPONENTS C WHERE C.ID_ENTITY IS NULL`);
            return ComponentApiModel.convertDbDataToObject(result);
        } catch (e) {
            throw e;
        }
    }
    /** Получаем шаблон компонента по имени. */
    async getSampleToName<T extends string = EntityComponentNames>(componentName: T): Promise<ApiComponent[]> {
        try {
            const db = new FirebirdAdapter();
            const result = await db.executeRequest<DbComponent>('SELECT * FROM COMPONENTS C WHERE C.ID_ENTITY IS NULL AND C.COMPONENT_NAME = ?', [componentName]);
            return ComponentApiModel.convertDbDataToObject(result);
        } catch (e) {
            throw e;
        }
    }
   
    async getToParameters(parameters: Omit<Partial<ApiComponent>, 'id' | 'bindingToList'| 'attributes'>): Promise<ApiComponent[]> {
        try {
            const paramArray = Object.entries(parameters);
            const rquery = `
                SELECT * FROM COMPONENTS C 
                ${paramArray.length ? 'WHERE' : ''}
                ${paramArray.map(p => `${ComponentApiModel.getDbNameToKey((p[0] as keyof ApiComponent))} = ?`).join(' AND ')}
            `
            const db = new FirebirdAdapter();
            const result = await db.executeRequest<DbComponent>(rquery, [...paramArray.map(p => p[1])]);
            return ComponentApiModel.convertDbDataToObject(result);
        } catch (e) {
            throw e;
        }
    }


    private static getDbNameToKey(key: keyof ApiComponent): keyof DbComponent | undefined {
        try {
            const dbKey = ComponentApiModel.keys.find(k => k[1] === key) || [];
        return dbKey[0];
        } catch (e) {
            throw e;
        }
    }
    private static getKeyToDbName(key: keyof DbComponent): keyof ApiComponent | undefined {
        try {
            const dbKey = ComponentApiModel.keys.find(k => k[0] === key) || [];
            return dbKey[1];
        } catch (e) {
            throw e;
        }
    }

    private static convertDbDataToObject (data: DbComponent[]): ApiComponent[] {
        try {
            return data.map(d => {
                const component: ApiComponent = {
                    id: d.ID || undefined,
                    entityId: d.ID_ENTITY || undefined,
                    componentName: d.COMPONENT_NAME,
                    componentDescription: d.COMPONENT_DESCRIPTION,
                    propertyName: d.PROPERTY_NAME,
                    propertyDescription: d.PROPERTY_DESCRIPTION,
                    propertyValue: d.PROPERTY_VALUE,
                    propertyFormula: d.PROPERTY_FORMULA || undefined,
                    propertyType: d.PROPERTY_TYPE as 'string' | 'number' | 'date' || undefined,
                    attributes: d.ATTRIBUTES || undefined,
                    bindingToList: d.BINDING_TO_LIST || undefined
                }
                return component;
            })
        } catch (e) {
            throw e;
        }
    }

}

export default new ComponentApiModel();