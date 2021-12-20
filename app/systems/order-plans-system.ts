import User from "../entities/User";
import ApiError from "../exceptions/ApiError";
import { createItmDb, Firebird } from "../firebird/Firebird";
import { IDependencies, IDependenciesDb } from "../types/at-order-types";
import { IExtraDataDb } from "../types/extraDataTypes";
import { JournalDataDto, JournalOrderDto, JournalSectorList } from "../types/journalTypes";
import { IPlanOrder, IPlanOrderDb } from "../types/plans-order-types";
import { IKeyword, ISystem, ISystemOptions } from "../types/system-types";
import dtoConverter from "./dtoConverter";
import { orderKeywords } from "./search-keywords";
import { getAllUsers } from "./users";
import { getSectors } from "./virtualJournalsFun";

export class OrderPlanSystem implements ISystem<IPlanOrder> {
    private static instance: OrderPlanSystem;

    private orders: IPlanOrder[] = [];
    private dependenses: IDependencies[] = [];
    
    private statuses: {id: number, name: string, order: number}[] = []
    private updateTime: number = 480; // Минуты
    private defaultLimit: number = 25;
    private lastUpdate: number|null = null; // Последнее обновление в мсек.
    private keywords: IKeyword [] = orderKeywords;

    constructor() {
        if (OrderPlanSystem.instance) {
            return OrderPlanSystem.instance;
        }
        OrderPlanSystem.instance = this;
    }
    async getData(options?: ISystemOptions): Promise<IPlanOrder[]> {
        try {
            if(this.isEmpty() || !this.lastUpdate || (this.lastUpdate + (this.updateTime * 60 * 1000)) < Date.now()) 
                await this.refrash();
            const journalNameId: number | undefined = options?.id;
            const dependenses = this.dependenses.filter(d => d.journalNameId === Number(journalNameId));

            const orders = this.orders.filter(order => {
                let check: boolean = false;
                /** Фильтрация по id журнала, попажают только те участки, которые есть в журнале */
                if (!journalNameId) check = true;
                /** Если профильщик - выходим */
                if (order.isProfiler) return false;

                for (const d of dependenses) {
                    if (order.sectorId === d.transfer) {
                        check = true;
                        break;
                    }
                }

                /** если запись есть в журнале, значит заказ уже передан следующему участку */
                if(order.journalId) check = false; 
                /** если текущая локация совпадает с сектором, то показываем рабочее время в этом участке или обновляем */
                if (order.locationSectorId && order.sectorId === order.locationSectorId) order.workingTime = this.getWorkTime(order.accepdedDate||null);
                return check;
            })

            if (!options) return orders;
            return this.searchEngine(orders, options);
        } catch (e) {
            throw e;
        }
    }

