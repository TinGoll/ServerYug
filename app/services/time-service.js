"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const date_format_parse_1 = require("date-format-parse");
class TimeService {
    constructor() {
        this.convertToDate = (date, format) => {
            var normalized = date.replace(/[^a-zA-Z0-9]/g, '-');
            var normalizedFormat = format.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
            var formatItems = normalizedFormat.split('-');
            var dateItems = normalized.split('-');
            var monthIndex = formatItems.indexOf("mm");
            var dayIndex = formatItems.indexOf("dd");
            var yearIndex = formatItems.indexOf("yyyy");
            var hourIndex = formatItems.indexOf("hh");
            var minutesIndex = formatItems.indexOf("ii");
            var secondsIndex = formatItems.indexOf("ss");
            var today = new Date();
            var year = yearIndex > -1 ? dateItems[yearIndex] : today.getFullYear();
            var month = monthIndex > -1 ? dateItems[monthIndex] - 1 : today.getMonth() - 1;
            var day = dayIndex > -1 ? dateItems[dayIndex] : today.getDate();
            var hour = hourIndex > -1 ? dateItems[hourIndex] : today.getHours();
            var minute = minutesIndex > -1 ? dateItems[minutesIndex] : today.getMinutes();
            var second = secondsIndex > -1 ? dateItems[secondsIndex] : today.getSeconds();
            return new Date(year, month, day, hour, minute, second);
        };
    }
    getCurrentTime() {
        try {
            const locale = this.getLocale();
            const ts = new Date();
            const currentDate = new Date(ts.getFullYear(), ts.getMonth(), ts.getDate());
            const currentDateTxt = (0, date_format_parse_1.format)(ts, 'DD.MM.YYYY');
            const currentTimeTxt = ts.toLocaleTimeString('ru-Ru', { timeZone: 'Europe/Moscow' });
            const monthTxt = (0, date_format_parse_1.format)(ts, 'MMMM', { locale });
            const monthShortTxt = (0, date_format_parse_1.format)(ts, 'MMM', { locale });
            const weekdayTxt = (0, date_format_parse_1.format)(ts, 'dddd', { locale });
            const weekdayShortTxt = (0, date_format_parse_1.format)(ts, 'ddd', { locale });
            const timeRequest = {
                currentDate,
                currentDateTxt,
                currentTimeTxt,
                monthTxt,
                monthShortTxt,
                weekdayTxt,
                weekdayShortTxt,
                ts,
                timeZoneOffset: ts.getTimezoneOffset()
            };
            return timeRequest;
        }
        catch (e) {
            throw e;
        }
    }
    getLocale() {
        try {
            const locale = {
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
                timeZone: 'Europe/Moscow'
            };
            locale.meridiem = (h, m, isLowercase) => {
                const word = h < 12 ? 'AM' : 'PM';
                return isLowercase ? word.toLocaleLowerCase() : word;
            };
            locale.isPM = (input) => {
                return (input + '').toLowerCase().charAt(0) === 'p';
            };
            return locale;
        }
        catch (e) {
            throw e;
        }
    }
}
exports.default = new TimeService();
