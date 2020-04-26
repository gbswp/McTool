/// <reference path="./base/patch.ts" />


declare var config: {
    host: string;
    addr: string;
    resBase?: string; // 资源路径的base，用于微信小游戏中指定http的base地址
    resPath?: string; // 资源对应的路径，开发版本与发行版本不一样
    assetsPath?: string; // laya/assets对应的路径，程序自动根据resPath设置，app.js中的设置将会忽略
    noVersionTag?: boolean;  // url后面不加version后缀，用于native发布
    env?: number;//运行环境模式 不填：开发模式模式   dev:开发模式，web:H5模式， wx:微信小游戏 ， bd:百度小游戏 vq:vivo 快游戏 tt:头条小游戏 oppo:oppo快游戏
    showStat?: boolean;
    localLogin?: boolean;
    autoLogin?: boolean;
    // 以下为测试相关参数
    testDlg?: string; // 用来进行快速测试的对话框
    testDlgParams?: any[]; // 测试对话框的参数
    checkModuleOpen: boolean; //是否检测功能开放
    isLogOut: boolean;//是否输出log
    isUseUrl: boolean;//是否可以使用seach  ps:百度和微信会报错
}

interface ReadonlyDict<T> {
    readonly [index: string]: T;
}
interface Dict<T> {
    [index: string]: T;
}

interface PromiseError {
    code: number;
    message: string;
    handled: boolean;
}

declare var ES6Promise: any;
if (window.navigator.userAgent.indexOf('MiniGame') < 0 && window.navigator.userAgent.indexOf('SwanGame') < 0 && window.navigator.userAgent.indexOf('QuickGame') < 0)
    ES6Promise.polyfill();

namespace app {
    export const Handler = Laya.Handler;
    export const Loader = Laya.Loader;
}

namespace app {

    export interface Interest {
        /**
         * 事件类型
         *
         * @type {string}
         * @memberof Interest
         */
        eventType: string;

        /**
         * 事件监听器
         *
         * @type {Function}
         * @memberof Interest
         */
        handler: Function;

        /**
         * 是否私有
         *
         * @type {boolean}
         * @memberof Interest
         */
        isPri: boolean;
    }

    /**
     *使用@d_interest 注入 添加关注
     *
     * @export
     * @param {string} eventType 事件类型
     * @param {boolean} [isPrivate]  是否私有
     * @returns
     */
    export function d_interest(eventType: string, isPrivate?: boolean) {
        const pKey = "_modelEvents";
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            let _interests: Interest[];
            if (target.hasOwnProperty(pKey)) {
                _interests = target[pKey];
            } else {
                //未赋值前，先取值，可取到父级数据，避免使用  Object.getPrototypeOf(target)，ES5没此方法
                const inherit: { [eventType: string]: Interest } = target[pKey];
                target[pKey] = _interests = [];
                if (inherit) {//继承父级可继承的关注列表
                    for (let k in inherit) {
                        let int = inherit[k];
                        if (!int.isPri) {
                            _interests[k] = int;
                        }
                    }
                }
            }
            _interests.push({ eventType: eventType, handler: descriptor.value, isPri: isPrivate });
        }
    }

}

