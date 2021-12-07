import { IAdoptedOrder, IAdoptedOrderDb } from "../types/adopted-orders-types";
import { BarcodesDb, IAtOrder, IAtOrdersDb, IBarcode, IDependencies, IDependenciesDb, ILocationOrder, ILocationOrderDb, IWorkOrders, IWorkOrdersDb } from "../types/at-order-types";
import { JournalDataDb, JournalDataDto } from "../types/journalTypes";

class DtsConverter {
    JournalDataDbToDto (data: JournalDataDb) {
        try {
            return {
                id: data.ID,
                journalId: data.ID_JOURNAL,
                sectorId: data.ID_SECTOR,
                orderId: data.ID_ORDER,
                employeeId: data.ID_EMPLOYEE,
                type: data.DATA_TYPE,
                group: data.DATA_GROUP,
                name: data.DATA_NAME,
                data: data.DATA_VALUE
            } 
        } catch (e) {
            throw e;
        }
    }

    convertBarcodeDbToDto(data: BarcodesDb): IBarcode {
        const result: IBarcode = {
            barcode: data.BARCODE,
            employee: data.EMPLOYEE,
            employeeId: data.ID_EMPLOYERS,
            blocked: data.BLOCKED,
            idSector: data.ID_SECTOR,
            sector: data.SECTOR 
        }
        return result;
    }

    convertDependenciesDbToDto(data: IDependenciesDb): IDependencies {
        const result: IDependencies = {
            id: data.ID,
            journalNameId: data.ID_JOURNAL_NAME,
            transfer: data.ID_SECTOR_TRANSFER,
            accepted: data.ID_SECTOR_ACCEPTED,
            statusAfterId: data.ID_STATUS_AFTER,
            statusAfterOldId: data.ID_STATUS_AFTER_OLD,
            startStage: !!data.START_STAGE
        }
        return result;
    }

    convertAtOrderDbToDto(data: IAtOrdersDb): IAtOrder{
        const result: IAtOrder = {
            id: data.ID,
            itmOrdernum: data.ITM_ORDERNUM,
            journalId: data.JOURNAL_ID,
            journalName: data.JOURNAL_NAME,
            statusId: data.STATUS_ID,
            statusOld: data.STATUS_DESCRIPTION,
            statusOldSectorId: data.OLD_STATUS_ID
        }
        return result;
    }

    convertWorkOrdersDbToDto (data: IWorkOrdersDb): IWorkOrders {
         const result: IWorkOrders = {
             id: data.ID,
             orderId: data.ORDER_ID,
             dateSector: data.DATE_SECTOR,
             dateDescription: data.DATE_DESCRIPTION,
             comment: data.COMMENT,
             date1: data.DATE1,
             date2: data.DATE2,
             date3: data.DATE3
         }
        return result;
    }

    convertLocationOrderDbToDto (data: ILocationOrderDb): ILocationOrder {
        const result: ILocationOrder = {
            orderId: data.ID_ORDER,
            sectorId: data.ID_SECTOR,
            modifer: data.MODIFER
        }
        return result;
    }
}

export default new DtsConverter();