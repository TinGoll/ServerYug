import User from "../entities/User";
import ApiError from "../exceptions/ApiError";
import { createItmDb } from "../firebird/Firebird";
import { getAllUsers } from "../systems/users";
import { getSectors } from "../systems/virtualJournalsFun";
import { IAdopted, IAdoptedOptions, IAdoptedOrder, IAdoptedOrderDb } from "../types/adopted-orders-types";
import { JournalDataDto, JournalSectorList } from "../types/journalTypes";
import { format } from 'date-format-parse';
import { IExtraDataDb } from "../types/extraDataTypes";
import dtoConverter from "../systems/dtoConverter";
import { adoptedQueryHashData, clearAdoptedQueryHash, getAdoptedQueryHash, IAdoptedQuery, setAdoptedQueryHash } from "../systems/adopted-order-system";


interface IKeyword {
    key: string, value: string
}

class AdoptedOrderService {
    defaultLimit: number    = 20;  // Лимит по умолчанию.
    updateTime: number      = 1;    // Минуты

    keywords: IKeyword [] = [
                {key: 'Сегодня',        value: 'Сегодня'},
                {key: 'Вчера',          value: 'Вчера'},
                {key: 'Неделя',         value: 'Неделя'},
                {key: 'Эта неделя',     value: 'Неделя'},
                {key: 'Прошлая',        value: 'Неделя'},
            ];
    async getAdoptedOrders(httpQueryId:number, journalNamesId: number[], options?: IAdoptedOptions): Promise<IAdopted> {
        try {
            const db = await createItmDb();
            try {
                let isUpdate: boolean = true;
                const hashData = getAdoptedQueryHash(httpQueryId);
                let newHashData: IAdoptedQuery;
                if (hashData && hashData?.time + (this.updateTime * 60 * 1000) > Date.now()) {
                    isUpdate = false;
                    newHashData = hashData;
                }else{
                    newHashData = {
                        httpQueryId: httpQueryId,
                        noFiltredorders: [],
                        time: Date.now()
                    }
                }
                if (isUpdate) {
                    if (!journalNamesId?.length) throw ApiError.BadRequest("Нет журналов для отображения.");
                    const users         = await getAllUsers();
                    const sectors       = await getSectors();
                    const queryOrders = `SELECT O.ID, J.ID as JOURNAL_ID, J.TRANSFER_DATE, O.ITM_ORDERNUM, O.CLIENT, O.MANAGER, O.ORDER_FASADSQ,
                                            GET_STATUS_NAME_TO_NUM(O.ORDER_STATUS) AS OLD_STATUS,
                                            GET_STATUS_NAME(GET_JSTATUS_ID(O.ID)) AS STATUS,
                                            (SELECT FIRST 1 T1.ID_SECTOR FROM JOURNAL_TRANS T1 WHERE T1.ID_JOURNAL = J.ID AND T1.MODIFER < 0) AS TRANSFER_ID,
                                            (SELECT FIRST 1 T1.ID_EMPLOYEE FROM JOURNAL_TRANS T1 WHERE T1.ID_JOURNAL = J.ID AND T1.MODIFER < 0) AS TRANSFER_EMPLOYEE_ID,
                                            (SELECT FIRST 1 T2.ID_SECTOR FROM JOURNAL_TRANS T2 WHERE T2.ID_JOURNAL = J.ID AND T2.MODIFER > 0) AS ACCEPTED_ID,
                                            (SELECT FIRST 1 T2.ID_EMPLOYEE FROM JOURNAL_TRANS T2 WHERE T2.ID_JOURNAL = J.ID AND T2.MODIFER > 0) AS ACCEPTED_EMPLOYEE_ID
                                    FROM JOURNALS J
                                    LEFT JOIN ORDERS O ON (J.ID_ORDER = O.ID)
                                    WHERE J.ID_JOURNAL_NAMES IN (${journalNamesId.join(',')})`;
                    const queryExtraData = `select * from JOURNAL_DATA D
                                        where exists(select j.id
                                        from JOURNALS J
                                        where J.ID_JOURNAL_NAMES in (${journalNamesId.join(',')}) and
                                            (J.ID = D.ID_JOURNAL or (UPPER(D.DATA_NAME) = UPPER('Комментарий') and
                                            J.ID_ORDER = D.ID_ORDER)))`;
                    const ordersDb      = await db.executeRequest<IAdoptedOrderDb>(queryOrders);
                    const extraDb       = await db.executeRequest<IExtraDataDb>(queryExtraData);
                    const noFiltredorders   = ordersDb.map(o => this.convertAdoptedOrderDbToDto(o, extraDb, users, sectors)); 
                    newHashData.noFiltredorders = noFiltredorders;
                    setAdoptedQueryHash({...newHashData});             
                }
                if (!newHashData?.noFiltredorders.length) {
                    clearAdoptedQueryHash();
                    throw ApiError.NotFound();
                }                    
                const limit         = options?.limit||this.defaultLimit;
                const page          = options?.page||1;
                const filtredOrders     = this.searchEngine(newHashData?.noFiltredorders, options);
                const count             = filtredOrders.length;
                const pageCount         = filtredOrders.length?Math.ceil(count / limit):1;
                const pages             = pageCount<=0?1:pageCount;
                const orders            = filtredOrders.slice((page-1<0?0:page-1)*limit, (limit*(page<0?1:page)));
                return {orders, count: count, pages};

            } catch (e) {
                throw e;
            } finally {
                db.detach();
            }
        } catch (e) {
            throw e;
        }
    }

