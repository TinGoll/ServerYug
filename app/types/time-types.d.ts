export declare interface ITimeRequest {
    currentDate: Date; 
    currentDateTxt: string;
    currentTimeTxt: string;
    monthTxt: string;
    monthShortTxt: string;
    weekdayTxt: string;
    weekdayShortTxt: string;
    ts: Date;
    timeZoneOffset?: any
}

export declare interface ILocale {
    timeZone?: string;
    months: string[];
    monthsShort: string[];
    weekdays: string[];
    weekdaysShort: string[];
    weekdaysMin: string[];
    meridiem?: (hours: number, minutes: number, isLowercase: boolean) => string;
    meridiemParse?: RegExp;
    isPM?: (input: string) => boolean;
    ordinal?: () => string;
}