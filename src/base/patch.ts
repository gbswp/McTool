/*
* js patch
*/
class TweenWrapper {
    tween: Laya.Tween;
    private _tweenComplete: Laya.Handler;
    constructor(tweenComplete?: Laya.Handler) {
        this._tweenComplete = tweenComplete;
    }

    onTweenComplete() {
        this._tweenComplete && this._tweenComplete.run();
        this.clear();
    }

    complete() {
        this.tween && this.tween.complete();
    }

    clear() {
        if (this.tween) {
            this.tween.clear();
            this.tween = null;
        }
        if (this._tweenComplete) {
            this._tweenComplete.clear();
            this._tweenComplete = null;
        }
    }
}
interface Object {
    keysO(o: Object): string[];
}

interface String {
    // shim
    startsWith(str: string, pos?: number): boolean;
    endsWith(str: string, pos?: number): boolean;
    splitNum(separator: string | RegExp, limit?: number): number[];

    // user customized
    format(...params: any[]): string;
    format(params: { [index: string]: string }): string;
}

interface Date {
    add(delta: string | number): Date;
    sub(date: Date, toSeconds?: boolean): number;
    trimTime(): Date;
}

interface Array<T> {
    remove(...items: T[]): void;
    pushOnce(...items: T[]): void;
}

interface DateConstructor {
    serverTime(value?: number): number;
    serverOpenTime(value?: number): number;
}

interface Math {
    range(value: number, min: number, max: number): number;
}

interface IBadgeStyle {
    x?: number,
    y?: number,
    anchorOffsetX?: number,
    anchorOffsetY?: number,
    source?: string,
    diffX?: number,
    diffY?: number,
    displayIndex?: number//显示层级 默认1 父级
}

// patch js object
(function () {
    let _proto: any;
    /* patch Object */
    _proto = Object.prototype;
    if (!_proto.keysT) {
        _proto.keysT = function (target: Object): string[] {
            let list = [];
            for (let key in target) {
                list.push(key);
            }
            return list;
        }
    }
});
(function () {
    let _proto: any;
    /* patch String Object */
    _proto = String.prototype;
    if (!_proto.format) {
        _proto.format = function () {
            let str = this.toString();
            let seq = 0;
            str = str.replace(/(%s|%d|%%)/g, (match: string) => {
                return match === '%%' ? '%' : `{${seq++}}`
            });
            if (!arguments.length)
                return str;
            let argType = typeof arguments[0];
            let args = (("string" == argType || "number" == argType) ? arguments : arguments[0]);
            for (let arg in args)
                str = str.replace(RegExp("\\{" + arg + "\\}", "gi"), args[arg]);
            return str;
        }
    }
    if (!_proto.endsWith) {
        _proto.endsWith = function (str: string, pos?: number) {
            if (pos === undefined || pos > this.length)
                pos = this.length;
            return this.substr(pos - str.length, pos) === str;
        }
    }

    if (!_proto.startsWith) {
        _proto.startsWith = function (str: string, pos?: number) {
            if (pos === undefined) pos = 0;
            return this.substr(pos, str.length) === str;
        }
    }
    if (!_proto.splitNum) {
        _proto.splitNum = function (separator: string | RegExp, limit?: number): number[] {
            let lst: string[] = this.split(separator, limit);
            var newLst: number[] = [];
            lst.forEach(element => {
                newLst.push(+element);
            })
            return newLst;
        }
    }

    /* patch Date */
    _proto = Date.prototype;

    // delta可以为毫秒值，也可以为类似'2d2H2M2s'(2天2小时2分2秒)的形式
    _proto.add = function (delta: string | number): Date {
        let date = new Date(this.getTime());
        if (typeof delta == 'number') {
            date.setTime(date.getTime() + delta);
        } else if (delta) {
            let isNegative = delta[0] === '-';
            let matches = delta.match(/\d+[ymdHMs]/g);
            if (matches && matches.length > 0) {
                let seconds = 0;
                matches.forEach(match => {
                    let len = match.length;
                    if (len == 0) return;
                    let num = +match.substr(0, match.length - 1) || 0;
                    if (isNegative) num = -num;
                    switch (match[len - 1]) {
                        case 'y': date.setFullYear(date.getFullYear() + num); break;
                        case 'm': date.setMonth(date.getMonth() + num); break;
                        case 'd': seconds += num * 24 * 3600; break;
                        case 'H': seconds += num * 3600; break;
                        case 'M': seconds += num * 60; break;
                        case 's': seconds += num; break;
                        default:
                        //console.error('not supported');
                    }
                })
                date.setTime(date.getTime() + seconds * 1000);
            }
        }
        return date;
    }

    _proto.sub = function (date: Date, toSeconds?: boolean): number {
        let diff = this.getTime() - date.getTime();
        return toSeconds ? (diff / 1e3 | 0) : diff;
    }

    _proto.trimTime = function (): Date {
        let date = new Date(this.getTime());
        date.setHours(0), date.setMinutes(0), date.setSeconds(0), date.setMilliseconds(0);
        return date;
    }

    Date.serverTime = (function () {
        let serverTimeDiff = 0;
        return function (value?: number): number {
            if (value != null) {
                serverTimeDiff = value - Date.now();
                return value;
            }
            return Date.now() + serverTimeDiff;
        }
    })();
    Date.serverOpenTime = (function () {
        let openTime = 0;
        return function (value?: number): number {
            if (value != null) {
                openTime = value;
                return value;
            }
            return openTime;
        }
    })();

    /* patch Date */
    _proto = Array.prototype;
    _proto.remove = function (...items: any[]) {
        items.forEach(item => {
            let index = this.indexOf(item);
            if (index != -1) {
                this.splice(index, 1);
            }
        })
    }
    _proto.pushOnce = function (...items: any[]) {
        items.forEach(item => {
            if (this.indexOf(item) == -1) this.push(item);
        })
    }
    /* patch Math */
    Math.range = (function () {
        return function (value: number, min: number, max: number) {
            let maxValue = Math.max(min, max);
            let minValue = Math.min(min, max);
            return Math.min(Math.max(value, minValue), maxValue)
        }
    })()

})();

