namespace app {
    const defaultDateFormat = "yyyy-mm-dd HH:MM:ss";
    const timeRegExp: RegExp = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMs])\1?|[LloSZWN]/g;
    // const timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;
    // const timezoneClip = /[^-+\dA-Z]/g;
    // const i18n = {
    //     dayNames: [
    //         'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
    //         'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    //     ],
    //     monthNames: [
    //         'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    //         'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
    //     ]
    // };

    /**
     * time为Date时format前缀"u"=UTC,"g" = GMT
     * format: string,
     * time: Date//必传
     */
    export function formatDate(time: Date, format: string = defaultDateFormat): string {
        let utc = false;
        if (format.charAt(0) == "u") {
            format = format.slice(1);
            utc = true;
        }
        let gmt = false;
        if (format.charAt(0) == "g") {
            format = format.slice(1);
            gmt = true;
        }

        let _ = utc ? 'getUTC' : 'get';
        let d = (time as any)[_ + 'Date']();
        let D = (time as any)[_ + 'Day']();
        let m = (time as any)[_ + 'Month']();
        let y = (time as any)[_ + 'FullYear']();
        let H = (time as any)[_ + 'Hours']();
        let M = (time as any)[_ + 'Minutes']();
        let s = (time as any)[_ + 'Seconds']();
        let L = (time as any)[_ + 'Milliseconds']();
        let o = utc ? 0 : time.getTimezoneOffset();
        // let W = getWeek(time);
        let flags: any = {
            d: d,
            dd: pad(d),
            // ddd: i18n.dayNames[D],
            // dddd: i18n.dayNames[D + 7],
            m: m + 1,
            mm: pad(m + 1),
            // mmm: i18n.monthNames[m],
            // mmmm: i18n.monthNames[m + 12],
            yy: String(y).slice(2),
            yyyy: y,
            h: H % 12 || 12,
            hh: pad(H % 12 || 12),
            H: H,
            HH: pad(H),
            M: M,
            MM: pad(M),
            s: s,
            ss: pad(s),
            // l: pad(L, 3),
            // L: pad(Math.round(L / 10)),
            // Z: gmt ? 'GMT' : utc ? 'UTC' : (String(time).match(timezone) || ['']).pop().replace(timezoneClip, ''),
            // o: (o > 0 ? '-' : '+') + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
            // S: ['th', 'st', 'nd', 'rd'][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10 ? 0 : 1) * d % 10],
            // W:    W,
            // N: D == 0 ? 7 : D,
        };
        format = format.replace(timeRegExp, (str: string) => {
            return flags[str];
        });
        return format;
    }
    function pad(val: number, len: number = 2): string {
        let val1 = String(val);
        while (val1.length < len) {
            val1 = '0' + val1;
        }
        return val1;
    }

    // function getWeek(date) {
    //     // Remove time components of date
    //     let targetThursday = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    //     // Change date to Thursday same week
    //     targetThursday.setDate(targetThursday.getDate() - ((targetThursday.getDay() + 6) % 7) + 3);

    //     // Take January 4th as it is always in week 1 (see ISO 8601)
    //     let firstThursday = new Date(targetThursday.getFullYear(), 0, 4);

    //     // Change date to Thursday same week
    //     firstThursday.setDate(firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3);

    //     // Check if daylight-saving-time-switch occured and correct for it
    //     let ds = targetThursday.getTimezoneOffset() - firstThursday.getTimezoneOffset();
    //     targetThursday.setHours(targetThursday.getHours() - ds);

    //     // Number of weeks between target Thursday and first Thursday
    //     let weekDiff = (targetThursday.getTime() - firstThursday.getTime()) / (86400000 * 7);
    //     return 1 + Math.floor(weekDiff);
    // }
}
