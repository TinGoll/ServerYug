export declare interface ITimeRequest {
    currentDate: Date; 
    currentDateTxt: string;
    currentTimeTxt: string;
    monthTxt: string;
    monthShortTxt: string;
    weekdayTxt: string;
    weekdayShortTxt: string;
    ts: Date;
}

export declare interface ILocale {
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