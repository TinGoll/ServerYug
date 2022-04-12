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
exports.Firebird = exports.createCubicDb = exports.createItmDb = exports.Events = void 0;
const node_firebird_1 = __importDefault(require("node-firebird"));
const itmOptions_1 = __importDefault(require("./options/itmOptions"));
const cubicOptions_1 = __importDefault(require("./options/cubicOptions"));
var Events;
(function (Events) {
    Events["row"] = "row";
    Events["result"] = "result";
    Events["attach"] = "attach";
    Events["detach"] = "detach";
    Events["reconnect"] = "reconnect";
    Events["error"] = "error";
    Events["transaction"] = "transaction";
    Events["commit"] = "commit";
    Events["rollback"] = "rollback";
})(Events = exports.Events || (exports.Events = {}));
const createItmDb = () => __awaiter(void 0, void 0, void 0, function* () {
    const db = new Firebird(itmOptions_1.default);
    yield db.create();
    return db;
});
exports.createItmDb = createItmDb;
const createCubicDb = () => __awaiter(void 0, void 0, void 0, function* () {
    const db = new Firebird(cubicOptions_1.default);
    yield db.create();
    return db;
});
exports.createCubicDb = createCubicDb;
class Firebird {
    constructor(options) {
        this.options = options;
    }
    create() {
        return new Promise((resolve, reject) => {
            node_firebird_1.default.attach(this.options, (err, db) => {
                if (err)
                    reject(err);
                this.db = db;
                resolve();
            });
        });
    }
    executeRequest(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.query(query, params, (err, results) => {
                if (err)
                    reject(err);
                resolve(results);
            });
        });
    }
    executeAndReturning(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.query(query, params, (err, row) => {
                if (err)
                    reject(err);
                const res = row;
                resolve(res);
            });
        });
    }
    execute(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.query(query, params, (err, res) => {
                if (err)
                    reject(err);
                resolve();
            });
        });
    }
    startTransaction(transactionCallback) {
        this.db.transaction(node_firebird_1.default.ISOLATION_READ_COMMITED, transactionCallback);
    }
    on(event, eventCallback) {
        this.db.on(event, eventCallback);
    }
    detach() {
        this.db.detach();
    }
}
exports.Firebird = Firebird;
