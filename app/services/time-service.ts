import { ILocale, ITimeRequest } from "../types/time-types";
import { format } from 'date-format-parse';

class TimeService {

    convertToDate = (date: string, format: string): Date => {
        var normalized: string      = date.replace(/[^a-zA-Z0-9]/g, '-');
        var normalizedFormat: string = format.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
        var formatItems: any    = normalizedFormat.split('-');
        var dateItems: any       = normalized.split('-');
        var monthIndex    = formatItems.indexOf("mm");
        var dayIndex      = formatItems.indexOf("dd");
        var yearIndex     = formatItems.indexOf("yyyy");
        var hourIndex     = formatItems.indexOf("hh");
        var minutesIndex  = formatItems.indexOf("ii");
        var secondsIndex  = formatItems.indexOf("ss");
        var today = new Date();
        var year  = yearIndex>-1  ? dateItems[yearIndex]    : today.getFullYear();
        var month = monthIndex>-1 ? dateItems[monthIndex]-1 : today.getMonth()-1;
        var day   = dayIndex>-1   ? dateItems[dayIndex]     : today.getDate();
        var hour    = hourIndex>-1      ? dateItems[hourIndex]    : today.getHours();
        var minute  = minutesIndex>-1   ? dateItems[minutesIndex] : today.getMinutes();
        var second  = secondsIndex>-1   ? dateItems[secondsIndex] : today.getSeconds();
        return new Date(year,month,day,hour,minute,second);
    }

    getCurrentTime(): ITimeRequest {
        try {
            const locale = this.getLocale();
            const ts = new Date();
            const currentDate = new Date(ts.getFullYear(), ts.getMonth(), ts.getDate());
            const currentDateTxt = format(ts, 'DD.MM.YYYY');
            const currentTimeTxt = format(ts, 'HH:mm');
            const monthTxt       = format(ts, 'MMMM', {locale});
            const monthShortTxt  = format(ts, 'MMM', {locale});
            const weekdayTxt       = format(ts, 'dddd', {locale});
            const weekdayShortTxt  = format(ts, 'ddd', {locale});

            const timeRequest: ITimeRequest = {
                currentDate,
                currentDateTxt,
                currentTimeTxt,
                monthTxt,
                monthShortTxt,
                weekdayTxt,
                weekdayShortTxt,
                ts
            }
            return timeRequest;
        } catch (e) {
            throw e;
        }
    }

    getLocale (): ILocale {
        try {
            const locale: ILocale = {
                 // MMMM
                months: [
                    'Январь',
                    'Февраль',
                    'Март',
                    'Апрель',
                    'Май',
                    'Июнь',
                    'Июль',
                    'Август',
                    'Сентябрь',
                    'Октябрь',
                    'Ноябрь',
                    'Декабрь',
                ],
                // MMM
                monthsShort: ['Янв', 'Фев', 'Мрт', 'Апр', 'Май', 'Июнь', 'Июль', 'Авг', 'Сент', 'Окт', 'Нб', 'Дек'],
                // dddd
                weekdays: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
                // ddd
                weekdaysShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
                // dd
                weekdaysMin: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
                meridiemParse: /[ap]\.?m?\.?/i,
            }
            locale.meridiem = (h: number, m: number, isLowercase: boolean) => {
                    const word = h < 12 ? 'AM' : 'PM';
                    return isLowercase ? word.toLocaleLowerCase() : word;
            }
            locale.isPM = (input: string) => {
                return (input + '').toLowerCase().charAt(0) === 'p';
            }
            return locale;
        } catch (e) {
            throw e;
        }
    }
}

export default new TimeService();