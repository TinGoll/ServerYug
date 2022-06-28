
import { ApiEntity } from "yug-entity-system-async";
import FirebirdNativeAdapter from "../../data-base/adapters/FirebirdNativeAdapter";
import { getEntityToKey } from "../../systems/entity-db-system";
import databaseQuery from "../../utils/db-query";

export interface SampleNames {
    id: number;
    key: string;
    parentKey?: string;
    name: string;
    note?: string;
    category?: string;
}

interface SampleNamesDb {
    ID: number;
    KEY: string;
    PARENT_KEY: string
    NAME: string;
    NOTE: string;
    CATEGORY: string;
}

class OrderSampleService {
    /**
     * Получение наименованией шаблонов.
     * @param filter object 
     * @returns 
     */

    async getSampleNames({ key, name, note, category }: Partial<SampleNames>): Promise<SampleNames[]> {
        try {
            const db = new FirebirdNativeAdapter();
            const attachment = await db.connect();
            const transaction = await attachment.startTransaction();

            const onlyParents: boolean = true;

            const recordSet = await attachment.executeQuery(transaction, databaseQuery("get sample names"), []);
            const dbData = await recordSet.fetchAsObject<SampleNamesDb>();

            //const dbData = await db.executeRequest<SampleNamesDb>(databaseQuery("get sample names"), []);

            return sampleNamesConverterDbToData(dbData).filter((data, index, arr) => {
                let filter: boolean = true;
                if (key) {
                    const keyIndex = key.replace(/\;/g, " ").toUpperCase().includes(data.key.toUpperCase());
                    if (!keyIndex) filter = false;
                }
                if (name) {
                    const nameIndex = name.replace(/\;/g, " ").toUpperCase().includes(data.name.toUpperCase());
                    if (!nameIndex) filter = false;
                }
                if (note) {
                    const noteIndex = note.replace(/\;/g, " ").toUpperCase().includes(String(data.note?.toUpperCase()));
                    if (!noteIndex) filter = false;
                }
                if (category) {
                    const categoryIndex = category.replace(/\;/g, " ").toUpperCase().includes(data.category?.toUpperCase()!);
                    if (!categoryIndex) filter = false;
                }
                if (onlyParents && data.parentKey) filter = false; 
                return filter;
            })
        } catch (e) {
            throw e;
        }
    }

    async getApiEntityToKey (key: string): Promise<ApiEntity[]> {
        try {
            const keysArr = key.replace(/\ /g, "").split(";");
            const tempData: ApiEntity[] = [];
            for (const k of keysArr) {
                const apiData = await getEntityToKey(k);
                tempData.push(...apiData);
            }
            return tempData;
        } catch (e) {
            throw e;
        }
    }
    /**
     * Получение категорий сущностей
     * @returns 
     */
    async getEntityCategories (): Promise<string[]> {
        try {
            const db = new FirebirdNativeAdapter();
            const result = await db.executeRequest<{ CATEGORY: string}>(databaseQuery("get entity categories"), []);
            return result.map(c => c.CATEGORY);
        } catch (e) {
            throw e;
        }
    }
}

export default new OrderSampleService();

const sampleNamesConverterDbToData = (data: SampleNamesDb[] = []): SampleNames[] => {
    try {
        return data.map(d => ({ id: d.ID, key: d.KEY, name: d.NAME, 
            note: d.NOTE || undefined, category: d.CATEGORY || undefined, 
            parentKey: d.PARENT_KEY || undefined }));
    } catch (e) {
        throw e;
    }
}