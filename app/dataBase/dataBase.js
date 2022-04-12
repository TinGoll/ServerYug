"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDateToDb = exports.executeRequest = void 0;
const node_firebird_1 = __importDefault(require("node-firebird"));
const settingsDB_1 = __importDefault(require("../../config/.firebirdDB/settingsDB"));
const pool = node_firebird_1.default.pool(5, settingsDB_1.default);
const executeRequest = (query) => {
    return new Promise((res, rej) => {
        pool.get((err, db) => {
            if (err)
                return rej(err);
            db.query(query, (err, result) => {
                db.detach();
                if (err)
                    return rej(err);
                return res(result);
            });
        });
        pool.destroy();
    });
};
exports.executeRequest = executeRequest;
const formatDateToDb = (date) => {
    if (!date)
        return null;
    return date.toLocaleDateString();
};
exports.formatDateToDb = formatDateToDb;