    private searchEngine(orders: IPlanOrder[], options: ISystemOptions ): IPlanOrder[] {
        try {
            let dateFirst: Date|undefined = undefined;
            let dateSecond: Date|undefined = undefined;

            const d1 = options?.d1;
            const d2 = options?.d2;
            const filter: string = options?.filter||'';
            if (d1 && d1 instanceof Date) dateFirst = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
            if (d2 && d2 instanceof Date) dateSecond = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());

            const { queryKeys, keys } = this.getArrayOfKeywords(filter);
            if (!queryKeys.length && !keys.length && !dateFirst && !dateSecond) return orders;

            const filteredArray = orders.filter(order => {
                let check: boolean = true;
                const date = order.datePlan && order.datePlan instanceof Date ? new Date(order.datePlan.getFullYear(), order.datePlan.getMonth(), order.datePlan.getDate()).valueOf() : undefined;
                if (date && dateFirst)  if(!(date >= dateFirst.valueOf())) return false;
                if (date && dateSecond) if(!(date <= dateSecond.valueOf())) return false;
                if (keys.length && check) check = this.containsKeywords(order, keys);
                if (queryKeys.length && check) check = this.containsWords(order, queryKeys);
                return check;
            })
            return filteredArray;
        } catch (e) {
            return [];
        }
    }

    private containsKeywords (order: IPlanOrder, keys: string[]): boolean {
        try {
            for (const k of keys) {
                    if (k.toUpperCase() === 'Упакован'.toUpperCase() && order.statusId !== 7) return false;
                    if (k.toUpperCase() === 'Отгружен'.toUpperCase() && order.statusId !== 8) return false;
                    if (k.toUpperCase() === 'На сборке'.toUpperCase() && order.statusId !== 1) return false;
                    if (k.toUpperCase() === 'На шлифовке'.toUpperCase() && order.statusId !== 2) return false;
                    if (k.toUpperCase() === 'Покраска этап №1'.toUpperCase() && order.statusId !== 3) return false;
                    if (k.toUpperCase() === 'Патина этап №2'.toUpperCase() && order.statusId !== 4) return false;
                    if (k.toUpperCase() === 'Лак этап №3'.toUpperCase() && order.statusId !== 5) return false;
                    if (k.toUpperCase() === 'В упаковке'.toUpperCase() && order.statusId !== 6) return false;
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    private containsWords (order: any, words: string[]) : boolean {
        try {
            if (!words.length) return true;
            const comments = order?.data?.comments;
            const extraData = order?.data?.extraData;
            const fieldValues: string[] = [];

            for (const key in order) {
                if (Object.prototype.hasOwnProperty.call(order, key)) {
                    const element =  order[key];
                    if (typeof element === 'string') fieldValues.push(element);
                }
            }
            /** Поиск по комментариям */
            if (comments && comments?.length) {
                const txt = comments.map((c: { name: string; data: string; }) => c.name + '_' + c.data).join('_').toUpperCase();
                fieldValues.push(txt);
            }
            /** Поиск по другим экстраданным */
            if (extraData && extraData?.length) {
                const txt = extraData.map((c: { name: string; data: string; }) => c.name + '_' + c.data).join('_').toUpperCase();
                fieldValues.push(txt);
            }

            for (const word of words) {
                let check: boolean = false;
                for (const value of fieldValues) {
                    if (value.toUpperCase().includes(word.toUpperCase())) {
                        check = true;
                        break;
                    }
                }
                if (!check) return false;
            }
            return true;
        } catch (e) {
            return false
        }
    }

    async refrash(): Promise<void> {
        try {
            const db = await createItmDb();
            try {
                this.orders.splice(0, this.orders.length);
                const dependensesDb = await db.executeRequest<IDependenciesDb>('SELECT * FROM JOURNAL_DEP');
                const ordersDb      = await db.executeRequest<IPlanOrderDb>(this.getOrderQuery());
                const extraData     = await db.executeRequest<IExtraDataDb>(this.getExtraDataQuery());

                const users         = await getAllUsers();
                const sectors       = await getSectors();
                const statuses      = await this.getStatuses(db);

                this.dependenses    = dependensesDb.map(d => dtoConverter.convertDependenciesDbToDto(d));
                this.orders         = this.convertDbToDto(ordersDb, extraData, sectors, users, statuses);
                this.orders         = this.orders.sort((a, b) => {
                        const orderA = (sectors.find(s => s?.id == a.sectorId))?.orderBy || 0;
                        const orderB = (sectors.find(s => s?.id == b.sectorId))?.orderBy || 0;
                        if (orderA < orderB) return -1;
                        if (orderA > orderB) return 1;
                        return 0;
                })

                this.lastUpdate = Date.now();
            } catch (e) {
                throw e;
            } finally {
                db.detach();
            }
        } catch (e) {
            throw e;
        }
    }
    isEmpty(): boolean {
        return !this.orders.length;
    }
    clear(): void {
        try {
            this.orders.splice(0, this.orders.length);
        } catch (e) {
            throw e;
        }
    }

    private async getStatuses(db: Firebird): Promise<{id: number, name: string, order: number}[]> {
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
        }
    }

    private convertDbToDto (data: IPlanOrderDb[], extraData: IExtraDataDb[], 
            sectors: JournalSectorList[], users: User[], statuses: {id: number, name: string, order: number}[]): IPlanOrder [] {
        try {
                const planOrders: IPlanOrder[] = data.map(d => {
                const status = statuses.find(s => s.id === d.ID_STATUS);
                const transfer = sectors.find(s => s.id === d.TRANSFER_ID);
                const accepted = sectors.find(s => s.id === d.ACCEPTED_ID); 
                const location = sectors.find(s => s.id === d.LOCATION_ID);
                const comments = extraData.filter(e => e.ID_ORDER === d.ID && e.DATA_NAME.toUpperCase() === 'Комментарий'.toUpperCase())
                    .map(e => dtoConverter.JournalDataDbToDto(e));

                const order: IPlanOrder = {
                    id: d.ID,
                    itmOrderNum: d.ITM_ORDERNUM,
                    fasadSquare: d.ORDER_FASADSQ||0,
                    generalSquare: d.ORDER_GENERALSQ||0,
                    statusOldNum: d.OLD_STATUS_NUM,
                    statusOldName: d.OLD_STATUS,
                    statusId: d.ID_STATUS,
                    status: status?.name||null,
                    client: d.CLIENT,
                    isProfiler: !!d.PROFILER,
                    isPrepaid: !!d.IS_PREPAID,
                    journalId: d.ID_JOURNAL,
                    journalNameId: d.ID_JOURNAL_NAMES,
                    transferDate: d.TRANSFER_DATE,
                    accepdedDate: d.ACCEPTED_DATE,
                    datePlan: d.DATE_PLAN,
                    sectorId: d.PLAN_SECTOR_ID,
                    sectorName: d.PLAN_SECTOR,
                    workerName: d.WORKER,
                    workingTime:  this.getWorkTime(d.TRANSFER_DATE),
                    transferSectorId: d.TRANSFER_ID,
                    accepdedSectorId: d.ACCEPTED_ID,
                    locationSectorId: d.LOCATION_ID,
                    transferSector: transfer?.name||null,
                    accepdedSector: accepted?.name||null,
                    locationSector: location?.name||null,
                    data: {
                        comments
                    }
                }
                return order;
            });
            return planOrders;
        } catch (e) {
            throw e;
        }
    }

    private  getWorkTime (startDate: Date | null): number {
        if (!startDate) return 0;
        const oneDayMS: number = (24 * 60 * 60 * 1000);
        const nowMS: number = Date.now();
        let tempMS: number = startDate.valueOf();
        let weekends: number = 0;
        let workDay: number = 0;
        let lastDay: Date = new Date();
        while (tempMS < nowMS) {
            const currentDate = new Date(tempMS);
            lastDay = currentDate;
            if (!(currentDate.getDay() % 6 == 0))
                workDay++;
            else
                weekends++;
            tempMS += oneDayMS;
        }
        if (!((new Date(nowMS)).getDay() % 6 == 0))
            workDay--;
        else
            weekends--;
        const res = workDay * oneDayMS + (nowMS - lastDay.valueOf());
        return (res < 0 ? 0 : res);
    };

    private getArrayOfKeywords(str: string): {queryKeys: string[], keys: string[]} {
        try {
            if (!str || str == '') throw ApiError.BadRequest("Нет данных.")
            const keys:         string[] = [];
            const set = new Set<string>();
            let filterStr:      string = str.replace(/\s+/g, ' ').trim().toUpperCase();
            for (const k of this.keywords) {
                const regX = new RegExp(`${k.key.toUpperCase()}`, 'g');
                if (filterStr.match(regX)) {
                    set.add(k.value);
                    filterStr = filterStr.replace(regX, '').replace(/ +/g, ' ');
                }
            }
            const  queryKeys =  filterStr.replace(/,/g," ").split(' ');
            return {queryKeys, keys: [...set]};
        } catch (e) {
            return {
                queryKeys:[],
                keys: []
            };
        }
    }

    private getExtraDataQuery(): string {
        return `
            SELECT * FROM JOURNAL_DATA
        `
    }

    private getOrderQuery() : string {
        return `
            SELECT O.ID, O.ITM_ORDERNUM, O.ORDER_GENERALSQ, O.ORDER_FASADSQ, 
                    O.ORDER_STATUS AS OLD_STATUS_NUM, O.CLIENT, O.PROFILER, O.IS_PREPAID,
                    J.ID AS ID_JOURNAL, J.ID_JOURNAL_NAMES, J.TRANSFER_DATE, L.ACCEPTED_DATE,
                    GET_STATUS_NAME_TO_NUM(O.ORDER_STATUS) AS OLD_STATUS,
                    GET_JSTATUS_ID(O.ID) AS ID_STATUS,
                    GET_SECTOR_ID_TO_OLD_SECTOR(P.DATE_DESCRIPTION) AS PLAN_SECTOR_ID,
                    GET_SECTOR_NAME_TO_OLD_SECTOR(P.DATE_DESCRIPTION) AS PLAN_SECTOR,
                    P.DATE_SECTOR AS WORKER, P.DATE3 AS DATE_PLAN,

                    (SELECT FIRST 1 T.ID_SECTOR FROM JOURNAL_TRANS T WHERE T.ID_JOURNAL = J.ID AND T.MODIFER < 0) AS TRANSFER_ID,
                    (SELECT FIRST 1 T.ID_SECTOR FROM JOURNAL_TRANS T WHERE T.ID_JOURNAL = J.ID AND T.MODIFER > 0) AS ACCEPTED_ID,

                    L.ID_SECTOR AS LOCATION_ID 
                FROM ORDERS_IN_PROGRESS O
                    LEFT JOIN ORDERS_DATE_PLAN P ON (P.ORDER_ID = O.ID)
                    LEFT JOIN JOURNALS J ON (J.ID_ORDER = O.ID AND EXISTS(
                        SELECT T2.ID FROM JOURNAL_TRANS T2  WHERE T2.ID_JOURNAL = J.ID AND 
                        T2.ID_SECTOR = GET_SECTOR_ID_TO_OLD_SECTOR(P.DATE_DESCRIPTION) AND T2.MODIFER < 0
                    ))
                    LEFT JOIN LOCATION_ORDER L ON (L.ID_ORDER = O.ID AND L.ID_SECTOR = GET_SECTOR_ID_TO_OLD_SECTOR(P.DATE_DESCRIPTION))
                    ORDER BY P.DATE3
        `
        //LEFT JOIN LOCATION_ORDER L ON (L.ID_ORDER = O.ID AND L.ID_SECTOR = GET_SECTOR_ID_TO_OLD_SECTOR(P.DATE_DESCRIPTION)) - локация привязана к учатску
    }
    
}