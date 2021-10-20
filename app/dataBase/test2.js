
let queryStatuses = [1, 2, 3, 5];

let TempArr = ['re-re', ...queryStatuses];

console.log(TempArr);

/*
let txt = ``;
if (queryStatuses.length) {
        queryStatuses.forEach(s => {TempArr.push(`LIST_STATUSES.ID = ${s}`);});
        txt += `(${TempArr.join(' OR\n')})`
    }
console.log(txt);
*/