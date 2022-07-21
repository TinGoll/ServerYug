import Engine, { ApiComponent, ApiEntity, RoomControllerHeart } from "yug-entity-system-async";

export default class YugRoomController extends RoomControllerHeart {
    constructor(engine: Engine) {
        super(engine);
    }

    // Загружает шаблоны компонентов и возвращает количество загруженных.
    async getComponentSamples (): Promise<ApiComponent[]> {
        try {
            if (!this.engine.components.length) {
                await this.engine.loadComponents({ sample: true });
            }
            return this.engine.components;
        } catch (e) {
            throw e;
        }
        
    }

    async getEntitySamples (): Promise<ApiEntity[]> {
        const samples = [...this.engine.values()].filter(e => {
            if (e && !e.options?.parentKey && !e.options?.sampleKey) {
                return true;
            }else{
                return false;
            }
        }).map(e => e.options);
        return samples;
    }

    notify(action: string, entityKey: string, ...args: any[]): void
    notify(...args: any[]): void {
        const [action, entityKey, ...other] = <[action: string, entityKey: string, ...others: any[]]> args;
        for (const iterator of this) {
            iterator.getEntityKeys()
                .then(keys => {
                    if (keys.find(k => k === entityKey)) {
                        iterator.sendNotificationToSubscribers(action, ...other)
                    }
                })
        }
    }

    async update(dt: number): Promise<void> {
        super.update(dt);
    }
}