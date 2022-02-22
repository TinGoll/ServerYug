import { ExtraDataType } from "../enums/extra-data-enums";
import ApiError from "../exceptions/ApiError";
import { createItmDb, Events } from "../firebird/Firebird";
import { DbExtraData, DbExtraDataPack, DbExtraDataView, ExtraData, ExtraDataList } from "../types/extra-data-types";
import { IDeletable, IEditable, IRefrashable, ISystem, ISystemOptions } from "../types/system-types";
import UserSystem from "./user-system";
import { getSectors } from "./virtualJournalsFun";
import {EventEmitter} from 'events';

export enum ExtraDataName {
    COMMENT = 'Комментарий',
    DRIVER = 'Водитель',
    DATE_OUT = 'Дата отгрузки',
    TIME_PACKING = 'Время упаковки',
    COUNT_BOX = 'Количество упаковок'
}

export enum ExtraDataGroup{
    COMMENTS = 'Comment',
    PACKING_DATA = 'packing data',
    OUT_DATA = 'out data',
}

export enum CommitActoin {
    NEW = 'NEW', 
    DELETE = 'DELETE',
    EDIT = 'EDIT'
}

export interface ExtraDataCommit {
     action: CommitActoin;
     payload: ExtraData;
}

export default class ExtraDataSystem implements ISystem<ExtraData>, IDeletable<ExtraData>, IEditable<ExtraData>, IRefrashable {
    private static instance: ExtraDataSystem;
    private elementList: ExtraData[] = [];
    private extraDataList: ExtraDataList [] = [];
    private emmiter?: EventEmitter;

    

    constructor() {
        if (ExtraDataSystem.instance) {
            const emmiter = new EventEmitter();
            this.emmiter = emmiter;
            return ExtraDataSystem.instance;
        }
        ExtraDataSystem.instance = this;
    }

    getEmmiter(): EventEmitter {
        if (!this.emmiter) this.emmiter = new EventEmitter();
        this.emmiter.setMaxListeners(1000);
        return this.emmiter;
    }

    commit (action: CommitActoin, payload: ExtraData): void {
        try {
            const emmiter = this.getEmmiter()
            emmiter.emit('CommentAction', {
                action,
                payload
            })
        } catch (e) {
            throw e;
        }
    }

    async getParametersExtraPack  (barcodeTransfer: string, barcodeAccepted: string): Promise<ExtraData[]> {
        try {
            const db = await createItmDb(); 
            
            const [transfer, accepted] = (await db.executeRequest<{ID: number}>(
                `SELECT B.ID_SECTOR AS ID FROM SECTORS_BARCODE B WHERE B.BARCODE IN ('${barcodeTransfer}', '${barcodeAccepted}')`))?.map(s => {return s.ID});
                if (!transfer || !accepted) throw new Error('Один из штрихкодов не определен или заблокирован.');
                
            const query = `SELECT E.DATA_GROUP, E.DATA_NAME, E.DATA_VALUE, E.DATA_TYPE FROM JOURNAL_EXTRA_PACK E
                           LEFT JOIN JOURNAL_DEP D ON (E.DEP_ID = D.ID)
                           WHERE D.ID_SECTOR_TRANSFER = ${transfer} AND D.ID_SECTOR_ACCEPTED = ${accepted}`;   

            const result =  await db.executeRequest<DbExtraDataPack>(query);
            db.detach();
            const extraData: ExtraData[] = [];
            if(!result.length) return extraData;
            for (const d of result) {
                const data : ExtraData = {
                    orderId:    0,
                    journalId:  0,
                    group:      d.DATA_GROUP,
                    type:       d.DATA_TYPE,
                    name:       d.DATA_NAME,
                    list:       [],
                    data:       d.DATA_VALUE
                }
                const list = await this.getListExtradataToName(data.name!);
                data.list = list;
                extraData.push(data);
            }
            return extraData;
        } catch (e) {
            throw e;
        }
    }

    async getListExtradataToName (name: string): Promise<string []> {
        try {
            if (!this.extraDataList.length) await this.refrashListExtradataToName();
            const list = this.extraDataList
                .filter(d => d.name.toUpperCase() == name.toUpperCase())
                .sort((a, b) => {
                    const dataA = a?.value as string;
                    const dataB = b?.value as string;
                    return dataA?.localeCompare(dataB);})
                .map(d => d.value);
            return list;
        } catch (e) {
            throw e;
        }
    }

