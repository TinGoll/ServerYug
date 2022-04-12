"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (opt) => {
    let options = Object.assign({}, opt);
    let tempOpt = '';
    if (options.$first) {
        tempOpt = String(options.$first).toUpperCase().replace(/ +/g, ' ').trim();
        if (!tempOpt.includes('FIRST', 0)) {
            tempOpt = tempOpt.replace(new RegExp('FIRST', 'g'), '');
            tempOpt = `FIRST ${parseInt(tempOpt, 10)}`;
        }
        options.$first = tempOpt;
    }
    else
        options.$first = '';
    if (options.$skip) {
        tempOpt = String(options.$skip).toUpperCase().replace(/ +/g, ' ').trim();
        if (!tempOpt.includes('SKIP', 0)) {
            tempOpt = tempOpt.replace(new RegExp('SKIP', 'g'), '');
            tempOpt = `SKIP ${parseInt(tempOpt, 10)}`;
        }
        options.$skip = tempOpt;
    }
    else
        options.$skip = '';
    if (options.$sort) {
        //order by
        tempOpt = String(options.$sort).toUpperCase().replace(/ +/g, ' ').trim();
        if (!tempOpt.includes('ORDER BY', 0)) {
            tempOpt = tempOpt.replace(new RegExp('ORDER BY', 'g'), '');
            tempOpt = tempOpt.replace(new RegExp('ORDERBY', 'g'), '');
            tempOpt = tempOpt.replace(new RegExp('ORDER', 'g'), '');
            tempOpt = tempOpt.replace(new RegExp('BY', 'g'), '');
            tempOpt = `ORDER BY ${tempOpt}`;
        }
        options.$sort = tempOpt;
    }
    else
        options.$sort = '';
    if (options.$where) {
        tempOpt = String(options.$where).replace(/ +/g, ' ').trim();
        var firstWord = tempOpt.replace(/ .*/, '');
        if (!firstWord.toLocaleUpperCase().includes('WHERE', 0) || !firstWord.includes('where', 0) || !firstWord.includes('Where', 0)) {
            /*
            tempOpt = tempOpt.replace(new RegExp('WHERE', 'g'), '');
            tempOpt = tempOpt.replace(new RegExp('where', 'g'), '');
            tempOpt = tempOpt.replace(new RegExp('Where', 'g'), '');
            */
            tempOpt = `WHERE ${tempOpt}`;
        }
        options.$where = tempOpt;
    }
    else
        options.$where = '';
    return options;
};