// laya patch
(function () {
    ////////////////////////////////
    // 字体相关patch
    ////////////////////////////////
    let _proto: any;
    _proto = Laya.BitmapFont.prototype
    _proto.parseFont = function (this: any, data: any, tex: Laya.Texture): void {
        this._texture = tex;
        this.fontSize = parseInt(data.frames[0].h);
        for (var char in data.frames) {
            var frame = data.frames[char];
            this._maxWidth = Math.max(this._maxWidth, frame.sourceW);
            this._fontCharDic[char] = Laya.Texture.create(tex, frame.x, frame.y, frame.w, frame.h, frame.offX, frame.offY, frame.sourceW, frame.sourceH);
            this._fontWidthMap[char] = frame.sourceW;
        }
    }

    _proto.getCharWidth = function (this: any, char: string): number {
        if (this._fontWidthMap[char]) return this._fontWidthMap[char] + this.letterSpacing;
        if (char === ' ') return this._spaceWidth + this.letterSpacing;
        return 0;
    }

    _proto.getCharTexture = function (this: any, char: string): Laya.Texture {
        return this._fontCharDic[char];
    }

    let BitmapFont: any = Laya.BitmapFont;
    BitmapFont.__fontRes = {};
    BitmapFont.registerFontRes = function (font: string, res: string) {
        BitmapFont.__fontRes[font] = res;
    }

    _proto = Laya.Text.prototype;
    _proto.setFont = function (this: any, font: string) {
        if (this._bitmapFont && this._bitmapFont[font]) {
            this.font = font;
            return;
        }

        let resUrl = BitmapFont.__fontRes[font];
        if (!resUrl)
            return;
        Laya.loader.load(resUrl, Laya.Handler.create(this, () => this.font = font), null, Laya.Loader.FONT);
    }

    _proto = Laya.Label.prototype;
    _proto.setFont = function (this: any, font: string) {
        if (this._tf) {
            this._tf.setFont(font);
        }
    }

    ////////////////////////////////
    // Label增加format的支持
    ////////////////////////////////
    _proto = Laya.Label.prototype;
    Object.defineProperty(_proto, "format", {
        get: function (): string {
            return this._format;
        },
        set: function (value: string) {
            this._format = value;
            if (this._value) {
                this.text = value ? this._format.format(this._value) : this._value.toString();
                this.onCompResize();
                Laya.timer.callLater(this, this.changeSize);
            }
        },
        enumerable: false,
        configurable: false
    })
    Object.defineProperty(_proto, "value", {
        get: function (): string {
            return this._value;
        },
        set: function (value: string | any[]) {
            this._value = value;
            if (this._format) {
                this.text = this._format.format(typeof value === 'string' ? value.split(',') : (value || ""));
            } else {
                this.text = value ? value.toString() : "";
            }
            this.onCompResize();
            Laya.timer.callLater(this, this.changeSize);
        },
        enumerable: false,
        configurable: false
    })

    ////////////////////////////////
    // 修补HBox，VBox的排版问题
    ////////////////////////////////
    _proto = Laya.LayoutBox.prototype;
    _proto.changeSize = function () {
        this.event(Laya.Event.RESIZE);
        this.onCompResize();
    }

    ////////////////////////////////
    // HtmlDivElement的解析进行错误捕获
    ////////////////////////////////
    _proto = Laya.HTMLDivElement.prototype;
    _proto.appendHTML = function (text: string) {
        let style = this.style;
        if (!style.leading) style.leading = 8;
        try {
            Laya.HTMLParse.parse(this, text, this.URI);
        } catch (e) {
            Laya.HTMLParse.parse(this, '解析错误', this.URI);
            //console.warn(text + "解析错误");
        }
        this.layout();
    }

    ////////////////////////////////
    // Loader的Promise支持
    ////////////////////////////////
    _proto = Laya.LoaderManager.prototype;
    _proto.loadP = function (url: any, type: string = null, priority: number = 1, progress: Laya.Handler = null, cache: boolean = true, group: string = null, ignoreCache: boolean = false): Promise<any> {
        return new Promise((resolve: any, reject: any) => {
            this.load(url, Laya.Handler.create(this, (result: any) => {
                result ? resolve(result) : reject({ message: 'load error' });
            }), progress, type, priority, cache, group, ignoreCache);
        })
    }

    _proto = Laya.Loader.prototype;
    let endLoad = _proto.endLoad as Function;
    _proto.endLoad = function (content: any = null) {
        endLoad.call(this, content);
        this._http && (this._http._data = null);
    }


    Laya.View['getCompInstance'] = function (json: any) {
        let runtime = json.props ? json.props.runtime : null;
        let compClass;
        compClass = runtime ? (View['viewClassMap'][runtime] || View.uiClassMap[runtime] || Laya["__classmap"][runtime]) : View.uiClassMap[json.type];
        if (json.props && json.props.hasOwnProperty("renderType") && json.props["renderType"] == "instance") return compClass["instance"];
        if (compClass) {
            return new compClass();
        }
        if (runtime) {
            runtime = runtime.replace('app.', '');
            let temp = runtime.split('.');
            compClass = app;
            for (let i = 0; i < temp.length; ++i) {
                compClass = compClass[temp[i]];
                if (!compClass) {
                    break;
                }
            }
        }
        if (compClass) {
            View['viewClassMap'][runtime] = compClass;
        }
        return compClass ? new compClass() : null;
    }

    ////////////////////////////////
    // Component补丁，以及增加badge功能
    ////////////////////////////////
    _proto = Laya.Component.prototype;

    _proto._badgeEnable = true;
    let oldOnCompResize = _proto.onCompResize
    _proto.onCompResize = function (): void {
        oldOnCompResize.call(this);
        this.updateBadge();
    }

    _proto.resetLayoutX = function (): void {
        var parent: Laya.Sprite = this.parent as Laya.Sprite;
        if (parent) {
            var parentWidth = isNaN(parent.width) ? 0 : parent.width;
            var layout = this._layout;
            var scaleX = this.scaleX < 0 ? -this.scaleX : this.scaleX;
            var _width = isNaN(this.width) ? 0 : this.width;
            var displayWidth = _width * scaleX;
            if (!isNaN(layout.anchorX)) this.pivotX = layout.anchorX * _width;
            if (!this.layoutEnabled) return;
            var adjust = !isNaN(this.pivotX) ? this.pivotX * scaleX : 0;
            if (!isNaN(layout.centerX)) {
                this.x = (parentWidth - displayWidth) * 0.5 + layout.centerX + adjust;
            } else if (!isNaN(layout.left)) {
                this.x = layout.left + adjust;
                if (!isNaN(layout.right)) {
                    var num = (parent._width - layout.left - layout.right) / (scaleX || 0.01);
                    this.width = isNaN(num) ? 0 : num;
                }
            } else if (!isNaN(layout.right)) {
                this.x = parentWidth - displayWidth - layout.right + adjust;
            }
        }
    }

    _proto.resetLayoutY = function (): void {
        var parent: Laya.Sprite = this.parent as Laya.Sprite;
        if (parent) {
            var parentHeight = isNaN(parent.height) ? 0 : parent.height;
            var layout = this._layout;
            var scaleY = this.scaleY < 0 ? -this.scaleY : this.scaleY;
            var _height = isNaN(this.height) ? 0 : this.height;
            var displayHeight = _height * scaleY;
            if (!isNaN(layout.anchorY)) this.pivotY = layout.anchorY * _height;
            if (!this.layoutEnabled) return;
            var adjust = !isNaN(this.pivotY) ? Math.abs(this.pivotY * scaleY) : 0;
            if (!isNaN(layout.centerY)) {
                this.y = (parentHeight - displayHeight) * 0.5 + layout.centerY + adjust;
            } else if (!isNaN(layout.top)) {
                this.y = layout.top + adjust;
                if (!isNaN(layout.bottom)) {
                    var num = (parent._height - layout.top - layout.bottom) / (scaleY || 0.01);
                    this.height = isNaN(num) ? 0 : num;
                }
            } else if (!isNaN(layout.bottom)) {
                this.y = parentHeight - displayHeight - layout.bottom + adjust;
            }
        }
    }

    ////////////////////////////////
    // Timer
    ////////////////////////////////
    _proto = Laya.Timer.prototype;
    _proto._indexHandler = function (handler: any) {
        var caller = handler.caller;
        var method = handler.method;
        var cid = caller ? caller.$_GID || (caller.$_GID = Laya.Utils.getGID()) : 0;
        var mid = method.$_TID || (method.$_TID = this._mid++);
        handler.key = cid + "_" + mid;
        this._map[handler.key] = handler;
    }
    _proto._getHandler = function (caller: any, method: any) {
        var cid = caller ? caller.$_GID || (caller.$_GID = Laya.Utils.getGID()) : 0;
        var mid = method.$_TID || (method.$_TID = this._mid++);
        var key = cid + "_" + mid;
        return this._map[key];
    }

    ////////////////////////////////
    // Tween
    ////////////////////////////////
    _proto = Laya.Tween.prototype;
    _proto.to = function (target: any, props: Object, duration: number, ease: Function = null, complete: Laya.Handler = null, delay: number = 0, coverBefore: Boolean = false): TweenWrapper {
        let wrapper = new TweenWrapper(complete);
        if (target && !target.destroyed)
            wrapper.tween = this._create(target, props, duration, ease, Laya.Handler.create(wrapper, wrapper.onTweenComplete), delay, coverBefore, true, false, true);
        return wrapper;
    }

    _proto.from = function (target: any, props: Object, duration: number, ease: Function = null, complete: Laya.Handler = null, delay: number = 0, coverBefore: Boolean = false): TweenWrapper {
        let wrapper = new TweenWrapper(complete);
        if (target && !target.destroyed)
            wrapper.tween = this._create(target, props, duration, ease, Laya.Handler.create(wrapper, wrapper.onTweenComplete), delay, coverBefore, false, false, true);
        return wrapper;
    }

    _proto._remove = function () {
        let tweenMap = Laya.Tween["tweenMap"];
        var tweens: Laya.Tween[] = tweenMap[this._target.$_GID];
        if (tweens) {
            for (var i: number = 0, n: number = tweens.length; i < n; i++) {
                if (tweens[i] === this) {
                    tweens.splice(i, 1);
                    break;
                }
            }
        }
        if (!tweens || !tweens.length) {
            delete tweenMap[this._target.$_GID];
            // console.log("Remove Tween_" + this._target.$_GID)
        }
    }

    Laya.Tween.to = function (target: any, props: any, duration: number, ease: Function = null, complete: Laya.Handler = null, delay: number = 0, coverBefore: boolean = false, autoRecover: boolean = false): TweenWrapper {
        return new Laya.Tween().to(target, props, duration, ease, complete, delay, coverBefore);
    }

    Laya.Tween.from = function (target: any, props: any, duration: number, ease: Function = null, complete: Laya.Handler = null, delay: number = 0, coverBefore: boolean = false, autoRecover: boolean = false): TweenWrapper {
        return new Laya.Tween().from(target, props, duration, ease, complete, delay, coverBefore);
    }

    ////////////////////////////////
    // Laya.Loader
    ////////////////////////////////
    Laya.Loader.clearTextureResByGroup = function (group: string) {
        if (!Laya.Loader.groupMap[group]) return;
        var arr = Laya.Loader.groupMap[group], i = 0, len = arr.length;
        for (i = 0; i < len; i++) {
            Laya.Loader.clearTextureRes(arr[i]);
        }
        arr.length = 0;
    }

    ////////////////////////////////
    // Laya.LoaderManager
    ////////////////////////////////
    _proto = Laya.LoaderManager.prototype;
    _proto._next = function () {
        if (this._loaderCount >= this.maxLoader) return;
        for (var i = 0; i < this._maxPriority; i++) {
            var infos = this._resInfos[i];
            while (infos.length > 0) {
                if (i == 4 && this._loaderCount >= 1) {//如果是分包加载 并且当前加载资源数大于1个 则不加载。 确保游戏主线流畅度
                    // console.log("分包资源当前加载资源数"+this._loaderCount+" 直接return,确保流程度");
                    return;
                }
                var info = infos.shift();
                if (info) return this._doLoad(info);
            }
        }
        this._loaderCount || this.event(/*laya.events.Event.COMPLETE*/"complete");
    }

    ////////////////////////////////
    // button
    ////////////////////////////////
    _proto = Laya.Button.prototype;

    Object.defineProperty(_proto, "soundId", {
        get: function (): string {
            return this._soundId;
        },
        set: function (value: string) {
            value = _.trim(value, "$");
            if (this._soundId == value) return;
            this._soundId = value;
        },
        enumerable: false,
        configurable: false
    });

    Laya.Browser.onIPhoneX = false;
    // if (window && window.navigator.userAgent.indexOf('MiniGame') >= 0) {
    //     let info = wx.getSystemInfoSync();
    //     if (info && info.model == "iPhone X") {
    //         Laya.Browser.onIPhoneX = true;
    //     }
    // }

    ////////////////////////////////
    // timer
    ////////////////////////////////
    _proto = Laya.Timer.prototype;
    _proto._recoverHandler = function (handler: any) {
        if (this._map[handler.key] == handler) this._map[handler.key] = null;
        delete this._map[handler.key];
        handler.clear();
        Laya.Timer["_pool"].push(handler);
    }

    _proto.clear = function (caller: any, method: Function) {
        var handler: any = this._getHandler(caller, method);
        if (handler) {
            this._map[handler.key] = null;
            delete this._map[handler.key];
            handler.key = 0;
            handler.clear();
        }
    }

    _proto.clearAll = function (caller: any) {
        if (!caller) return;
        for (var i: number = 0, n: number = this._handlers.length; i < n; i++) {
            var handler: any = this._handlers[i];
            if (handler.caller === caller) {
                this._map[handler.key] = null;
                delete this._map[handler.key];
                handler.key = 0;
                handler.clear();
            }
        }
    }

    _proto.runCallLater = function (caller: any, method: Function) {
        var handler: any = this._getHandler(caller, method);
        if (handler && handler.method != null) {
            this._map[handler.key] = null;
            delete this._map[handler.key];
            handler.run(true);
        }
    }

    ////////////////////////////////
    //ScrollBar
    ////////////////////////////////
    _proto = Laya.ScrollBar.prototype;
    let oldOnTargetMouseDown = _proto.onTargetMouseDown;
    _proto.onTargetMouseDown = function (e: Laya.Event) {
        oldOnTargetMouseDown.call(this);
        if (this.afterTargetMouseDown) this.afterTargetMouseDown();
    }

    ////////////////////////////////
    //ScrollBar
    ////////////////////////////////
    /**
	*重置所有对象，复用对象的时候使用。
    */
    _proto = Laya.TimeLine.prototype;
    _proto.reset = function () {
        var p;
        if (this._labelDic) {
            for (p in this._labelDic) {
                delete this._labelDic[p];
            }
        };
        var tTween;
        for (p in this._tweenDic) {
            tTween = this._tweenDic[p];
            tTween.clear();
            delete this._tweenDic[p];
        }
        for (p in this._firstTweenDic) {
            delete this._firstTweenDic[p];
        }
        this._endTweenDataList = null;
        if (this._tweenDataList && this._tweenDataList.length) {
            var i = 0, len = 0;
            len = this._tweenDataList.length;
            for (i = 0; i < len; i++) {
                if (this._tweenDataList[i])
                    this._tweenDataList[i].destroy();
            }
            this._tweenDataList.length = 0;
        }

        this._currTime = 0;
        this._lastTime = 0;
        this._startTime = 0;
        this._index = 0;
        this._gidIndex = 0;
        this.scale = 1;
        Laya.timer.clear(this, this._update);
    }

    ////////////////////////////////
    //SoundManager
    ////////////////////////////////
    _proto = Laya.SoundManager;
    let $stageOnBlur = _proto._stageOnBlur;
    _proto._stageOnBlur = function () {
        $stageOnBlur.call(this);
        Laya.SoundManager["$stageOnBlur"] && Laya.SoundManager["$stageOnBlur"]();
    }

    let $stageOnFocus = _proto._stageOnFocus;
    _proto._stageOnFocus = function () {
        $stageOnFocus.call(this);
        Laya.SoundManager["$stageOnFocus"] && Laya.SoundManager["$stageOnFocus"]();
    }



})();
