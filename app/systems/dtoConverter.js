"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DtsConverter {
    JournalDataDbToDto(data) {
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
            };
        }
        catch (e) {
            throw e;
        }
    }
    convertBarcodeDbToDto(data) {
        const result = {
            barcode: data.BARCODE,
            employee: data.EMPLOYEE,
            employeeId: data.ID_EMPLOYERS,
            blocked: data.BLOCKED,
            idSector: data.ID_SECTOR,
            sector: data.SECTOR
        };
        return result;
    }
    convertDependenciesDbToDto(data) {
        const result = {
            id: data.ID,
            journalNameId: data.ID_JOURNAL_NAME,
            transfer: data.ID_SECTOR_TRANSFER,
            accepted: data.ID_SECTOR_ACCEPTED,
            statusAfterId: data.ID_STATUS_AFTER,
            statusAfterOldId: data.ID_STATUS_AFTER_OLD,
            startStage: !!data.START_STAGE
        };
        return result;
    }
    convertAtOrderDbToDto(data) {
        const result = {
            id: data.ID,
            itmOrdernum: data.ITM_ORDERNUM,
            journalId: data.JOURNAL_ID,
            journalName: data.JOURNAL_NAME,
            statusId: data.STATUS_ID,
            statusOld: data.STATUS_DESCRIPTION,
            statusOldSectorId: data.OLD_STATUS_ID
        };
        return result;
    }
    convertWorkOrdersDbToDto(data) {
        const result = {
            id: data.ID,
            orderId: data.ORDER_ID,
            dateSector: data.DATE_SECTOR,
            dateDescription: data.DATE_DESCRIPTION,
            comment: data.COMMENT,
            date1: data.DATE1,
            date2: data.DATE2,
            date3: data.DATE3
        };
        return result;
    }
    convertLocationOrderDbToDto(data) {
        const result = {
            orderId: data.ID_ORDER,
            sectorId: data.ID_SECTOR,
            modifer: data.MODIFER
        };
        return result;
    }
}
exports.default = new DtsConverter();
