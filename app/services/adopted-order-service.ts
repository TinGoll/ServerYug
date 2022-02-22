import User from "../entities/User";
import ApiError from "../exceptions/ApiError";
import { createItmDb } from "../firebird/Firebird";
import { getAllUsers } from "../systems/users";
import { getSectors } from "../systems/virtualJournalsFun";
import {
  IAdopted,
  IAdoptedOptions,
  IAdoptedOrder,
  IAdoptedOrderDb,
  ITransferredOrders,
  ITransferredOrdersDb,
} from "../types/adopted-orders-types";
import { JournalSectorList } from "../types/journalTypes";
import { format } from "date-format-parse";

import {
  clearAdoptedQueryHash,
  getAdoptedQueryHash,
  IAdoptedQuery,
  setAdoptedQueryHash,
} from "../systems/adopted-order-system";
import { IKeyword } from "../types/system-types";
import { orderKeywords } from "../systems/search-keywords";
import ExtraDataSystem, { ExtraDataName } from "../systems/extra-data-system";
import { ExtraData } from "../types/extra-data-types";
import { IDependenciesDb } from "../types/at-order-types";
import dtoConverter from "../systems/dtoConverter";

class AdoptedOrderService {
  defaultLimit: number = 50; // Лимит по умолчанию.
  updateTime: number = 20; // Минуты

  /**
     *  1	На сборке
        2	На шлифовке
        3	Покраска этап №1
        4	Патина этап №2
        5	Лак этап №3
        6	В упаковке
        7	Упакован
        8	Отгружен

     */

  private keywords: IKeyword[] = orderKeywords;

