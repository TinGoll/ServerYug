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
}
exports.default = new DtsConverter();
