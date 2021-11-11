import { ZonedDateEx } from "node-firebird-driver";

export const dateToString = (d: Date):string => {
    return d && `${(d.getFullYear() + '').padStart(4, '0')}-${d.getMonth() + 1}-${d.getDate()}`;
}

export const timeToString = (d: Date): string => {
    return d && `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}.${d.getMilliseconds()}`;
}

export const timeTzToString = (zd:ZonedDateEx):string| null => {
    if (!zd)
        return null;
    const d = new Date(zd.date.getTime() + (zd.offset * 60 * 1000));
    return `time '${d.getUTCHours()}:${d.getUTCMinutes()}:${d.getUTCSeconds()}.${d.getUTCMilliseconds()} ${zd.timeZone}'`;
}

export const  dateTimeToString = (d: Date): string => {
    return d && `${dateToString(d)} ${timeToString(d)}`;
}

export const dateTimeTzToString = (zd: ZonedDateEx): string | null => {
    if (!zd)
        return null;
    const d = new Date(zd.date.getTime() + (zd.offset * 60 * 1000));
    return `timestamp '${(d.getUTCFullYear() + '').padStart(4, '0')}-${d.getUTCMonth() + 1}-${d.getUTCDate()} ` +
        `${d.getUTCHours()}:${d.getUTCMinutes()}:${d.getUTCSeconds()}.${d.getUTCMilliseconds()} ${zd.timeZone}'`;
}

export default  {
    dateToString,
    timeToString,
    timeTzToString,
    dateTimeToString,
    dateTimeTzToString
}