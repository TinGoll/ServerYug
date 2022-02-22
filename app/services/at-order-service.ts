import { createItmDb } from "../firebird/Firebird";
import { BarcodesDb, IAtOrdersDb, IBarcode, IDependencies, IDependenciesDb, ILocationOrderDb, IStatusAndLocation, IStatusAndLocationDb, ITransferOrderElement, ITransferOrders, IWorkOrders, IWorkOrdersDb } from "../types/at-order-types";

import jfunction, { IAssociationNewAndOldSectors } from '../systems/virtualJournalsFun';
import dtoConverter from "../systems/dtoConverter";
import ApiError from "../exceptions/ApiError";
import { format } from 'date-format-parse';

import atOrderQuery from '../query/atOrder';
import { clearAdoptedQueryHash } from "../systems/adopted-order-system";
import { OldJournalEntry } from "../systems/old-journal-entry-system";
import { OrderPlanSystem } from "../systems/order-plans-system";
import ExtraDataSystem from "../systems/extra-data-system";
import { ExtraData } from "../types/extra-data-types";

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
                const associationNewAndOldSectors = await jfunction.getOldAndNewSectors();

                // Деревянно, переделать
                if (transfer?.idSector == 5 && accepted?.idSector == 24) transfer.idSector = 23;



                const [dependencies, rdependencies, allDependencies] = await this.dependenciesValidator(transfer?.idSector, accepted?.idSector);

                // Если в зависимости передающий этап являеться стартовым.
                const isStartingStage = (dependencies.find(d => d.startStage))?.startStage || false;
                if (!dependencies.length) {
                    transferOrderErrors.push(`Участок "${transfer?.sector}" не может передавать заказы в участок "${accepted?.sector}".`);
                    if(rdependencies) 
                        transferOrderErrors.push(`Однако, участок "${accepted?.sector}" может передавать заказы участку "${transfer?.sector}", проверьте правильность отсканированных карт.`)
                } 
                
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
                    `SELECT * FROM LOCATION_ORDER L WHERE L.ID_ORDER IN (${ordersToString}) AND L.ID_SECTOR = ${transfer?.idSector||0}`, []
                );

                const ordersAt = ordersFromDb.map(o => dtoConverter.convertAtOrderDbToDto(o));
                const orderWorks = orderWorksDb.map(w => dtoConverter.convertWorkOrdersDbToDto(w));
                const locationOrders =  orderLocationsDb.map(l => dtoConverter.convertLocationOrderDbToDto(l));
                const ordersExtraData: ExtraData[] = transferOrders.extraData || [];

                //if (!ordersAt.length) transferOrderErrors.push('Ни один из указанных заказов, не может быть передан, в виду отсутствия их в работе. Обратитесь к менеджеру заказа.');

                if(transferOrderErrors.length) throw ApiError.BadRequest("Ошибка приема - передачи заказов.", transferOrderErrors);

                for (const order of transferOrders.orders) {
                    // По умолчанию.
                    order.completed = true;
                    order.description = 'Успешно.'
                    order.modiferCount = 1;

                    const orderDb = ordersAt.find(o => o.id === order?.idOrder);
                    const works = orderWorks?.filter(w => w.orderId === order.idOrder);
                    const location = locationOrders.find(l => l.orderId === order.idOrder);
                    // Старый вариант комментария, обеденяем с новым через доп-свойства
                    if (order.comment) {
                        const extraComment = ordersExtraData.find(e => e.orderId === order.idOrder && e.group?.toUpperCase() === 'Comment'.toUpperCase());
                        if (extraComment) {
                            if(extraComment.data?.toUpperCase() !== order.comment.toUpperCase()) {
                                extraComment.data += `, ${order.comment}`;
                            }
                        }else{
                            const commentData: ExtraData ={
                                orderId: order.idOrder,
                                journalId: 0,
                                group: "Comment",
                                type: "text",
                                name: "Комментарий",
                                list: [],
                                data: order.comment
                            }
                            ordersExtraData.push(commentData);

                        }
                    }
                    // Получаем все экстра - данные по этому заказу.
                    const extraData = ordersExtraData.filter(e => e.orderId === order.idOrder);

                    if(!order?.idOrder || !orderDb) {
                        order.completed = false;
                        const statusAndLocation = await this.getOrderStatusAndLocation(order.idOrder);
                        order.description = 'Заказ не может быть переден, так как не находиться в работе, обратитесь к менеджеру заказа.';
                        if (statusAndLocation && statusAndLocation.statusOldNum >= 9 &&
                                statusAndLocation.statusOldNum <= 10) {
                            order.description = 'Заказ уже отгружен.';
                        }
                        if (statusAndLocation && statusAndLocation.statusOldId === 19) {
                            order.description = 'Этот заказ был закрыт, обратитесь к менеджеру."';
                        }
                         if (statusAndLocation && statusAndLocation.statusOldNum < 5) {
                            order.description = `Заказ не был выдан в работу и находиться в статусе ${statusAndLocation.statusOld}`;
                        }
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
                            /** Изменена логика проверки на наличие заказа в участке.
                             *  Если нет работ по передаче в текущий участок, то принимаем.
                             */
                            const isTherePlans = await this.sectorValidator(transfer?.idSector!, works, allDependencies, associationNewAndOldSectors)
                            console.log(isTherePlans);
                            
                            if (isTherePlans) {
                                order.completed = false;
                                order.description = `Заказ не был передан в участок ${transfer?.sector} и ${transfer?.sector} не являеться стартовым участком.`;
                                continue;
                            }
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

                if (ordersExtraData && ordersExtraData?.length) {
                    const extraDataSystem = new ExtraDataSystem()
                    await extraDataSystem.addToArray(ordersExtraData);
                } 
                /** Добавление заказа в старый журнал, выполняеться асинхронно без ожидания результата */
                const oldJournalEntry = new OldJournalEntry();
                oldJournalEntry.push(transferOrders, ordersAt, ordersExtraData, dependencies);
                /** Обновление системы планов, выполняеться асинхронно без ожидания результата. */
                const orderPlanSystem = new OrderPlanSystem();
                orderPlanSystem.refrash();

                const countOrders = transferOrders.orders?.filter(o => o.completed).length;
                let message = `${countOrders ? '☑️ Принято ' + countOrders + ' из ' + transferOrders.orders.length : '❌ Не один из заказов не принят.'}`;
                if (countOrders == transferOrders.orders.length)  message = `✅ Все заказы приняты. (${transferOrders.orders.length})`;
                for (const d of dependencies) {
                    clearAdoptedQueryHash(d.journalNameId);
                }
                return {message, orders: transferOrders.orders};
            } catch (e) {throw e;} finally { 
                db.detach();}
        } catch (e) {throw e;}

    }

    async sectorValidator (sectorId: number, works: IWorkOrders[], allDependencies: IDependencies[], 
                            associationNewAndOldSectors: IAssociationNewAndOldSectors[]): Promise<boolean> {
        try {
            const db = await createItmDb();
            try {
                const acceptedSectors: number[] = allDependencies.filter(d => d.accepted === sectorId).map(d => d.transfer);
                for (const s of acceptedSectors) {
                    const oldNames = associationNewAndOldSectors.filter(o => o.newId === s);
                     if (jfunction.isWorkPlan(oldNames.map(o => o.oldName), works)) return true;
                }
                return false;
            } catch (e) {
                throw e;
            } finally {
                db.detach();
            }
        } catch (e) {
            throw e;
        }
    }

    /**
     * 
     * @param transferSectorId - Передающий участок (ID)
     * @param acceptedSectorId - Принимающий участок (ID)
     * @returns - Массив из двух элементов, с массивом зависимостей. Первый элемент стандартные зависимости, второй реверсивные. Для проверки обратной передачи.
     */
    async dependenciesValidator (transferSectorId?: number, acceptedSectorId?: number): Promise<Array<IDependencies[]>> {
        try {
            const db = await createItmDb();
            try {
                // Получаем зависимости
                const dependenciesDb = await db.executeRequest<IDependenciesDb>(
                    `SELECT * FROM JOURNAL_DEP D WHERE D.ID_SECTOR_TRANSFER = ? AND D.ID_SECTOR_ACCEPTED = ?`, 
                    [transferSectorId||null, acceptedSectorId||null]);
                const dependencies: IDependencies[] = dependenciesDb.map(d => dtoConverter.convertDependenciesDbToDto(d));
                const reverseDependenciesDb = await db.executeRequest<IDependenciesDb>(
                    `SELECT * FROM JOURNAL_DEP D WHERE D.ID_SECTOR_TRANSFER = ? AND D.ID_SECTOR_ACCEPTED = ?`, 
                    [acceptedSectorId||null, transferSectorId||null]);
                const reverseDependencies: IDependencies[] = reverseDependenciesDb.map(d => dtoConverter.convertDependenciesDbToDto(d));
                const allDependenciesDb = await db.executeRequest<IDependenciesDb>(`SELECT * FROM JOURNAL_DEP D`);
                const allDependencies: IDependencies[] = allDependenciesDb.map(d => dtoConverter.convertDependenciesDbToDto(d));
                return [dependencies, reverseDependencies, allDependencies]
            } catch (e) {
                throw e;
            } finally {
                db.detach();
            }
        } catch (e) {
            throw e;
        }
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

    

    async getOrderStatusAndLocation(orderId: number): 
            Promise<IStatusAndLocation|null> {
        try {
            const query = ` SELECT
                            O.MANAGER,
                            GET_STATUS_NAME_TO_NUM(O.ORDER_STATUS) AS OLD_STATUS,
                            GET_STATUS_ID_TO_NUM(O.ORDER_STATUS) AS ID_OLD_STATUS,
                            O.ORDER_STATUS AS OLD_STATUS_NUM,
                            GET_JSTATUS_ID(O.ID) AS ID_STATUS,
                            GET_STATUS_NAME(GET_JSTATUS_ID(O.ID)) AS STATUS,
                            L.ID_SECTOR AS ID_LOCATION,
                            GET_SECTOR_NAME(L.ID_SECTOR) AS LOCATION
                            FROM ORDERS O
                            LEFT JOIN LOCATION_ORDER L ON (L.ID_ORDER = O.ID)
                            WHERE O.ID = ?`;
            const db = await createItmDb();
            const [orderDb] = await db.executeRequest<IStatusAndLocationDb>(query, [orderId]);
            if (!orderDb) throw ApiError.BadRequest("Ошибка получения данных по заказу.");
            const locationAndStatus = this.convertStatusAndLocation(orderDb);
            return locationAndStatus;
        } catch (e) {
            console.log(e);
            return null;
        }
    }
    convertStatusAndLocation(data: IStatusAndLocationDb): IStatusAndLocation {
        const result: IStatusAndLocation = {
            statusOldId: data.ID_OLD_STATUS,
            statusOld: data.OLD_STATUS,
            statusOldNum: data.OLD_STATUS_NUM,
            statusId: data.ID_STATUS,
            status: data.STATUS,
            manager: data.MANAGER,
            locationId: data.ID_LOCATION,
            location: data.LOCATION
        }
        return result;
    }
}

export default new AtOrderService();