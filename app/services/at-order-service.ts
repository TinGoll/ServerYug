import { createItmDb } from "../firebird/Firebird";
import { BarcodesDb, IAtOrdersDb, IBarcode, IDependencies, IDependenciesDb, ILocationOrderDb, ITransferOrderElement, ITransferOrders, IWorkOrdersDb } from "../types/at-order-types";

import jfunction from '../systems/virtualJournalsFun';
import dtoConverter from "../systems/dtoConverter";
import ApiError from "../exceptions/ApiError";
import setExtraData from "../systems/extradata-system";
import { format } from 'date-format-parse';

import atOrderQuery from '../query/atOrder';

class AtOrderService {
    /**
     * Участки по умолчанию.
     * Офис, упаковка, склад упакованных, отгрузка.
     */
    defaultSectorsId: number[] = [13, 5, 23, 24];

    async transferOrders (transferOrders: ITransferOrders): Promise<{message: string, orders: ITransferOrderElement[]}> {
        try {
            const db = await createItmDb();
             try {
                const transferOrderErrors: string[] = [];
                if (!transferOrders.idTransfer) transferOrderErrors.push('Передающий участок не может быть пустым');
                if (!transferOrders.idAccepted) transferOrderErrors.push('Принимающий участок участок не может быть пустым');
                if (!transferOrders.orders?.length) transferOrderErrors.push('Не добавлен ни один заказ, для приема.');

                for (let i = 0; i < transferOrders.orders.length; i++) {
                    const order = transferOrders.orders[i];
                    const count = transferOrders.orders.filter(o => o.idOrder === order.idOrder);
                    if (count.length > 1) transferOrderErrors.push(`Заказ № ${order.idOrder}, добавлен ${count.length} раз(а), заказ можно передать, только один раз.`)
                }
                // Получаем данные по штрих коду.
                const barcodesDb = await db.executeRequest<BarcodesDb>(`
                    SELECT B.BARCODE, B.ID_SECTOR, GET_SECTOR_NAME(B.ID_SECTOR) AS SECTOR, B.ID_EMPLOYERS, GET_EMP_NAME(B.ID_EMPLOYERS) AS EMPLOYEE,
                        COALESCE(B.STATUS_BARCODE, 0) AS BLOCKED
                    FROM SECTORS_BARCODE B WHERE UPPER(B.BARCODE) = UPPER(?) OR (UPPER(B.BARCODE) = UPPER(?))
                `, [transferOrders.idTransfer, transferOrders.idAccepted]);


                const barcodes: IBarcode[] = barcodesDb.map(b => dtoConverter.convertBarcodeDbToDto(b))

                const transfer = barcodes.find(b => b.barcode.toUpperCase() === transferOrders.idTransfer.toUpperCase());
                const accepted = barcodes.find(b => b.barcode.toUpperCase() === transferOrders.idAccepted.toUpperCase());
                const barcodeErrors =  this.barcodeValidator(transfer, accepted);
                if (barcodeErrors.length) throw ApiError.BadRequest('Проблема с карточками сотрудников мебельной фабрики.', barcodeErrors);
                // Получение участков.

                // Получаем старое название участка, по id нового участка.
                const namesTransferOldSector  = await jfunction.getNameOldSectorArrToIdNewSector(transfer!.idSector); 
                const namesAcceptedOldSector  = await jfunction.getNameOldSectorArrToIdNewSector(accepted!.idSector); 


                // Деревянно, переделать
                if (transfer?.idSector == 5 && accepted?.idSector == 24) transfer.idSector = 23;

                // Получаем зависимости
                const dependenciesDb = await db.executeRequest<IDependenciesDb>(
                    `SELECT * FROM JOURNAL_DEP D WHERE D.ID_SECTOR_TRANSFER = ? AND D.ID_SECTOR_ACCEPTED = ?`, 
                    [transfer?.idSector||null, accepted?.idSector||null]);
                
                const dependencies: IDependencies[] = dependenciesDb.map(d => dtoConverter.convertDependenciesDbToDto(d));

                // Если в зависимости передающий этап являеться стартовым.
                const isStartingStage = (dependencies.find(d => d.startStage))?.startStage || false;
                if (!dependencies.length) transferOrderErrors.push(`Участок ${transfer?.sector} не может передавать заказы в участок ${accepted?.sector}.`);
                const ordersToString = transferOrders.orders.map(o => o.idOrder).join(', ');

                const ordersFromDb = await db.executeRequest<IAtOrdersDb>(
                    `SELECT DISTINCT
                        O.ID, O.ITM_ORDERNUM, S.ID AS OLD_STATUS_ID, S.STATUS_DESCRIPTION, GET_JSTATUS_ID(O.ID) AS STATUS_ID,
                        J.ID AS JOURNAL_ID, N.NAME AS JOURNAL_NAME
                    FROM ORDERS_IN_PROGRESS O
                        LEFT JOIN LIST_STATUSES S ON (O.ORDER_STATUS = S.STATUS_NUM)
                        LEFT JOIN JOURNALS J ON (J.ID_ORDER = O.ID AND
                            EXISTS (SELECT T.ID FROM JOURNAL_TRANS T WHERE T.ID_JOURNAL = J.ID AND T.ID_SECTOR = ${transfer?.idSector} AND T.MODIFER < 0) AND
                            EXISTS (SELECT T.ID FROM JOURNAL_TRANS T WHERE T.ID_JOURNAL = J.ID AND T.ID_SECTOR = ${accepted?.idSector} AND T.MODIFER > 0))
                        LEFT JOIN JOURNAL_NAMES N ON (J.ID_JOURNAL_NAMES = N.ID)
                    WHERE O.ID IN (${ordersToString})`);

                const orderWorksDb = await db.executeRequest<IWorkOrdersDb>(`
                    SELECT P.ID, P.ORDER_ID, P.DATE_SECTOR, P.DATE_DESCRIPTION, P.COMMENT, P.DATE1, P.DATE2, P.DATE3
                    FROM ORDERS_DATE_PLAN P WHERE P.ORDER_ID IN (${ordersToString})
                `);

                const orderLocationsDb = await db.executeRequest<ILocationOrderDb>(
                    `SELECT * FROM LOCATION_ORDER L WHERE L.ID_ORDER IN (${ordersToString}) AND L.ID_SECTOR = ${transfer?.idSector}`, []
                );

                const ordersAt = ordersFromDb.map(o => dtoConverter.convertAtOrderDbToDto(o));
                const orderWorks = orderWorksDb.map(w => dtoConverter.convertWorkOrdersDbToDto(w));
                const locationOrders =  orderLocationsDb.map(l => dtoConverter.convertLocationOrderDbToDto(l));

                if (!ordersAt.length) transferOrderErrors.push('Ни один из указанных заказов, не может быть передан, в виду отсутствия их в работе. Обратитесь к менеджеру заказа.');
                if(transferOrderErrors.length) throw ApiError.BadRequest("Ошибка приема - передачи заказов.", transferOrderErrors);

                for (const order of transferOrders.orders) {
                    // По умолчанию.
                    order.completed = true;
                    order.description = 'Успешно.'
                    order.modiferCount = 1;

                    const orderDb = ordersAt.find(o => o.id === order?.idOrder);
                    const works = orderWorks.filter(w => w.orderId === order.idOrder);
                    const location = locationOrders.find(l => l.orderId === order.idOrder);
                    const extraData = transferOrders.extraData.filter(e => e.orderId === order.idOrder);

                    if(!order?.idOrder || !orderDb) {
                        order.completed = false;
                        order.description = 'Заказ не может быть переден, так как не находиться в работе, обратитесь к менеджеру заказа.';
                        continue;
                    }
                    if (!jfunction.isWorkPlan(namesTransferOldSector, works)) {
                        const defaultTransferSectorId = this.defaultSectorsId.find(s => transfer?.idSector);
                        if (!defaultTransferSectorId) {
                            order.completed = false;
                            order.description = `Не запланированы работы, по участку ${transfer?.sector}. Обратитесь к менеджеру заказа.`;
                            continue;
                        }
                    }
                    if (!jfunction.isWorkPlan(namesAcceptedOldSector, works)) {
                        const defaultAcceptedSectorId = this.defaultSectorsId.find(s => transfer?.idSector);
                        if (!defaultAcceptedSectorId) {
                            order.completed = false;
                            order.description = `Не запланированы работы, по участку ${accepted?.sector}. Обратитесь к менеджеру заказа.`;
                            continue;
                        }
                    }

                    if(orderDb.journalId) {
                        order.completed = false;
                        order.description = `Заказ уже был передан из участка ${transfer?.sector} в участок ${accepted?.sector}. Повторная передача невозможна`;
                        continue;
                    }
                    order.modiferCount = location?.modifer || 1
                    if (!isStartingStage) {
                        if (!location?.modifer || location.modifer <= 0) {
                            order.completed = false;
                            order.description = `Заказ не был передан в участок ${transfer?.sector} и ${transfer?.sector} не являеться стартовым участком.`;
                            continue;
                        }
                    }

                    const query = `
                        execute block
                        returns (ID integer)
                        as
                        begin
                            insert into JOURNALS (ID_ORDER, ID_JOURNAL_NAMES, TS, TRANSFER_DATE)
                            values (${order.idOrder}, ${dependencies[0]?.journalNameId||null}, CURRENT_TIMESTAMP, '${format(transferOrders.date||new Date(), 'DD.MM.YYYY HH:mm:ss')}') returning ID into :ID;

                            insert into JOURNAL_TRANS (ID_EMPLOYEE, ID_SECTOR, ID_JOURNAL, MODIFER)
                            values (${transfer?.employeeId||null}, ${transfer?.idSector||null}, :ID, ${Math.abs(order.modiferCount) * -1});

                            insert into JOURNAL_TRANS (ID_EMPLOYEE, ID_SECTOR, ID_JOURNAL, MODIFER)
                            values (${accepted?.employeeId||null}, ${accepted?.idSector}, :ID, ${Math.abs(order.modiferCount)});

                            insert into cost_of_work (id_journal, id_work_price, price)
                            select :ID as id_journal, p.id as id_price, p.price from work_prices p
                            where p.id_sector = ${transfer?.idSector||null};
                            suspend;
                        end`;
                        
                    const [newJournalEntry] = await db.executeRequest<{ID: number}>(query);
                    
                    if (!newJournalEntry.ID) {
                        order.completed = false;
                        order.description = `Ошибка сохранения заказа в журнале. Обратитесь к разработчику.`;
                        continue;
                    }   

                    if (dependencies[0].statusAfterOldId) {
                        const oldStatusNum = await jfunction.getStatusNumOldToIdStatusOld(dependencies[0]?.statusAfterOldId);

                        if (oldStatusNum) await db.execute(`update ORDERS O set O.ORDER_STATUS = ${oldStatusNum} where O.ID = ${order.idOrder}`);
                    }
                    if (dependencies[0].statusAfterId) {
                        await db.execute(`INSERT INTO JOURNAL_STATUS_LIST (ID_ORDER, ID_JOURNAL, ID_STATUS)
                                                VALUES(${order.idOrder}, ${newJournalEntry.ID}, ${dependencies[0].statusAfterId})`);
                    }
                    for (const data of extraData) {
                        data.journalId = newJournalEntry.ID   
                    }
                }

                if (transferOrders.extraData &&transferOrders.extraData?.length) {
                    const countExtraData = await setExtraData(transferOrders.extraData);
                } 

                const countOrders = transferOrders.orders.filter(o => o.completed).length;
                let message = `${countOrders ? '☑️ Принято ' + countOrders + ' из ' + transferOrders.orders.length : '❌ Не один из заказов не принят.'}`;
                if (countOrders == transferOrders.orders.length)  message = `✅ Все заказы приняты. (${transferOrders.orders.length})`;
                return {message, orders: transferOrders.orders};
            } catch (e) {throw e;} finally { 
                console.log('at order - db.detach');
                db.detach();}
        } catch (e) {throw e;}

    }

