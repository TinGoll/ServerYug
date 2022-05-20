
import FirebirdNativeAdapter from "../data-base/adapters/FirebirdNativeAdapter";
/**
 * Получение уникального номера заказа.
 * @returns id
 */
export const generatorOrderId = async (): Promise<number> => {
    try {
        const db = new FirebirdNativeAdapter();
        const [entry] = await db.executeRequest<{ ID: number }>(`SELECT GEN_ID( ORDER_NUMBER_GENERATOR, 1 ) as ID FROM RDB$DATABASE;`);
        return entry.ID;
    } catch (e) {
        throw e;
    }
}

export const generatorErrorMessage = (error: ErrorType): string => {
    switch (error) {
        case "order not open":
            return "Заказ с таким ключем не был открыт."
            break;
    
        default:
            return 'Неизвестная ошибка'
            break;
    }
}

type ErrorType = "order not open"