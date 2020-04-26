// TypeScript file
namespace app.utils {

    const ChieseNumMap = { 0: "零", 1: "一", 2: "二", 3: "三", 4: "四", 5: "五", 6: "六", 7: "七", 8: "八", 9: "九", 10: "十" };


    export function getPhotoBase64(sp: Laya.Sprite) {
        let htmlCanvas = sp.drawToCanvas(sp.width, sp.height, 0, 0);
        var canvas = htmlCanvas.getCanvas();
        return canvas.toDataURL("image/png");
    }


    //转义特殊字符
    export function transferHtml(params: string) {
        let str = params.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return str;
    }

    export function generateUniqId(len: number): string {
        let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        let uuid: string[] = [];
        for (let i = 0; i < len; i++) {
            uuid.push(chars[0 | Math.random() * chars.length]);
        }
        return uuid.join('');
    }

    export function encodeURIParam(param: any): string {
        let strs = [];
        for (let key in param) {
            strs.push(key + '=' + encodeURIComponent(param[key]));
        }
        return strs.join('&');
    }

    export function getDefinitionByName<T>(name: string): any {
        let fields = name.split('.');
        let obj: any = window;
        for (let i = 0; i < fields.length; i++) {
            obj = obj[fields[i]];
            if (obj == null)
                break;
        }
        return obj !== window ? obj : null;
    }

    export function getDigitString(count: number): string {
        var str = count + "";
        var w = 10000;
        var y = 100000000;
        var unitStr = "万"

        var left = "";
        var right = "";
        if (count < w) {
            str = count + "";
            unitStr = "";
        } else if (count == w) {
            str = "1";
        } else if (count >= w && count < y) {
            left = str.substring(0, str.length - 4)
            right = str.substring(str.length - 4, str.length - 3);
            str = left + "." + right;
        } else if (count >= y) {
            unitStr = "亿"
            if (count == y) {
                str = "1";
            } else {
                left = str.substring(0, str.length - 8);
                right = str.substring(str.length - 8, str.length - 7);
                str = left + "." + right;
            }
        }
        return str + unitStr;
    }

    export function getDigitString2(count: number, digit: number = 1, significantDigit: number = 4, maxMyriabit: boolean = false): string {
        let str: string;
        str = count + '';
        if (str.length <= significantDigit) return str;
        count = count / 10000.0;
        if (maxMyriabit) return getFiexd(count, digit) + '万';
        if (count < 10000) return getFiexd(count, digit) + '万';
        count = count / 10000.0;
        return getFiexd(count, digit) + '亿';

        function getFiexd(count: number, digit: number): string {
            let temp = Math.floor(count) + "";
            let len = digit;
            if (temp.length + len < 3 && digit > 0) len = 3 - temp.length;
            let num = Math.pow(10, len);
            let curCnt = +(count * num).toFixed(10);  //浮点运算容易出错
            // let curCnt = getFloatFixed(count, num);
            return Math.floor(curCnt) / num + "";
        }

        //浮点数相乘的较精确计算
        function getFloatFixed(num1: number, num2: number) {
            let tempStr1 = _.split(_.toString(num1), ".");
            let tempStr2 = _.split(_.toString(num2), ".");
            let tempLen1 = tempStr1 ? tempStr1.length : 0;
            let tempLen2 = tempStr2 ? tempStr2.length : 0;
            return Number(_.toString(num1).replace(".", "")) * Number(_.toString(num2).replace(".", "")) / Math.pow(10, (tempLen1 + tempLen2));
        }
    }




    export function getMenoryNumber(menory: number) {
        let str = "";
        let sizeK = menory / 1024;
        if (sizeK < 1) {
            str = menory + "B";
        } else {
            let sizeM = sizeK / 1024;
            if (sizeM < 1)
                str = sizeK.toFixed(2) + "KB";
            else
                str = sizeM.toFixed(2) + "MB";
        }
        return str;
    }

    export function renderDivHtmlText(str: string, color?: string) {
        if (color != undefined)
            return `<span style='color:${color}'>${str}</span>`;
        else
            return `<span>${str}</span>`;
    }
    export function renderDivHtmlText2(str: string, color?: string, size: number = 20) {
        if (color != undefined)
            return `<span style='color:${color};font-size:${size}px'>${str}</span>`;
        else
            return `<span>${str}</span>`;
    }

    export function renderDivHtmlImage(skin: string, width: number, height: number) {
        return `<img src='${skin}' style = 'width:${width}px;height:${height}px'></img>`
    }

    export function renderDivHtmlHref(content: string, color: string, data: string) {
        return `<span href='${data}' style = 'color:${color}'>${content}</span>`
    }


    export function isHtmlStr(str: string) {
        let reg = /\<(\w+)\s.*\>.*?\<\/\1\>/g;
        return reg.test(str);
    }

    export function transformHtml(str: string) {
        if (!isHtmlStr(str)) {
            str = `<span>${str}</span>`;
        }
        return str;
    }