    async refrashListExtradataToName () : Promise<void> {
        try {
            const db = await createItmDb();
            try {
                const dataDb = await db.executeRequest<{ID: number, LIST_NAME: string, LIST_DATA: string}>
                    ('SELECT * FROM JOURNAL_EXTRA_DATA_LISTS');
                const list = dataDb.map(d => {
                    const data: ExtraDataList = {
                        id: d.ID,
                        name: d.LIST_NAME,
                        value: d.LIST_DATA
                    }
                    return data;
                });
                this.extraDataList = [...list];
            } catch (e) {
                throw e;
            } finally {
                db.detach();
            }
        } catch (e) {
            throw e;
        }
    }

    async deleteItemInListExtraData (listName: string, item: string) : Promise<number> {
        try {
            const db = await createItmDb();
            const candidate = await db.executeAndReturning<{ID: number}>(
                'DELETE JOURNAL_EXTRA_DATA_LISTS D WHERE UPPER(D.LIST_NAME) = UPPER(?) AND UPPER(D.LIST_DATA) = UPPER(?) RETURNING ID;',
                [listName, item]);
            db.detach();
            if (!candidate.ID) ApiError.BadRequest(`Запись ${listName} - ${item} не найдена в базе данных.`);
            return candidate.ID;
        } catch (e) {
            throw e;
        }
    }

    async addItemInListExtraData (listName: string, item: string): Promise<void> {
        try {
            const db = await createItmDb();
            const [candidate] = await db.executeRequest<{ID: number, LIST_NAME: string, LIST_DATA: string}>(
                'SELECT * FROM JOURNAL_EXTRA_DATA_LISTS D WHERE UPPER(D.LIST_NAME) = UPPER(?) AND UPPER(D.LIST_DATA) = UPPER(?)',
                [listName, item]);
            if (candidate.ID) {
                db.detach();
                throw ApiError.BadRequest(`${listName} - ${item}, уже существует в списке.`);
            }
            await db.execute(`INSERT INTO JOURNAL_EXTRA_DATA_LISTS (LIST_NAME, LIST_DATA) VALUES(?, ?)`, [listName.trim(), item.trim()]);
             db.detach();
        } catch (e) {
            throw e;
        }
    }



    /*** Комменты */

    async getCommentToId (id: number): Promise<ExtraData|null> {
        try {
            const data = await this.getAll();
            const comment = data.find(d => d.name?.toUpperCase() == ExtraDataName.COMMENT.toUpperCase() && d.id == id);
            if (!comment) return null;
            return comment;
        } catch (e) {
            throw e;
        }
    }
    async getCommentsToOrderId (id: number): Promise<ExtraData[]> {
        try {
            const data = await this.getAll();
            const comments = data.filter(d => d.name?.toUpperCase() == ExtraDataName.COMMENT.toUpperCase() && d.orderId == id);
            return comments;
        } catch (e) {
            throw e;
        }
    }

    async addCommentToOrder(orderId: number, item: ExtraData): Promise<ExtraData> {
        try {
            item.name = ExtraDataName.COMMENT;
            item.orderId = orderId;
            item.type = ExtraDataType.TEXT;
            item.group = ExtraDataGroup.COMMENTS;
            const comment = await this.add(item);
            const emmiter = this.getEmmiter();
            
            this.commit(CommitActoin.NEW, comment);

            return comment;
        } catch (e) {
            throw e;
        }
    }

    async editComment (element: ExtraData): Promise<ExtraData> {
        try {
            const data = await this.edit(element);
            this.commit(CommitActoin.EDIT, data);
            return data;
        } catch (e) {
            throw e;
        }
    }

    async deleteCommentToId (id: number): Promise<number|null> {
        try {
            const data = await  this.get(id);
            if (!data) return null;
            const deleted = await this.delete(data);
            this.commit(CommitActoin.DELETE, data);
            return deleted;
        } catch (e) {
            throw e;
        }
    }

    async edit(element: ExtraData): Promise<ExtraData> {
        try {
            const db = await createItmDb();
            try {
                if (!this.elementList.length) await this.refrash();
                const index = this.elementList.findIndex(d => d.id == element.id);
                if (index < 0) throw ApiError.BadRequest("Элемент не найден.")
                const dbdata = ExtraDataSystem.convertDtoToDb(element);
                await db.execute(
                    `UPDATE JOURNAL_DATA D SET D.DATA_VALUE = ? WHERE D.ID = ?`,
                    [dbdata.DATA_VALUE, dbdata.ID]);
                const editElement =  this.elementList[index];
                if (editElement) editElement.data = element.data;
                return element;
        } catch (e) {
            throw e;
        } finally {
            db.detach();
        }
        } catch (e) {
            throw e;
        }
    }

