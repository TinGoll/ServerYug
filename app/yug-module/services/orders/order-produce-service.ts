import createEngine, { ApiEntity, Engine, PropertyValue } from "yug-entity-system";
import { getEntityToKey, saveEntities } from "../../systems/entity-db-system";

class OrderProduceService {
    async produce(productKey: string, productorKey?: string) {
        try {
            console.time('produce add');
            const engine = createEngine();
            engine.clearSamples();

            const sampleApi = await getEntityToKey(productKey);
            const [sample] = engine.loadAndReturning(sampleApi);
            const sampleClone = sample.cloneAndRetutning().setSampleId(sample.getId());
            if (productorKey) {
                const productorApi = await getEntityToKey(productorKey);
                const [productor] = engine.loadAndReturning(productorApi);
                sampleClone.setParentKey(productor.key).setParentId(productor.getId());
            }
            sampleClone.recalculationFormulas();
            console.timeEnd('produce add');

            console.time('produce save');

            const cloneApi = await saveEntities(sampleClone.build());
            const [clone] = engine.loadAndReturning(cloneApi);
            
            //Engine.setMode("PROD")
            console.timeEnd('produce save');
            return clone.getOptions();
        } catch (e) {
            throw e;
        }
    }
}

export default new OrderProduceService();