    barcodeValidator (transfer?: IBarcode, accepted?: IBarcode): string[] {
        const errors: string[] = [];
        try {
            if (!transfer) errors.push('Штрих - код передающего участка, не обнаружен. Попробуйте еще раз. Если проблема повторяется, обратитесь к администратору.');
            if (!accepted) errors.push('Штрих - код принимающего участка, не обнаружен. Попробуйте еще раз. Если проблема повторяется, обратитесь к администратору.');
            if(transfer && transfer?.blocked) errors.push('Карта передающей стороны заблокирована');
            if(accepted && accepted?.blocked) errors.push('Карта принимающей стороны заблокирована');
            if (!transfer?.idSector || transfer?.idSector === 14) errors.push('Карта передающей стороны не инициализирована.');
            if (!accepted?.idSector || accepted?.idSector === 14) errors.push('Карта принимающей стороны не инициализирована.');
            return errors;
        } catch (e) {
            errors.push('Ошибка проверки штрих -кодов.');
            return errors;
        }
    }

     /**
     * Возвращает массив штрих-кодов.
     * @returns BarcodesDb[] 
     */
    async getBarcodes(): Promise<BarcodesDb[]> {
        try {
            const query: string = atOrderQuery.get('get_barcodes');
            const db = await createItmDb();
            const barcode = await db.executeRequest<BarcodesDb>(query);
            db.detach();
            return barcode;
        } catch (e) {
            throw e;
        }
    }
    /**
     * 
     * @returns 
     */
    async getJournalNames(): Promise<BarcodesDb[]> {
        try {
            const query: string = atOrderQuery.get('get_barcodes');
            const db = await createItmDb();
            const barcode = await db.executeRequest<BarcodesDb>(query);
            db.detach();
            return barcode;
        } catch (e) {
            throw e;
        }
    }
}

export default new AtOrderService();