    convertAdoptedOrderDbToDto (data: IAdoptedOrderDb, extraDb: IExtraDataDb[], users: User[], sectors: JournalSectorList[]): IAdoptedOrder {
        const sectorTransfer = sectors.find(s => s.id === data.TRANSFER_ID);
        const sectorAccepted = sectors.find(s => s.id === data.ACCEPTED_ID);
        const employeeTransfer = users.find(u => u.id === data.TRANSFER_EMPLOYEE_ID);
        const employeeAccepted = users.find(u => u.id === data.ACCEPTED_EMPLOYEE_ID);
        const comments: JournalDataDto[] = extraDb.
            filter(e => e.ID_ORDER === data.ID && e.DATA_NAME.toUpperCase() == 'Комментарий'.toUpperCase()).map(e => dtoConverter.JournalDataDbToDto(e));
        const extraData: JournalDataDto[] = extraDb.
            filter(e => e.ID_JOURNAL === data.JOURNAL_ID && e.DATA_NAME.toUpperCase() != 'Комментарий'.toUpperCase()).map(e => dtoConverter.JournalDataDbToDto(e)); 
        const result: IAdoptedOrder = {
            id: data.ID,
            itmOrderNum: data.ITM_ORDERNUM,
            transfer: sectorTransfer?.name||'',
            employeeTransfer: employeeTransfer?.userName||'',
            accepted: sectorAccepted?.name||'',
            employeeAccepted: employeeAccepted?.userName||'',
            client: data.CLIENT,
            manager: data.MANAGER,
            statusOld: data.OLD_STATUS,
            status: data.STATUS||'',
            fasadSquare: data.ORDER_FASADSQ||0,
            date: data.TRANSFER_DATE,
            data: {
                comments,
                extraData
            }
        }
        return result;
    }

    searchEngine(orders: IAdoptedOrder[], options?: IAdoptedOptions): IAdoptedOrder[] {
        try {
            const dateFirst = options?.d1;
            const dateSecond = options?.d2;
            if (!options?.filter) return orders;
            const filter: string = options?.filter;
            const { queryKeys, keys } = this.getArrayOfKeywords(filter);
            if (!queryKeys.length) return [];
            const filteredArray = orders.filter(o => {
                if (dateFirst && dateFirst instanceof Date) 
                    if(!(o.date.getTime() >= dateFirst.getTime())) return false;
                if (dateSecond && dateSecond instanceof Date)
                    if(!(o.date.getTime() <= dateSecond.getTime())) return false;
                const str = `${o.itmOrderNum}_${o.manager}_${o.transfer}_${o.accepted}_${o.client}
                    _${o.employeeTransfer||''}_${o.employeeAccepted||''}
                    _${o.status||''}_${o.statusOld||''}_${o.fasadSquare}_${format(o.date, 'DD.MM.YYYY')}
                    _${o.data?.comments?.map(c => c.data).join('_')||''}
                    _${o.data?.extraData?.map(e => e.data).join('_')||''}`.toUpperCase();
                for (const k of queryKeys) if (!str.includes(k.toUpperCase())) return false;
                return true;
            })
            return filteredArray;
        } catch (e) {
            throw e;
        }
    }

    getArrayOfKeywords(str: string): {queryKeys: string[], keys: string[]} {
        try {
            const keys:         string[] = [];
            let filterStr:      string = str.replace(/\s+/g, ' ').trim().toUpperCase();
            for (const keyword of this.keywords) {
                if (filterStr.includes(keyword.key.toUpperCase())) {
                    keys.push(keyword.value);
                    const regX = new RegExp(`${keyword.key.toUpperCase()}`, 'g');
                    filterStr = filterStr.replace(regX, '').replace(/ +/g, ' ');
                }
            }
            const  queryKeys =  filterStr.replace(/,/g," ").split(',');
            return {queryKeys, keys};
        } catch (e) {
            return {
                queryKeys:[],
                keys: []
            };
        }
    }
}
export default new AdoptedOrderService();