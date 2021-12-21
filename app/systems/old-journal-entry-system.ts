import { createItmDb, Firebird } from "../firebird/Firebird";
import { IAtOrder, IDependencies, IDependenciesDb, ITransferOrderElement, ITransferOrders } from "../types/at-order-types";
import { IExtraData } from "../types/extraDataTypes";
import { JournalSectorList } from "../types/journalTypes";
import { getSectors } from "./virtualJournalsFun";
import { format } from 'date-format-parse';
import adoptedOrderService from "../services/adopted-order-service";
import { IAdopted } from "../types/adopted-orders-types";

export class OldJournalEntry {
    private static instance: OldJournalEntry;

    private sectors: JournalSectorList[] = [];
    private statuses: {id: number, name: string, order: number}[] = []

    constructor() {
        if (OldJournalEntry.instance) {
            return OldJournalEntry.instance;
        }
        OldJournalEntry.instance = this;
    }

    async push(tramsferOrders: ITransferOrders, atOrders: IAtOrder[], extraData: IExtraData[], dependencies: IDependencies[]): Promise<void> {
        try {
            if (!dependencies.length) return;
            switch (dependencies[0]?.journalNameId) {
                case 1:
                    break;
                case 2:
                    break;
                case 3:
                    break;
                case 4:
                    /** Журнал упаковки/отгрузки */
                    await this.pushToJournalPacking(tramsferOrders, extraData, dependencies);
                    break;
                default:
                    break;
            }
        } catch (e) {
            console.log('Ошибка добавления заказа в старый журнал:', e);
        }
    }

    async pushOld() {
        try {
            const db = await createItmDb();
            try {
                const adopedAll = await adoptedOrderService.getAdoptedOrders(4, [4], {
                    limit: 500
                });

                const adoped: IAdopted = {
                    orders: adopedAll.orders.filter(a => {
                        //console.log(a.accepted);
                        
                        return a.accepted === 'Отгрузка';
                    }),
                    count: 0,
                    pages: 0
                }

                const extraData: IExtraData[] = [];
                const dependencies: IDependencies[] = [{
                    accepted: 0, journalNameId: 0, id: 0, startStage: false, statusAfterOldId: 0, transfer: 0, statusAfterId: 8
                }]

                const orders: ITransferOrders = {
                    idTransfer: "",
                    idAccepted: "",
                    date: new Date(),
                    orders: [],
                    extraData: []
                }

                for (const torder of adoped.orders) {
                    const element: ITransferOrderElement = {
                        idOrder: torder.id,
                        comment: "",
                        completed: true
                    }
                    orders.orders.push(element);
                    const comments: IExtraData[] = !torder.data?.comments ? [] : torder.data.comments?.map(c => {
                        const comm: IExtraData = {
                            orderId: c.orderId!,
                            journalId: c.journalId!,
                            group: "",
                            type: "",
                            name: c.name,
                            list: [],
                            data: c.data
                        }
                        return comm;
                    });
                    const other: IExtraData[] = !torder.data?.extraData ? [] : torder.data.extraData?.map(c => {
                        const comm: IExtraData = {
                            orderId: c.orderId!,
                            journalId: c.journalId!,
                            group: "",
                            type: "",
                            name: c.name,
                            list: [],
                            data: c.data
                        }
                        return comm;
                    });
                    const edata: IExtraData[] = [...comments, ...other];
                    for (const d of edata) {
                        extraData.push(d);
                    }
                }
                
                //console.log(orders);
                
               await this.pushToJournalPacking(orders, extraData, dependencies);
                
                
            } catch (e) {
                throw e;
            } finally {
                db.detach();
            }
        } catch (e) {
            console.log('Ошибка добавления старых заказов в упаковку', e);
            
        }
    }