  async getAdoptedOrders(
    httpQueryId: number,
    journalNamesId: number[],
    options?: IAdoptedOptions
  ): Promise<IAdopted> {
    try {
      const db = await createItmDb();
      try {
        let isUpdate: boolean = true;
        const hashData = getAdoptedQueryHash(httpQueryId);
        const extraDataSystem = new ExtraDataSystem();
        const extraData = await extraDataSystem.getAll();
        let newHashData: IAdoptedQuery;
        if (
          hashData &&
          hashData?.time + this.updateTime * 60 * 1000 > Date.now()
        ) {
          isUpdate = false;
          newHashData = hashData;
        } else {
          newHashData = {
            httpQueryId: httpQueryId,
            noFiltredorders: [],
            time: Date.now(),
          };
        }
        if (isUpdate) {
          if (!journalNamesId?.length)
            throw ApiError.BadRequest("Нет журналов для отображения.");

          const dependensesDb = await db.executeRequest<IDependenciesDb>(
            "SELECT * FROM JOURNAL_DEP"
          );
          const dependenses = dependensesDb.map((d) =>
            dtoConverter.convertDependenciesDbToDto(d)
          );
          const sectorDeps = dependenses
            .filter((d) => {
              const jd = journalNamesId.find((j) => j == d.journalNameId);
              return jd;
            })
            .map((d) => d.transfer);

          const queryOrders = `SELECT O.ID, J.ID AS JOURNAL_ID, J.ID_JOURNAL_NAMES, O.ITM_ORDERNUM, O.CLIENT, O.MANAGER, O.ORDER_FASADSQ,
                                                J.TRANSFER_DATE,
                                                GET_STATUS_NAME(GET_JSTATUS_ID(O.ID)) AS STATUS,
                                                GET_JSTATUS_ID(O.ID) AS STATUS_ID,
                                                GET_EMP_NAME(T.ID_EMPLOYEE) AS EMPLOYEE,
                                                GET_SECTOR_NAME(T.ID_SECTOR) AS SECTOR,
                                                T.ID_EMPLOYEE,
                                                T.ID_SECTOR,
                                                T.MODIFER,
                                                J.TS

                                        FROM JOURNALS J
                                        LEFT JOIN JOURNAL_TRANS T ON (T.ID_JOURNAL = J.ID)
                                        LEFT JOIN ORDERS O ON (O.ID = J.ID_ORDER)
                                        WHERE EXISTS(
                                            SELECT *
                                            FROM JOURNAL_TRANS
                                            WHERE ID_SECTOR IN (${[
                                              ...new Set(sectorDeps),
                                            ].join(",")}) AND ID_JOURNAL = J.ID
                                        )
                                        ORDER BY J.TRANSFER_DATE desc`;

          const ordersDb = await db.executeRequest<ITransferredOrdersDb>(
            queryOrders
          );
          const transferOrders = ordersDb.map((order) =>
            this.convertAdoptedOrderDbToDto(order)
          );

          const noFiltredorders = transferOrders
            .filter((order) => {
              const jId = journalNamesId.find((j) => j == order.journalNamesId);
              return jId && order.modifer < 0;
            })
            .map((order) => {
              const accepted = transferOrders.find(
                (o) => o.journalId == order.journalId && o.modifer > 0
              );

              /***  */
              const transferedJournalEntry = transferOrders.find((o) => {
                return o.sectorId == order.sectorId && o.modifer > 0;
              });
              
              const transfered = transferOrders.find(
                (order) =>
                  order.id == transferedJournalEntry?.id &&
                  order.journalId == transferedJournalEntry?.journalId &&
                  order.modifer < 0
              );

              if (order.id == 20117) {
                console.log(transfered);
                
                console.log("start", transfered?.transferDate.toLocaleString());
                console.log("end", order.transferDate.toLocaleString());
                console.log(
                  "result",
                  this.getWorkTime(transfered?.transferDate, order.transferDate)
                );
                
              }

              const o: IAdoptedOrder = {
                id: order.id,
                journalId: order.journalId,
                itmOrderNum: order.itmOrderNum,
                transfer: order.sector || "Не определен",
                employeeTransfer: order.employee || "Не определен",
                client: order.client,
                manager: order.manager,
                accepted: accepted?.sector || "Не определен",
                employeeAccepted: accepted?.employee || "Не определен",
                statusOld: "Не используется",

                status: order.status || "Не определен",
                statusId: order.statusId,
                fasadSquare: order.fasadSquare || 0,
                date: order.transferDate,
                workTime: this.getWorkTime(
                  transfered?.transferDate,
                  order.transferDate
                ),
                transfered: transfered?.sector || undefined,
                transferedData: transfered?.transferDate || undefined,
                data: {
                  comments: undefined,
                  extraData: undefined,
                },
              };
              return o;
            });

          newHashData.noFiltredorders = noFiltredorders;
          setAdoptedQueryHash({ ...newHashData });
        }
        if (!newHashData?.noFiltredorders.length) {
          clearAdoptedQueryHash(httpQueryId);
          return { orders: [], count: 0, pages: 0 };
        }

        const limit = options?.limit || this.defaultLimit;
        const page = options?.page || 1;
        const filtredOrders = this.insertExtraData(
          this.searchEngine(newHashData?.noFiltredorders, options),
          extraData
        );
        const count = filtredOrders.length;
        const pageCount = filtredOrders.length ? Math.ceil(count / limit) : 1;
        const pages = pageCount <= 0 ? 1 : pageCount;
        const orders = filtredOrders.slice(
          (page - 1 < 0 ? 0 : page - 1) * limit,
          limit * (page < 0 ? 1 : page)
        );
        return { orders, count: count, pages };
      } catch (e) {
        throw e;
      } finally {
        db.detach();
      }
    } catch (e) {
      throw e;
    }
  }
  convertAdoptedOrderDbToDto(data: ITransferredOrdersDb): ITransferredOrders {
    const result: ITransferredOrders = {
      id: data.ID,
      journalId: data.JOURNAL_ID,
      itmOrderNum: data.ITM_ORDERNUM,
      client: data.CLIENT,
      manager: data.MANAGER,
      fasadSquare: data.ORDER_FASADSQ || 0,
      transferDate: data.TRANSFER_DATE,
      status: data.STATUS || "",
      statusId: data.STATUS_ID,
      employee: data.EMPLOYEE,
      sector: data.SECTOR,
      employeeId: data.ID_EMPLOYEE,
      sectorId: data.ID_SECTOR,
      modifer: data.MODIFER,
      ts: data.TS,
      journalNamesId: data.ID_JOURNAL_NAMES,
    };
    return result;
  }

  private insertExtraData(
    orders: IAdoptedOrder[],
    extraData: ExtraData[]
  ): IAdoptedOrder[] {
    try {
      for (const order of orders) {
        const comments = extraData.filter(
          (d) =>
            d.name?.toUpperCase() == ExtraDataName.COMMENT.toUpperCase() &&
            d.orderId == order.id
        );
        const otherData = extraData.filter(
          (d) =>
            d.journalId == order.journalId &&
            d.name?.toUpperCase() != ExtraDataName.COMMENT.toUpperCase()
        );

        order.data.comments = comments;
        order.data.extraData = otherData;
      }
      return orders;
    } catch (e) {
      throw e;
    }
  }