    //将数字转换为中文, 只支持到100内的中文数字
    export function getChinseNum(value: number, keepDecade: boolean = false): string {
        let frontValue = Math.floor(value / 10);
        if (frontValue <= 0) {
            let str = ChieseNumMap[value] || ""
            if (keepDecade)
                str = "零" + str;
            return str;
        }
        else if (frontValue < 10) {
            let frontStr = frontValue == 1 && !keepDecade ? "" : ChieseNumMap[frontValue];
            frontStr += "十"
            let num = value - frontValue * 10;
            if (num > 0)
                frontStr += getChinseNum(num);
            return frontStr
        }
        else {
            frontValue = Math.floor(value / 100);
            let str = ChieseNumMap[frontValue] + "百";
            let num = value - frontValue * 100;
            if (num > 0)
                str += getChinseNum(num, true);
            return str;
        }
    }

    export function autoResizeList(list: List, dataLen: number, isHorizontal = true, max?: number) {
        if (isHorizontal) {
            dataLen = Math.ceil(dataLen / (list.repeatY || 1))
            let width = Math.max(list.cellWidth * dataLen + (dataLen - 1) * list.spaceX, list.width);
            max != undefined && (width = Math.min(width, max));
            list.width = width;
        } else {
            dataLen = Math.ceil(dataLen / (list.repeatX || 1))
            let height = Math.max(list.cellHeight * dataLen + (dataLen - 1) * list.spaceY, list.height);
            max != undefined && (height = Math.min(height, max));
            list.height = height;
        }
    }

    /**权重随机*/
    export function randomWeight<T>(eles: T[], weightKey: string) {
        let sum = 0;
        eles.forEach(ele => sum += ele[weightKey]);
        let randValue = _.random(1, sum);
        let temp = 0;
        for (let i = 0; i < eles.length; i++) {
            let ele = eles[i];
            temp += ele[weightKey];
            if (randValue <= temp) return ele;
        }
        return null;
    }

    /**
     NET_NO = 0;
     NET_WIFI = 1;
     NET_2G = 2;
     NET_3G = 3;
     NET_4G = 4;
     NET_UNKNOWN=5
     */
    export function getNetworkType() {
        if (!Laya.Render.isConchApp) return NetworkType.NET_UNKNOWN;
        let conch = Laya.Browser.window["conch"];
        if (!conch) return NetworkType.NET_UNKNOWN;
        if (!conch.config) return NetworkType.NET_UNKNOWN;
        return conch.config.getNetworkType();
    }

    export const enum NetworkType {
        NET_NO = 0,
        NET_WIFI = 1,
        NET_2G = 2,
        NET_3G = 3,
        NET_4G = 4,
        NET_UNKNOWN = 5
    }

    var MAX = 31;
    /**二进制位存储 超位用第二个数字 */
    export function encodeBinary(values: number[]) {
        let temp: number[] = [];
        values.forEach(value => {
            let index = Math.floor(value / MAX);
            temp[index] = (1 << (value % MAX)) + (temp[index] || 0)
        })
        return temp;
    }

    export function decodeBinary(values: number[]) {
        let results: number[] = [];
        for (let i = 0, len = values.length; i < len; i++) {
            let base = MAX * i;
            let value = values[i];
            let index = 0;
            while (value > 0) {
                if ((value & 1) == 1) {
                    results.push(base + index);
                }
                index++;
                value = value >> 1;
            }
        }
        return results;
    }

    export function promisTweenFrom(target: any, props: any, duration: number): [TweenWrapper, Promise<any>] {
        let tween: TweenWrapper;
        let promise = new Promise((resolve: any, reject: any) => {
            tween = Laya.Tween.from(target, props, duration, null, Laya.Handler.create(null, () => {
                resolve();
            }))
        })

        return [tween, promise]
    }

    export function promisTweenTo(target: any, props: any, duration: number, ease: Function = null): [TweenWrapper, Promise<any>] {
        let tween: TweenWrapper;
        let promise = new Promise((resolve: any, reject: any) => {
            tween = Laya.Tween.to(target, props, duration, ease, Laya.Handler.create(null, () => {
                resolve();
            }))
        })
        return [tween, promise]
    }

    export function autoSizeMatchByRatio(origin: Laya.Sprite, target: Laya.Sprite = Laya.stage, ratio: number = 720 / 1280) {
        let w = target.width;
        let h = target.height;
        if (w / h < ratio) {
            origin.height = h;
            origin.width = h * ratio
        } else {
            origin.width = w;
            origin.height = w / ratio;
        }
    }

    export function autoScaleMatchByRatio(origin: Laya.Sprite, target: Laya.Sprite = Laya.stage, ratio: number = 720 / 1280) {
        let w = target.width, h = target.height;
        let _w = origin.width, _h = origin.height;
        if (w / h < ratio) {
            _h = h;
            _w = h * ratio
        } else {
            _w = w;
            _h = w / ratio;
        }
        origin.scale(_w / origin.width, _h / origin.height);
    }

    /** 数组乱序 */
    export function arrayShuffle(data: any[]): any[] {
        let v: any[] = [];
        while (data.length > 0) {
            if (Math.random() >= 0.5) {
                v.push(data.pop())
            } else {
                v.unshift(data.pop())
            }
        }
        return v;
    }

    export function formatPhone(phone: string) {
        return phone.slice(0,3) + "****" + phone.slice(7,11);
    }

}