    async addToArray (items: ExtraData[]): Promise<ExtraData[]> {
        try {
            const db = await createItmDb();   
            const errors: string[] = [];
            const userSystem = new UserSystem();

            const users         = await userSystem.getAll();
            const sectors       = await getSectors();

            try {
                for (const item of items) {
                    const dbdata = ExtraDataSystem.convertDtoToDb(item);
                    try {
                        const newEntry =  await db.executeAndReturning<{ID: number, TS: Date}>(
                        `INSERT INTO JOURNAL_DATA (ID_JOURNAL, ID_SECTOR, ID_ORDER, ID_EMPLOYEE, DATA_GROUP, DATA_NAME, DATA_VALUE, DATA_TYPE)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING ID, TS`,
                            [dbdata.ID_JOURNAL, dbdata.ID_SECTOR, dbdata.ID_ORDER, dbdata.ID_EMPLOYEE,
                                dbdata.DATA_GROUP, dbdata.DATA_NAME, dbdata.DATA_VALUE, dbdata.DATA_TYPE]);
                        if (!newEntry.ID) throw ApiError.BadRequest("Ошибка записи extra data в базу данных.");
                        item.id = newEntry.ID;
                        item.ts = newEntry.TS;
                        
                        item.userName = (users.find(u => u.id == item.employeeId))?.userName;
                        item.sector = (sectors.find(s => s.id == item.sectorId))?.name
                        
                        this.elementList.push(item);
                    } catch (e) {
                        errors.push((e as Error).message);
                        continue;
                    }
                }
                if (errors.length) throw ApiError.BadRequest("Ошибка добавления дополнительных параметров", errors);
                return items;
            } catch (e) {
                throw e
            } finally {
                db.detach();
            } 
        } catch (e) {
            throw e;
        }
    }

    async add(item: ExtraData): Promise<ExtraData> {
        try {
            const [newitem] = await this.addToArray([item])
            return newitem;
        } catch (e) {
            throw e;
        }
    }
    async get(id: number): Promise<ExtraData | null> {
        try {
            if (this.isEmpty()) await this.refrash();
            const data = this.elementList.find(d => d.id == id);
            if (!data) return null;
            return data;
        } catch (e) {
            throw e;
        }
    }
    async getAll(options?: ISystemOptions): Promise<ExtraData[]> {
        try {
            if (this.isEmpty()) await this.refrash();
            return this.elementList;
        } catch (e) {
            throw e;
        }
    }
    isEmpty(): boolean {
        return !this.elementList.length;
    }
    clear(): void {
        try {
            this.elementList.splice(0, this.elementList.length);
        } catch (e) {
            throw e;
        }
    }
    async delete(element: ExtraData): Promise<number|null> {
        try {
            const db  = await createItmDb();
            try {
                const deletedEntry = await db.executeAndReturning<{ID: number}> (
                    `DELETE FROM JOURNAL_DATA D WHERE D.ID = ? RETURNING ID`, [element.id]);
                const index = this.elementList.findIndex(d => d.id == deletedEntry.ID);
                if (index >= 0) this.elementList.splice(index, 1);
                return deletedEntry.ID||null;
            } catch (e) {
                throw e;
            } finally {
                db.detach();
            }
        } catch (e) {
            throw e;
        }
    }

    async refrash(): Promise<void> {
        try {
            const db = await createItmDb();
            try {
                const dataDb = await db.executeRequest<DbExtraDataView>(`SELECT * FROM EXTRA_DATA_VIEW`);
                const data = dataDb.map(d => ExtraDataSystem.convertDbToDto(d));
                this.elementList = [...data];
            } catch (e) {
                throw e;
            } finally {
                db.detach();
            }
        } catch (e) {
            throw e;
        }
    }

    static convertDbToDto (data: DbExtraDataView): ExtraData {
        const res: ExtraData = {
            id: data.ID || undefined,
            journalId: data.ID_JOURNAL||undefined,
            sectorId: data.ID_SECTOR||undefined,
            orderId: data.ID_ORDER||undefined,
            employeeId: data.ID_EMPLOYEE||undefined,
            group: data.DATA_GROUP||undefined,
            name: data.DATA_NAME||undefined,
            data: data.DATA_VALUE||undefined,
            type: data.DATA_TYPE||undefined,
            userName: data.EMPLOYEE||undefined,
            sector: data.SECTOR||undefined,
            ts: data.TS||undefined,
        }
        return res;
    }
    static convertDtoToDb (data: ExtraData): DbExtraData {
        const res: DbExtraData = {
            ID: data.id||null,
            ID_JOURNAL: data.journalId||null,
            ID_SECTOR: data.sectorId||null,
            ID_ORDER: data.orderId||null,
            ID_EMPLOYEE: data.employeeId||null,
            DATA_GROUP: data.group||null,
            DATA_NAME: data.name||null,
            DATA_VALUE: data.data||null,
            DATA_TYPE: data.type||null,
            TS: data.ts||null
        }
        return res;
    }
    
}