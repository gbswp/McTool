namespace app {
    const defaultTickFormat = "HH:MM:ss";
    /**
     * #前端省略，写在日期开始的位置
     * &后端省略，写在日期结束的位置
     * @全省略，写在日期结束的位置
     * HH，H，D，M，MM，s,ss,S
     * format: string, time: number
     * time必传 单位:秒
     */
    export function formatTick(time: number, format: string = defaultTickFormat): string {
        if (time < 0) time = 0;
        let timeRegExp: RegExp = /D|([HhMs])\1?|S/;
        let del = -1;
        let last = -1;
        let poss: number[] = [];
        let timeNums: number[] = [];
        function changeTimeToStr(num: number, bol: boolean, pos: number): string {
            let count = Math.floor(+time / num);
            poss.push(pos);
            timeNums.push(count);
            if (count > 0) {
                last = -1;
                if (del == -1) del = pos;
                time = +time % num;
            }
            else if (last == -1) last = pos;
            return bol ? pad(count) : count + "";
        }
        let divisor = 0;
        let isPad = false;
        let tempStr = "";
        while (tempStr != format) {
            if (tempStr != "") format = tempStr;
            tempStr = format.replace(timeRegExp, (str) => {
                divisor = 0;
                isPad = false;
                switch (str) {
                    case "D":
                        divisor = 24 * 3600;
                        break;
                    case "hh":
                    case "HH":
                        isPad = true;
                    case "h":
                    case "H":
                        divisor = 3600;
                        break;
                    case "MM":
                        isPad = true;
                    case "M":
                        divisor = 60;
                        break;
                    case "ss":
                        isPad = true;
                    case "s":
                    case "S":
                        divisor = 1;
                        break;
                }
                return changeTimeToStr(divisor, isPad, format.indexOf(str));
            });
        }

        let str = "";
        let index = format.indexOf("#");
        if (index > -1) {
            if (del == -1) str = format.slice(index, index + 1);
            else str = format.slice(index, del);
        }
        index = format.indexOf("&");
        if (index > -1) {
            if (str != "") str += "|"
            if (last == -1) str += format.slice(index, index + 1);
            else str += format.slice(last, index + 1);
        }
        index = format.indexOf("@");
        if (index > -1) {
            if (str != "") str += "|@";
            else str += "@";
            for (let i = 0; i < poss.length; i++) {
                if (timeNums[i] == 0) {
                    str += "|";
                    str += format.slice(poss[i], poss[i + 1] == null ? index : poss[i + 1]);
                }
            }
        }
        timeRegExp = new RegExp(str, "g");
        format = format.replace(timeRegExp, "");
        return format;
    }
    function pad(val: number, len: number = 2): string {
        let val1 = String(val);
        while (val1.length < len) {
            val1 = '0' + val1;
        }
        return val1;
    }
}
