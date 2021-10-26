let startMs = new Date('2021-10-01T10:24:00').valueOf();
let endMs = new Date('2021-10-11T09:24:00').valueOf();
let tempStartMs = startMs;
let oneDayMs = 24 * 60 * 60 * 1000;
let oneSmena = 9 *60 *60 * 1000;
let oneHours = 60*60*1000;
let weekdays = 0;
let workDay = 0; 
let dayCount = (endMs - startMs)/oneDayMs;

while (tempStartMs <= endMs) {
    let day = (new Date(tempStartMs)).getDay();
    if (day !== 0 && day !== 6) {
        workDay++;
    }else{
        weekdays++;
    }
    tempStartMs += oneDayMs;

}
if ((new Date(endMs)).getDay() !== 0 && (new Date(endMs)).getDay() !== 6) workDay--;
else weekdays--;

let tailMs =(dayCount - (workDay + weekdays))*oneDayMs;

console.log(Math.round(tailMs/oneHours));
console.log(weekdays);
console.log(workDay);