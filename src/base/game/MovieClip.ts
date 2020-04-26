namespace app.game {
    export class MovieClip extends Laya.Sprite {
        static LOADED = "loaded";    // 加载成功的事件
        static COMPLETE = "complete"; // 播放完一个循环的事件
        static END = "end";          // 播放完总的循环次数的事件
        static SCENE_FRAME = 30;     // 全局针率
        private _clipSource: string; // 当前动画源文件，为文件的全路径去除扩展名
        private _clipName: string;   // 当前动画名称，用来区分一个文件中的多个动画组，不设置时默认第一组动画
        private _autoPlay = true;    // 是否启用自动播放
        private _autoRemove = false; // 是否播放完指定的循环次数后，立即从舞台移除
        private _isPlaying = false;  // 是否正在播放
        private _loopCount = 0;      // 播放次数，0代表循环播放
        private _loopTimes = 0;      // 已播放的循环数
        private _frameRate: number = 0;  // 播放帧率
        private _currentFrame = -1;  // 当前播放的帧序号
        private _totalFrames = 0;    // 总帧数
        private _frames: Frame[] = [];  // 帧数据
        private _resGroup: string; //资源分组定义用,方便与资源统一管理删除
        private _isLoading: boolean;  //是否加载资源中
        private _appDataScale: boolean; //默认应用json里的Scale值
        private _loopData: { [index: number]: { s: number, e: number, c: number } } = {};//循环帧

        private _baseScaleX: number = 1;
        private _baseScaleY: number = 1;

        private _aniScaleX: number = 1;
        private _aniScaleY: number = 1;

        private _initBaseScale = false;

        constructor() {
            super();
            this._appDataScale = true;
        }

        set appDataScale(isApp: boolean) {
            this._appDataScale = isApp;
        }

        get isLoading(): boolean {
            return this._isLoading;
        }

        get resGroup(): string {
            return this._resGroup;
        }

        set resGroup(group: string) {
            this._resGroup = group;
        }

        get clipSource(): string {
            return this._clipSource;
        }

        set clipSource(value: string) {
            if (this._clipSource == value) return;
            this._initBaseScale = false;
            this.setClipSource(value);
        }

        get clipName(): string {
            return this._clipName;
        }

        set clipName(value: string) {
            if (this._clipName == value)
                return;
            this._clipName = value;
        }

        get loopCount(): number {
            return this._loopCount
        }

        set loopCount(value: number) {
            this._loopTimes = 0;
            this._loopCount = value;
        }

        get autoPlay(): boolean {
            return this._autoPlay
        }

        set autoPlay(value: boolean) {
            this._autoPlay = value;
            if (value && !this._isPlaying)
                this.play();
        }

        get autoRemove(): boolean {
            return this._autoRemove;
        }

        set autoRemove(value: boolean) {
            this._autoRemove = value;
        }

        get isPlaying(): boolean {
            return this._isPlaying;
        }

        get currentFrame(): number {
            return this._currentFrame;
        }

        get totalFrames(): number {
            return this._totalFrames;
        }

        get frameRate(): number {
            return this._frameRate;
        }

        set frameRate(value: number) {
            if (this._frameRate != value) {
                this._frameRate = value;
                if (this._isPlaying && value > 0) {
                    this.clearTimer(this, this._frameLoop)
                    this._frameLoop();
                    this.timerLoop(1000 / this._frameRate, this, this._frameLoop);
                }
            }
        }

        set frames(value: Frame[]) {
            this._frames = value;
            if (value) {
                this._currentFrame = 0;
                this._loopTimes = 0;
                this._totalFrames = value.length;
            }
        }

        set scaleAniX(scale: number) {
            this._baseScaleX = scale;
            this.scaleX = this._aniScaleX * this._baseScaleX;
        }

        get scaleAniX() {
            return this._baseScaleX;
        }

        set scaleAniY(scale: number) {
            this._baseScaleY = scale;
            this.scaleY = this._aniScaleY * this._baseScaleY;
        }

        get scaleAniY() {
            return this._baseScaleY;
        }

        play() {
            if (this._isPlaying)
                return;
            this._isPlaying = true;
            if (this._frameRate > 0) {
                this.clearTimer(this, this._frameLoop);
                this._frameLoop();
                this.timerLoop(1000 / this._frameRate, this, this._frameLoop);
            }

        }

        stop(clearFrames?: boolean) {
            if (this._isPlaying) {
                this.clearTimer(this, this._frameLoop);
                this._isPlaying = false;
            }
            if (clearFrames) {
                this.clearFrames();
            }
        }

        // index从0开始计数
        gotoFrame(index: number) {
            if (this._totalFrames <= 0) return;

            if (index < 0) index = this._totalFrames - 1;
            else if (index >= this._totalFrames) index = 0;

            let frame = this._frames[this._currentFrame];
            if (frame) {
                if (!frame.completed) index = frame.start;
                else frame.curNum = 0;
            }

            this._currentFrame = index;

            if (this._frames) {
                frame = this._frames[this._currentFrame];
                frame && frame.curNum++;
                this.graphics = this._frames[this._currentFrame]
            }

            let complete = index === this._totalFrames - 1;
            if (complete) {
                this.event(MovieClip.COMPLETE);
                this._loopTimes++;
                if (this._loopCount == this._loopTimes) {
                    this.stop(true);
                    this._autoRemove && this.removeSelf();
                    this.event(MovieClip.END);
                }
            }
        }

        prevFrame() {
            this.gotoFrame(this._currentFrame - 1);
        }

        nextFrame() {
            this.gotoFrame(this._currentFrame + 1);
        }

        public clearAtlas() {
            if (this._clipSource && this._clipSource != "") {
                Laya.loader.clearRes(this.clipSource + '.json', true);
            }
        }

        public clearFrames() {
            this.graphics = null;
            this.clearFramePools();
            this._frames.length = 0;
            this._clipSource = '';
            this._clipName = '';
            this._currentFrame = -1;
            this._totalFrames = 0;
            this.rotation = 0;
            this.scaleX = 1;
            this.scaleY = 1;
            this._aniScaleX = 1;
            this._aniScaleY = 1;
            this._baseScaleX = 1;
            this._baseScaleY = 1;
        }

        private _frameLoop() {
            this.gotoFrame(this._currentFrame + 1);
        }

        // 直接设置mc的数据来源
        setClipSource(clipSource: string) {
            this._clipSource = clipSource;
            if (!clipSource) {
                this.stop(true);
                return;
            }
            let dataJson = clipSource.endsWith("json") ? clipSource : clipSource + "json";

            if (this.initFrameData(dataJson)) {
                this.event(MovieClip.LOADED, clipSource);
                return;
            }
            this._isLoading = true;
            Laya.loader.load(dataJson, Laya.Handler.create(this, onLoad), null, Laya.Loader.ATLAS, 1, true, this._resGroup);

            function onLoad(this: MovieClip) {
                if (this.destroyed) return;
                this._isLoading = false;
                if (this._clipSource === clipSource) {
                    this.initFrameData(dataJson);
                }
                this.event(MovieClip.LOADED, clipSource);
            }
        }

        private initFrameData(dataJson: string) {
            let data = Laya.Loader.getRes(dataJson);
            this._initLoopData(data);
            let frames = this.createFrames(dataJson);
            if (data && frames) {
                this.frames = frames
                for (let name in data.res) {
                    let mcData = data.res[name];
                    this.width = mcData.w;
                    this.height = mcData.h;
                    break;
                }
                let aniScale = 1;
                for (let name in data.mc) {
                    let mcData = data.mc[name];
                    this.frameRate = mcData.frameRate;
                    if (mcData.scale && this._appDataScale) {
                        aniScale = parseFloat(mcData.scale);
                    }
                    break;
                }
                this._aniScaleX = this._aniScaleY = aniScale;
                if (!this._initBaseScale) {
                    this._baseScaleX = this.scaleX;
                    this._baseScaleY = this.scaleY;
                    this._initBaseScale = true;
                }
                this.scaleAniX = this._baseScaleX;
                this.scaleAniY = this._baseScaleY;
                return true;
            }
            return false;
        }

        private _initLoopData(data: any) {
            if (!data || !data.meta || !data.meta.loops || !Array.isArray(data.meta.loops)) return;
            (data.meta.loops as Array<{ s: number, e: number, c: number }>).forEach(value => {
                this._loopData[value.e] = value;
            })
        }

        private createFrames(url: string): Frame[] {
            let atlas = Laya.Loader.getAtlas(url);
            let temp: Frame[] = [];
            this.clearFramePools();
            if (atlas && atlas.length) {
                for (let i = 0, n = atlas.length; i < n; i++) {
                    let g = this._createFrame(i);
                    let tex = Laya.Loader.getRes(atlas[i]);
                    if (tex)
                        g.drawTexture(tex, 0, 0);
                    temp.push(g);
                }
            }
            return temp
        }

        private _createFrame(index: number) {
            let g = Pool.get(Pool.Frame, Frame);
            let data = this._loopData[index];
            if (data) {
                g.start = data.s;
                g.end = data.e;
                g.count = data.c;
            }
            return g;
        }

        clearFramePools() {
            if (this._frames && this._frames.length > 0) {
                for (var index = 0; index < this._frames.length; index++) {
                    this._frames[index].clear(true);
                    // this._frames[index].destroy();
                    Pool.put(Pool.Frame, this._frames[index]);
                }
                this._frames.length = 0;
            }
        }

        reset() {
            this.scaleX = 1;
            this.scaleY = 1;
            this._aniScaleX = 1;
            this._aniScaleY = 1;
            this._baseScaleX = 1;
            this._baseScaleY = 1;
            this._initBaseScale = false;
            this.clearFrames();
            Laya.timer.clearAll(this);
            this.offAll();
        }

        destroy(destroyChild = true) {
            this.reset();
            super.destroy(destroyChild)
        }
    }
}
