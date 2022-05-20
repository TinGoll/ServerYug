import FirebirdNativeAdapter from "../data-base/adapters/FirebirdNativeAdapter";
import { History } from "../room-system/Room";

export const saveLog = async (history: History[] = []) => {
    const db = new FirebirdNativeAdapter();
    const attachment = await db.connect();
    const transaction = await attachment.startTransaction();

    try {
        const savable = await attachment.prepare(transaction, `
        INSERT INTO ENTITY_LOG (USER_NAME, "ACTION", ENTITY_KEY, TS, IMPORTANCE)
        VALUES (?, ?, ?, ?, ?) RETURNING ID, USER_NAME, "ACTION", ENTITY_KEY, TS, IMPORTANCE;`);
        for (const hs of history) {
            await savable.executeSingletonAsObject<{}>(transaction, [hs.userName, hs.action, hs.entityKey, hs.ts, hs.importance]);
        }
        await savable.dispose();
        await transaction.commit();
    } catch (e) {
        console.log(e);
        await transaction.rollback()
        throw e;
    }
}