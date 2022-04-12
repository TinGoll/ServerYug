"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAdoptedQueryHash = exports.setAdoptedQueryHash = exports.getAdoptedQueryHash = exports.adoptedQueryHashData = void 0;
exports.adoptedQueryHashData = [];
const getAdoptedQueryHash = (httpQueryId) => {
    try {
        const hash = exports.adoptedQueryHashData.find(d => d.httpQueryId == httpQueryId);
        if (!hash)
            return null;
        return hash;
    }
    catch (e) {
        return null;
    }
};
exports.getAdoptedQueryHash = getAdoptedQueryHash;
const setAdoptedQueryHash = (hashData) => {
    try {
        const index = exports.adoptedQueryHashData.findIndex(d => d.httpQueryId == hashData.httpQueryId);
        if (index < 0) {
            exports.adoptedQueryHashData.push(hashData);
        }
        else {
            (0, exports.clearAdoptedQueryHash)(hashData.httpQueryId);
            exports.adoptedQueryHashData.push(hashData);
        }
    }
    catch (e) {
        throw e;
    }
};
exports.setAdoptedQueryHash = setAdoptedQueryHash;
const clearAdoptedQueryHash = (httpQueryId) => {
    try {
        if (httpQueryId) {
            const index = exports.adoptedQueryHashData.findIndex(d => d.httpQueryId == httpQueryId);
            if (index >= 0) {
                exports.adoptedQueryHashData.splice(index, 1);
            }
        }
        else {
            exports.adoptedQueryHashData.splice(0, exports.adoptedQueryHashData.length);
        }
    }
    catch (e) {
        console.log(e);
    }
};
exports.clearAdoptedQueryHash = clearAdoptedQueryHash;