    private async pushToJournalPacking (tramsferOrders: ITransferOrders, extraData: IExtraData[], dependencies: IDependencies[]): Promise<void> {
        try {
            const db = await createItmDb();
            try {
                if (dependencies[0]?.statusAfterId === 7) {
                    const complitedUpack = await db.executeRequest<{ID: Number}>(`
                        SELECT J.ORDER_ID AS ID FROM JOURNAL_UPACK J WHERE J.ORDER_ID IN (${tramsferOrders.orders.map(o => o.idOrder).join(',')})
                    `);
                    /** Проверяем внесен ли в журнал, если да, то отменяем внесение */
                    for (const torder of tramsferOrders.orders) {
                        const id = complitedUpack.find(o => o.ID === torder.idOrder);
                        if (id) torder.completed = false;
                    }
                    for (const torder of tramsferOrders.orders) {
                        if (torder.completed) {
                            const edata = extraData.filter(e => e.orderId === torder.idOrder);
                            const box = edata.find(e => e.name.toUpperCase() == 'Количество упаковок'.toUpperCase());
                            const timePack = edata.find(e => e.name.toUpperCase() == 'Время упаковки'.toUpperCase());
                            const comments = edata.filter(e => e.name.toUpperCase() === 'Комментарий'.toUpperCase());
                            const DatePack = timePack?.data ? new Date(timePack?.data): new Date();
                            const countBox = Number(box?.data);

                            const upackQuery = `INSERT INTO JOURNAL_UPACK (ORDER_ID, TIME_PACK, BOX_COUNT, COMMENT, PACK_TYPE, DELAY, TS, DATE_PACK)
                                        VALUES (${torder.idOrder}, '${format(DatePack, 'HH:mm')}', ${countBox||0}, '${comments.map(c => c.data).join(', ')}', 'Полностью', 0, CURRENT_TIMESTAMP, '${format(DatePack, 'DD.MM.YYYY')}')`
                            db.execute(upackQuery);
                            console.log(torder.idOrder, 'Добавлен в журнал упаковки');
                            
                        }
                    }
                }

                if (dependencies[0]?.statusAfterId === 8) {

                    const complitedOut = await db.executeRequest<{ID: Number}>(`
                        SELECT J.ORDER_ID AS ID FROM JOURNAL_OUT J WHERE J.ORDER_ID IN (${tramsferOrders.orders.map(o => o.idOrder).join(',')})
                    `);
                    /** Проверяем внесен ли в журнал, если да, то отменяем внесение */
                    for (const torder of tramsferOrders.orders) {
                        const id = complitedOut.find(o => o.ID === torder.idOrder);
                        if (id) torder.completed = false;
                    }

                    for (const torder of tramsferOrders.orders) {
                        if (torder.completed) {
                            const edata = extraData.filter(e => e.orderId === torder.idOrder);
                            
                            const box = edata.find(e => e.name.toUpperCase() == 'Количество упаковок'.toUpperCase());
                            const timeOut = edata.find(e => e.name.toUpperCase() == 'Дата отгрузки'.toUpperCase());
                            const driver = edata.find(e => e.name.toUpperCase() == 'Водитель'.toUpperCase());

                            const comments = edata.filter(e => e.name.toUpperCase() === 'Комментарий'.toUpperCase());
                            const DateOut = timeOut?.data ? new Date(timeOut?.data): new Date();
                            const countBox = Number(box?.data);

                            db.execute(`INSERT INTO JOURNAL_OUT (ORDER_ID, DRIVER_NAME, PACK_TYPE, BOX_COUNT, COMMENT, TIME_STAMP, FACT_DATE_OUT)
                                        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, '${format(DateOut, 'DD.MM.YYYY')}')`, 
                                        [
                                            torder.idOrder,
                                            driver?.data||null,
                                            'Полностью',
                                            countBox||0,
                                            comments.map(c => c.data).join(', ')
                                        ]);
                            console.log(torder.idOrder, 'Добавлен в журнал отгрузки');
                        }
                    }
                }
            } catch (e) {
                throw e;
            } finally {
                db.detach();
            }
        } catch (e) {
            throw e;
        }
    }

    private async getStatuses(): Promise<{id: number, name: string, order: number}[]> {
        try {
            const db = await createItmDb();
            try {
                if(this.statuses.length) return this.statuses
                const statusesDb = await db.executeRequest<{ID: number, NAME: string, ORDER: number}>('SELECT * FROM JOURNAL_STATUSES S');
                const statuses = statusesDb.map(s => {
                    return {
                        id: s.ID, name: s.NAME, order: s.ORDER
                    }
                })
                this.statuses = [...statuses]
                return this.statuses;
            } catch (e) {
                throw e;
            } finally {
                db.detach();
            }
        } catch (e) {
            throw e;
        }
    }
}