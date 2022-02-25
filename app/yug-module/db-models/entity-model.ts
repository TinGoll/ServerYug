import { ApiEntity, ApiEntityOptions } from "yug-entity-system";
import { FirebirdYugAdapter } from "../../dataBase/adapters/FirebirdAdapter";
import ApiError from "../../exceptions/ApiError";
import FirebirdAdapter from "../data-base/adapters/FirebirdAdapter";
import { ISQLAdapter } from "../data-base/adapters/ISQLAdapter";
import { DbEntity } from "../types/entity/entity-types";
import componentModel from "./component-model";

class EntityApiModel {
    private static keys: [keyof DbEntity, keyof ApiEntity][] = [
        ['ID', 'id'],
        ['ID_PARENT', 'parentId'],
        ['ID_SAMPLE', 'sampleId'],
        ['CATEGORY', 'category'],
        ['NAME', 'name'],
        ['NOTE', 'note'],
        ['DATE_CREATION', 'dateCreation'],
        ['DATE_UPDATE', 'dateUpdate'],
    ];

    /** Сохранение сущности, компонентов сущности, дочерних сущностей и компонентов дочерних сущностей. */
    async save (entity: ApiEntityOptions, db: ISQLAdapter = new FirebirdAdapter()): Promise<ApiEntityOptions> {
        try {
            const ent = {...entity};
            if (!ent?.signature) throw ApiError.BadRequest("Неверная сигнатура сущности.");
            if (ent.signature?.id) {
                await this.updateEntity(ent.signature, db);
            }else {
                const newEntry = await this.addEntity(ent.signature, db);
                ent.signature.id = newEntry.id
            }
            if (ent.components && ent.components.length) {
                const existsComponent = await componentModel.getToParameters({entityId: ent.signature.id});
                ent.components.forEach(c => {
                    const candidate = existsComponent.find(cand => 
                        cand.componentName === c.componentName &&
                        cand.propertyName === c.propertyName);
                    if (candidate) c.id = candidate.id;
                    c.entityId = ent.signature.id;   
                });
                ent.components = await componentModel.save(ent.components, db);
            }
            if (ent.сhildEntities && ent.сhildEntities.length) {
                for (const e of ent.сhildEntities) {
                    try {
                        e.signature.parentId = ent.signature.id;
                        const savableEntity = await this.save(e, db);
                        e.components = [...savableEntity.components];
                        e.signature = {...savableEntity.signature};
                        e.сhildEntities = [...savableEntity.сhildEntities];
                    } catch (err) {console.log(`Ошибка сохранения <${e.signature?.name}>`, err);}
                }
            }
            return ent;
        } catch (e) {
            throw e;
        }
    }
    /** Приватный метод для обновления существующей сущьности */
    private async updateEntity(signature: ApiEntity, db: ISQLAdapter = new FirebirdAdapter()): Promise<ApiEntity> {
        try {
            
            await db.execute(
                `UPDATE ENTITIES E
                SET E.ID_PARENT = ?,
                    E.ID_SAMPLE = ?,
                    E.CATEGORY = ?,
                    E.NAME = ?,
                    E.NOTE = ?,
                    E.DATE_UPDATE = CURRENT_TIMESTAMP
                WHERE E.ID = ?`,
                [
                    signature.parentId || null,
                    signature.sampleId || null,
                    signature.category || null,
                    signature.name || null,
                    signature.note || null,
                    signature.id
                ]
            )
            return {...signature};
        } catch (e) {
            throw e;
        }
    }
    /** Приватный метод для добавления новой сущьности */
    private async addEntity(signature: ApiEntity, db: ISQLAdapter = new FirebirdAdapter()): Promise<ApiEntity> {
        try {
            const newEntry = await db.executeAndReturning<{ID: number | null}>(`
                INSERT INTO ENTITIES (ID_PARENT, ID_SAMPLE, CATEGORY, NAME, NOTE, DATE_UPDATE)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                RETURNING ID;
            `, 
            [
                signature.parentId || null,
                signature.sampleId || null,
                signature.category || null,
                signature.name || null,
                signature.note || null,
            ])
            return {...signature, id: newEntry.ID || 0};
        } catch (e) {
            throw e;
        }
    }

}

export default new EntityApiModel();