  searchEngine(
    orders: IAdoptedOrder[],
    options?: IAdoptedOptions
  ): IAdoptedOrder[] {
    try {
      let dateFirst: Date | undefined = undefined;
      let dateSecond: Date | undefined = undefined;

      const d1 = options?.d1;
      const d2 = options?.d2;
      const filter: string = options?.filter || "";
      if (d1 && d1 instanceof Date)
        dateFirst = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
      if (d2 && d2 instanceof Date)
        dateSecond = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());

      const { queryKeys, keys } = this.getArrayOfKeywords(filter);

      if (!queryKeys.length && !dateFirst && !dateSecond) {
        return orders;
      }
      const filteredArray = orders.filter((o) => {
        const date =
          o.date && o.date instanceof Date
            ? new Date(
                o.date.getFullYear(),
                o.date.getMonth(),
                o.date.getDate()
              ).valueOf()
            : undefined;
        if (date && dateFirst) if (!(date >= dateFirst.valueOf())) return false;
        if (date && dateSecond)
          if (!(date <= dateSecond.valueOf())) return false;
        for (const k of keys) {
          if (k.toUpperCase() === "Упакован".toUpperCase() && o.statusId !== 7)
            return false;
          if (k.toUpperCase() === "Отгружен".toUpperCase() && o.statusId !== 8)
            return false;
          if (k.toUpperCase() === "На сборке".toUpperCase() && o.statusId !== 1)
            return false;
          if (
            k.toUpperCase() === "На шлифовке".toUpperCase() &&
            o.statusId !== 2
          )
            return false;
          if (
            k.toUpperCase() === "Покраска этап №1".toUpperCase() &&
            o.statusId !== 3
          )
            return false;
          if (
            k.toUpperCase() === "Патина этап №2".toUpperCase() &&
            o.statusId !== 4
          )
            return false;
          if (
            k.toUpperCase() === "Лак этап №3".toUpperCase() &&
            o.statusId !== 5
          )
            return false;
          if (
            k.toUpperCase() === "В упаковке".toUpperCase() &&
            o.statusId !== 6
          )
            return false;
        }

        const str = `${o.itmOrderNum}_${o.manager}_${o.transfer}_${
          o.accepted
        }_${o.client}
                    _${o.employeeTransfer || ""}_${o.employeeAccepted || ""}
                    _${o.status || ""}_${o.statusOld || ""}_${
          o.fasadSquare
        }_${format(o.date, "DD.MM.YYYY")}
                    _${o.data?.comments?.map((c) => c.data).join("_") || ""}
                    _${
                      o.data?.extraData?.map((e) => e.data).join("_") || ""
                    }`.toUpperCase();
        for (const k of queryKeys)
          if (!str.includes(k.toUpperCase())) return false;
        return true;
      });
      return filteredArray;
    } catch (e) {
      throw e;
    }
  }

  getArrayOfKeywords(str: string): { queryKeys: string[]; keys: string[] } {
    try {
      if (!str || str == "") throw ApiError.BadRequest("Нет данных.");
      const keys: string[] = [];
      const set = new Set<string>();
      let filterStr: string = str.replace(/\s+/g, " ").trim().toUpperCase();
      for (const k of this.keywords) {
        const regX = new RegExp(`${k.key.toUpperCase()}`, "g");
        if (filterStr.match(regX)) {
          set.add(k.value);
          filterStr = filterStr.replace(regX, "").replace(/ +/g, " ");
        }
      }
      const queryKeys = filterStr.replace(/,/g, " ").split(" ");
      return { queryKeys, keys: [...set] };
    } catch (e) {
      return {
        queryKeys: [],
        keys: [],
      };
    }
  }
  private getWorkTime(startDate?: Date, endDate?: Date): number {
    //console.log(startDate, endDate);

    if (!startDate || !endDate) return 0;
    const oneDayMS: number = 24 * 60 * 60 * 1000;
    const nowMS: number = endDate.valueOf();
    let tempMS: number = startDate.valueOf();
    let weekends: number = 0;
    let workDay: number = 0;
    let lastDay: Date = new Date();
    while (tempMS < nowMS) {
      const currentDate = new Date(tempMS);
      lastDay = currentDate;
      if (!(currentDate.getDay() % 6 == 0)) workDay++;
      else weekends++;
      tempMS += oneDayMS;
    }
    if (!(new Date(nowMS).getDay() % 6 == 0)) workDay--;
    else weekends--;
    const res = workDay * oneDayMS + (nowMS - lastDay.valueOf());
    //console.log(res);

    return res < 0 ? 0 : res;
  }
}
export default new AdoptedOrderService();
