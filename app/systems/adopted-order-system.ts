import { IAdopted, IAdoptedOrder, IAdoptedOrderDb } from "../types/adopted-orders-types";
import { DbExtraData } from "../types/extra-data-types";


export interface IAdoptedQuery {
    httpQueryId: number;
    noFiltredorders: IAdoptedOrder[];
    time: number;
}
export interface IAdoptedQueryData {
    ordersDb: IAdoptedOrderDb[];
    extraDb: DbExtraData[];
}

export const adoptedQueryHashData: IAdoptedQuery[] = [];

export const getAdoptedQueryHash = (httpQueryId: number): IAdoptedQuery|null => {
    try {
        const hash = adoptedQueryHashData.find(d => d.httpQueryId == httpQueryId);
        if (!hash) return null;
        return hash;
    } catch (e) {
        return null;
    }
}

export const setAdoptedQueryHash = (hashData: IAdoptedQuery): void => {
    try {
        const index = adoptedQueryHashData.findIndex(d => d.httpQueryId == hashData.httpQueryId);
        if (index < 0) {
            adoptedQueryHashData.push(hashData);
        } else {
            clearAdoptedQueryHash(hashData.httpQueryId)
            adoptedQueryHashData.push(hashData);
        }
    } catch (e) {
        throw e;
    }
}

export const clearAdoptedQueryHash = (httpQueryId?:number): void => {
    try {
        if (httpQueryId) {
            const index = adoptedQueryHashData.findIndex(d => d.httpQueryId == httpQueryId);
            if (index >= 0) {
                adoptedQueryHashData.splice(index, 1);
            }
        }else {
            adoptedQueryHashData.splice(0, adoptedQueryHashData.length);
        } 
    } catch (e) {
        console.log(e);
    }
    
} 
