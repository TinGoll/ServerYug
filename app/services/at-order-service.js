"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Firebird_1 = require("../firebird/Firebird");
const virtualJournalsFun_1 = __importDefault(require("../systems/virtualJournalsFun"));
const dtoConverter_1 = __importDefault(require("../systems/dtoConverter"));
const ApiError_1 = __importDefault(require("../exceptions/ApiError"));
const date_format_parse_1 = require("date-format-parse");
const atOrder_1 = __importDefault(require("../query/atOrder"));
const adopted_order_system_1 = require("../systems/adopted-order-system");
const old_journal_entry_system_1 = require("../systems/old-journal-entry-system");
const order_plans_system_1 = require("../systems/order-plans-system");
const extra_data_system_1 = __importDefault(require("../systems/extra-data-system"));
class AtOrderService {
    constructor() {
        /**
         * Участки по умолчанию.
         * Офис, упаковка, склад упакованных, отгрузка.
         */
        this.defaultSectorsId = [13, 5, 23, 24];
    }
    transferOrders(transferOrders) {
        var _a, _b, _c, _d, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, Firebird_1.createItmDb)();
                try {
                    const transferOrderErrors = [];
                    if (!transferOrders.idTransfer)
                        transferOrderErrors.push('Передающий участок не может быть пустым');
                    if (!transferOrders.idAccepted)
                        transferOrderErrors.push('Принимающий участок участок не может быть пустым');
                    if (!((_a = transferOrders.orders) === null || _a === void 0 ? void 0 : _a.length))
                        transferOrderErrors.push('Не добавлен ни один заказ, для приема.');
                    for (let i = 0; i < transferOrders.orders.length; i++) {
                        const order = transferOrders.orders[i];
                        const count = transferOrders.orders.filter(o => o.idOrder === order.idOrder);
                        if (count.length > 1)
                            transferOrderErrors.push(`Заказ № ${order.idOrder}, добавлен ${count.length} раз(а), заказ можно передать, только один раз.`);
                    }
                    // Получаем данные по штрих коду.
                    const barcodesDb = yield db.executeRequest(`
                    SELECT B.BARCODE, B.ID_SECTOR, GET_SECTOR_NAME(B.ID_SECTOR) AS SECTOR, B.ID_EMPLOYERS, GET_EMP_NAME(B.ID_EMPLOYERS) AS EMPLOYEE,
                        COALESCE(B.STATUS_BARCODE, 0) AS BLOCKED
                    FROM SECTORS_BARCODE B WHERE UPPER(B.BARCODE) = UPPER(?) OR (UPPER(B.BARCODE) = UPPER(?))
                `, [transferOrders.idTransfer, transferOrders.idAccepted]);
                    const barcodes = barcodesDb.map(b => dtoConverter_1.default.convertBarcodeDbToDto(b));
                    const transfer = barcodes.find(b => b.barcode.toUpperCase() === transferOrders.idTransfer.toUpperCase());
                    const accepted = barcodes.find(b => b.barcode.toUpperCase() === transferOrders.idAccepted.toUpperCase());
                    const barcodeErrors = this.barcodeValidator(transfer, accepted);
                    if (barcodeErrors.length)
                        throw ApiError_1.default.BadRequest('Проблема с карточками сотрудников мебельной фабрики.', barcodeErrors);
                    // Получение участков.
                    // Получаем старое название участка, по id нового участка.
                    const namesTransferOldSector = yield virtualJournalsFun_1.default.getNameOldSectorArrToIdNewSector(transfer.idSector);
                    const namesAcceptedOldSector = yield virtualJournalsFun_1.default.getNameOldSectorArrToIdNewSector(accepted.idSector);
                    const associationNewAndOldSectors = yield virtualJournalsFun_1.default.getOldAndNewSectors();
                    // Деревянно, переделать
                    if ((transfer === null || transfer === void 0 ? void 0 : transfer.idSector) == 5 && (accepted === null || accepted === void 0 ? void 0 : accepted.idSector) == 24)
                        transfer.idSector = 23;
                    const [dependencies, rdependencies, allDependencies] = yield this.dependenciesValidator(transfer === null || transfer === void 0 ? void 0 : transfer.idSector, accepted === null || accepted === void 0 ? void 0 : accepted.idSector);
                    // Если в зависимости передающий этап являеться стартовым.
                    const isStartingStage = ((_b = (dependencies.find(d => d.startStage))) === null || _b === void 0 ? void 0 : _b.startStage) || false;
                    if (!dependencies.length) {
                        transferOrderErrors.push(`Участок "${transfer === null || transfer === void 0 ? void 0 : transfer.sector}" не может передавать заказы в участок "${accepted === null || accepted === void 0 ? void 0 : accepted.sector}".`);
                        if (rdependencies)
                            transferOrderErrors.push(`Однако, участок "${accepted === null || accepted === void 0 ? void 0 : accepted.sector}" может передавать заказы участку "${transfer === null || transfer === void 0 ? void 0 : transfer.sector}", проверьте правильность отсканированных карт.`);
                    }
                    const ordersToString = transferOrders.orders.map(o => o.idOrder).join(', ');
                    const ordersFromDb = yield db.executeRequest(`SELECT DISTINCT
                        O.ID, O.ITM_ORDERNUM, S.ID AS OLD_STATUS_ID, S.STATUS_DESCRIPTION, GET_JSTATUS_ID(O.ID) AS STATUS_ID,
                        J.ID AS JOURNAL_ID, N.NAME AS JOURNAL_NAME
                    FROM ORDERS_IN_PROGRESS O
                        LEFT JOIN LIST_STATUSES S ON (O.ORDER_STATUS = S.STATUS_NUM)
                        LEFT JOIN JOURNALS J ON (J.ID_ORDER = O.ID AND
                            EXISTS (SELECT T.ID FROM JOURNAL_TRANS T WHERE T.ID_JOURNAL = J.ID AND T.ID_SECTOR = ${transfer === null || transfer === void 0 ? void 0 : transfer.idSector} AND T.MODIFER < 0) AND
                            EXISTS (SELECT T.ID FROM JOURNAL_TRANS T WHERE T.ID_JOURNAL = J.ID AND T.ID_SECTOR = ${accepted === null || accepted === void 0 ? void 0 : accepted.idSector} AND T.MODIFER > 0))
                        LEFT JOIN JOURNAL_NAMES N ON (J.ID_JOURNAL_NAMES = N.ID)
                    WHERE O.ID IN (${ordersToString})`);
                    const orderWorksDb = yield db.executeRequest(`
                    SELECT P.ID, P.ORDER_ID, P.DATE_SECTOR, P.DATE_DESCRIPTION, P.COMMENT, P.DATE1, P.DATE2, P.DATE3
                    FROM ORDERS_DATE_PLAN P WHERE P.ORDER_ID IN (${ordersToString})
                `);
                    const orderLocationsDb = yield db.executeRequest(`SELECT * FROM LOCATION_ORDER L WHERE L.ID_ORDER IN (${ordersToString}) AND L.ID_SECTOR = ${(transfer === null || transfer === void 0 ? void 0 : transfer.idSector) || 0}`, []);
                    const ordersAt = ordersFromDb.map(o => dtoConverter_1.default.convertAtOrderDbToDto(o));
                    const orderWorks = orderWorksDb.map(w => dtoConverter_1.default.convertWorkOrdersDbToDto(w));
                    const locationOrders = orderLocationsDb.map(l => dtoConverter_1.default.convertLocationOrderDbToDto(l));
                    const ordersExtraData = transferOrders.extraData || [];
                    //if (!ordersAt.length) transferOrderErrors.push('Ни один из указанных заказов, не может быть передан, в виду отсутствия их в работе. Обратитесь к менеджеру заказа.');
                    if (transferOrderErrors.length)
                        throw ApiError_1.default.BadRequest("Ошибка приема - передачи заказов.", transferOrderErrors);
                    for (const order of transferOrders.orders) {
                        // По умолчанию.
                        order.completed = true;
                        order.description = 'Успешно.';
                        order.modiferCount = 1;
                        const orderDb = ordersAt.find(o => o.id === (order === null || order === void 0 ? void 0 : order.idOrder));
                        const works = orderWorks === null || orderWorks === void 0 ? void 0 : orderWorks.filter(w => w.orderId === order.idOrder);
                        const location = locationOrders.find(l => l.orderId === order.idOrder);
                        // Старый вариант комментария, обеденяем с новым через доп-свойства
                        if (order.comment) {
                            const extraComment = ordersExtraData.find(e => { var _a; return e.orderId === order.idOrder && ((_a = e.group) === null || _a === void 0 ? void 0 : _a.toUpperCase()) === 'Comment'.toUpperCase(); });
                            if (extraComment) {
                                if (((_c = extraComment.data) === null || _c === void 0 ? void 0 : _c.toUpperCase()) !== order.comment.toUpperCase()) {
                                    extraComment.data += `, ${order.comment}`;
                                }
                            }
                            else {
                                const commentData = {
                                    orderId: order.idOrder,
                                    journalId: 0,
                                    group: "Comment",
                                    type: "text",
                                    name: "Комментарий",
                                    list: [],
                                    data: order.comment
                                };
                                ordersExtraData.push(commentData);
                            }
                        }
                        // Получаем все экстра - данные по этому заказу.
                        const extraData = ordersExtraData.filter(e => e.orderId === order.idOrder);
                        if (!(order === null || order === void 0 ? void 0 : order.idOrder) || !orderDb) {
                            order.completed = false;
                            const statusAndLocation = yield this.getOrderStatusAndLocation(order.idOrder);
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
                        if (!virtualJournalsFun_1.default.isWorkPlan(namesTransferOldSector, works)) {
                            const defaultTransferSectorId = this.defaultSectorsId.find(s => transfer === null || transfer === void 0 ? void 0 : transfer.idSector);
                            if (!defaultTransferSectorId) {
                                order.completed = false;
                                order.description = `Не запланированы работы, по участку ${transfer === null || transfer === void 0 ? void 0 : transfer.sector}. Обратитесь к менеджеру заказа.`;
                                continue;
                            }
                        }
                        if (!virtualJournalsFun_1.default.isWorkPlan(namesAcceptedOldSector, works)) {
                            const defaultAcceptedSectorId = this.defaultSectorsId.find(s => transfer === null || transfer === void 0 ? void 0 : transfer.idSector);
                            if (!defaultAcceptedSectorId) {
                                order.completed = false;
                                order.description = `Не запланированы работы, по участку ${accepted === null || accepted === void 0 ? void 0 : accepted.sector}. Обратитесь к менеджеру заказа.`;
                                continue;
                            }
                        }
                        if (orderDb.journalId) {
                            order.completed = false;
                            order.description = `Заказ уже был передан из участка ${transfer === null || transfer === void 0 ? void 0 : transfer.sector} в участок ${accepted === null || accepted === void 0 ? void 0 : accepted.sector}. Повторная передача невозможна`;
                            continue;
                        }
                        order.modiferCount = (location === null || location === void 0 ? void 0 : location.modifer) || 1;
                        if (!isStartingStage) {
                            if (!(location === null || location === void 0 ? void 0 : location.modifer) || location.modifer <= 0) {
                                /** Изменена логика проверки на наличие заказа в участке.
                                 *  Если нет работ по передаче в текущий участок, то принимаем.
                                 */
                                const isTherePlans = yield this.sectorValidator(transfer === null || transfer === void 0 ? void 0 : transfer.idSector, works, allDependencies, associationNewAndOldSectors);
                                if (isTherePlans) {
                                    order.completed = false;
                                    order.description = `Заказ не был передан в участок ${transfer === null || transfer === void 0 ? void 0 : transfer.sector} и ${transfer === null || transfer === void 0 ? void 0 : transfer.sector} не являеться стартовым участком.`;
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
                            values (${order.idOrder}, ${((_d = dependencies[0]) === null || _d === void 0 ? void 0 : _d.journalNameId) || null}, CURRENT_TIMESTAMP, '${(0, date_format_parse_1.format)(transferOrders.date || new Date(), 'DD.MM.YYYY HH:mm:ss')}') returning ID into :ID;

                            insert into JOURNAL_TRANS (ID_EMPLOYEE, ID_SECTOR, ID_JOURNAL, MODIFER)
                            values (${(transfer === null || transfer === void 0 ? void 0 : transfer.employeeId) || null}, ${(transfer === null || transfer === void 0 ? void 0 : transfer.idSector) || null}, :ID, ${Math.abs(order.modiferCount) * -1});

                            insert into JOURNAL_TRANS (ID_EMPLOYEE, ID_SECTOR, ID_JOURNAL, MODIFER)
                            values (${(accepted === null || accepted === void 0 ? void 0 : accepted.employeeId) || null}, ${accepted === null || accepted === void 0 ? void 0 : accepted.idSector}, :ID, ${Math.abs(order.modiferCount)});

                            insert into cost_of_work (id_journal, id_work_price, price)
                            select :ID as id_journal, p.id as id_price, p.price from work_prices p
                            where p.id_sector = ${(transfer === null || transfer === void 0 ? void 0 : transfer.idSector) || null};
                            suspend;
                        end`;
                        const [newJournalEntry] = yield db.executeRequest(query);
                        if (!newJournalEntry.ID) {
                            order.completed = false;
                            order.description = `Ошибка сохранения заказа в журнале. Обратитесь к разработчику.`;
                            continue;
                        }
                        if (dependencies[0].statusAfterOldId) {
                            const oldStatusNum = yield virtualJournalsFun_1.default.getStatusNumOldToIdStatusOld((_e = dependencies[0]) === null || _e === void 0 ? void 0 : _e.statusAfterOldId);
                            if (oldStatusNum)
                                yield db.execute(`update ORDERS O set O.ORDER_STATUS = ${oldStatusNum} where O.ID = ${order.idOrder}`);
                        }
                        if (dependencies[0].statusAfterId) {
                            yield db.execute(`INSERT INTO JOURNAL_STATUS_LIST (ID_ORDER, ID_JOURNAL, ID_STATUS)
                                                VALUES(${order.idOrder}, ${newJournalEntry.ID}, ${dependencies[0].statusAfterId})`);
                        }
                        for (const data of extraData) {
                            data.journalId = newJournalEntry.ID;
                        }
                    }
                    if (ordersExtraData && (ordersExtraData === null || ordersExtraData === void 0 ? void 0 : ordersExtraData.length)) {
                        const extraDataSystem = new extra_data_system_1.default();
                        yield extraDataSystem.addToArray(ordersExtraData);
                    }
                    /** Добавление заказа в старый журнал, выполняеться асинхронно без ожидания результата */
                    const oldJournalEntry = new old_journal_entry_system_1.OldJournalEntry();
                    oldJournalEntry.push(transferOrders, ordersAt, ordersExtraData, dependencies);
                    /** Обновление системы планов, выполняеться асинхронно без ожидания результата. */
                    const orderPlanSystem = new order_plans_system_1.OrderPlanSystem();
                    orderPlanSystem.refrash();
                    const countOrders = (_f = transferOrders.orders) === null || _f === void 0 ? void 0 : _f.filter(o => o.completed).length;
                    let message = `${countOrders ? '☑️ Принято ' + countOrders + ' из ' + transferOrders.orders.length : '❌ Не один из заказов не принят.'}`;
                    if (countOrders == transferOrders.orders.length)
                        message = `✅ Все заказы приняты. (${transferOrders.orders.length})`;
                    for (const d of dependencies) {
                        (0, adopted_order_system_1.clearAdoptedQueryHash)(d.journalNameId);
                    }
                    return { message, orders: transferOrders.orders };
                }
                catch (e) {
                    throw e;
                }
                finally {
                    db.detach();
                }
            }
            catch (e) {
                throw e;
            }
        });
    }
    sectorValidator(sectorId, works, allDependencies, associationNewAndOldSectors) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, Firebird_1.createItmDb)();
                try {
                    const acceptedSectors = allDependencies.filter(d => d.accepted === sectorId).map(d => d.transfer);
                    for (const s of acceptedSectors) {
                        const oldNames = associationNewAndOldSectors.filter(o => o.newId === s);
                        if (virtualJournalsFun_1.default.isWorkPlan(oldNames.map(o => o.oldName), works))
                            return true;
                    }
                    return false;
                }
                catch (e) {
                    throw e;
                }
                finally {
                    db.detach();
                }
            }
            catch (e) {
                throw e;
            }
        });
    }
    /**
     *
     * @param transferSectorId - Передающий участок (ID)
     * @param acceptedSectorId - Принимающий участок (ID)
     * @returns - Массив из двух элементов, с массивом зависимостей. Первый элемент стандартные зависимости, второй реверсивные. Для проверки обратной передачи.
     */
    dependenciesValidator(transferSectorId, acceptedSectorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, Firebird_1.createItmDb)();
                try {
                    // Получаем зависимости
                    const dependenciesDb = yield db.executeRequest(`SELECT * FROM JOURNAL_DEP D WHERE D.ID_SECTOR_TRANSFER = ? AND D.ID_SECTOR_ACCEPTED = ?`, [transferSectorId || null, acceptedSectorId || null]);
                    const dependencies = dependenciesDb.map(d => dtoConverter_1.default.convertDependenciesDbToDto(d));
                    const reverseDependenciesDb = yield db.executeRequest(`SELECT * FROM JOURNAL_DEP D WHERE D.ID_SECTOR_TRANSFER = ? AND D.ID_SECTOR_ACCEPTED = ?`, [acceptedSectorId || null, transferSectorId || null]);
                    const reverseDependencies = reverseDependenciesDb.map(d => dtoConverter_1.default.convertDependenciesDbToDto(d));
                    const allDependenciesDb = yield db.executeRequest(`SELECT * FROM JOURNAL_DEP D`);
                    const allDependencies = allDependenciesDb.map(d => dtoConverter_1.default.convertDependenciesDbToDto(d));
                    return [dependencies, reverseDependencies, allDependencies];
                }
                catch (e) {
                    throw e;
                }
                finally {
                    db.detach();
                }
            }
            catch (e) {
                throw e;
            }
        });
    }
    barcodeValidator(transfer, accepted) {
        const errors = [];
        try {
            if (!transfer)
                errors.push('Штрих - код передающего участка, не обнаружен. Попробуйте еще раз. Если проблема повторяется, обратитесь к администратору.');
            if (!accepted)
                errors.push('Штрих - код принимающего участка, не обнаружен. Попробуйте еще раз. Если проблема повторяется, обратитесь к администратору.');
            if (transfer && (transfer === null || transfer === void 0 ? void 0 : transfer.blocked))
                errors.push('Карта передающей стороны заблокирована');
            if (accepted && (accepted === null || accepted === void 0 ? void 0 : accepted.blocked))
                errors.push('Карта принимающей стороны заблокирована');
            if (!(transfer === null || transfer === void 0 ? void 0 : transfer.idSector) || (transfer === null || transfer === void 0 ? void 0 : transfer.idSector) === 14)
                errors.push('Карта передающей стороны не инициализирована.');
            if (!(accepted === null || accepted === void 0 ? void 0 : accepted.idSector) || (accepted === null || accepted === void 0 ? void 0 : accepted.idSector) === 14)
                errors.push('Карта принимающей стороны не инициализирована.');
            return errors;
        }
        catch (e) {
            errors.push('Ошибка проверки штрих -кодов.');
            return errors;
        }
    }
    /**
    * Возвращает массив штрих-кодов.
    * @returns BarcodesDb[]
    */
    getBarcodes() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = atOrder_1.default.get('get_barcodes');
                const db = yield (0, Firebird_1.createItmDb)();
                const barcode = yield db.executeRequest(query);
                db.detach();
                return barcode;
            }
            catch (e) {
                throw e;
            }
        });
    }
    /**
     *
     * @returns
     */
    getJournalNames() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = atOrder_1.default.get('get_barcodes');
                const db = yield (0, Firebird_1.createItmDb)();
                const barcode = yield db.executeRequest(query);
                db.detach();
                return barcode;
            }
            catch (e) {
                throw e;
            }
        });
    }
    getOrderStatusAndLocation(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const db = yield (0, Firebird_1.createItmDb)();
                const [orderDb] = yield db.executeRequest(query, [orderId]);
                if (!orderDb)
                    throw ApiError_1.default.BadRequest("Ошибка получения данных по заказу.");
                const locationAndStatus = this.convertStatusAndLocation(orderDb);
                return locationAndStatus;
            }
            catch (e) {
                console.log(e);
                return null;
            }
        });
    }
    convertStatusAndLocation(data) {
        const result = {
            statusOldId: data.ID_OLD_STATUS,
            statusOld: data.OLD_STATUS,
            statusOldNum: data.OLD_STATUS_NUM,
            statusId: data.ID_STATUS,
            status: data.STATUS,
            manager: data.MANAGER,
            locationId: data.ID_LOCATION,
            location: data.LOCATION
        };
        return result;
    }
}
exports.default = new AtOrderService();
