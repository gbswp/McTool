namespace app.ui {
    export class AniView extends Laya.Component {
        private _skin: string;
        private ani: Laya.Animation
        private _autoPlay: boolean = false;
        private _loopCount: number = 0;
        private _completedLoop: number = 0;     // 已经完成的循环数
        private _autoRemove: boolean = false;
        private _noAdjustSize: boolean = false; // 不调整宽高，以便锚点对齐，界面特效一般设为false，模型文件展示设为true

        private _baseScaleX: number = 1;
        private _baseScaleY: number = 1;

        private _aniScaleX: number = 1;
        private _aniScaleY: number = 1;

        private _initBaseScale = false;

        constructor(noAdjustSize = false) {
            super();
            this._noAdjustSize = noAdjustSize;
            let ani = this.ani = new Laya.Animation();
            this.addChild(this.ani);
        }

        get loopCount(): number {
            return this._loopCount;
        }

        set loopCount(value: number) {
            this._completedLoop = 0;
            this.ani.off(Laya.Event.COMPLETE, this, this.onLoopComplete);
            if (value > 0)
                this.ani.on(Laya.Event.COMPLETE, this, this.onLoopComplete);
            this._loopCount = value;
        }

        get autoRemove(): boolean {
            return this._autoRemove;
        }

        set autoRemove(value: boolean) {
            this._autoRemove = value;
        }

        get autoPlay(): boolean {
            return this._autoPlay;
        }

        set autoPlay(value: boolean) {
            if (this._autoPlay == value)
                return;
            this._autoPlay = value;
            this.ani.autoPlay = value;
            if (!value)
                this.ani.graphics = null;
        }

        get isPlaying(): boolean {
            return this.ani.isPlaying;
        }

        get skin() {
            return this._skin;
        }

        set skin(value: string) {
            if (this._skin == value)
                return;

            this._removeAsset(this._skin);
            this._skin = value;
            if (value == "") {
                return;
            }
            this._addAsset(value);

            Laya.loader.loadP(value, Laya.Loader.ATLAS, 2).then(() => {
                this.setAtlas(value);
            })
        }

        get miniAniScaleX() {
            return this._aniScaleX;
        }

        get miniAniScaleY() {
            return this._aniScaleY;
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

        private _addAsset(url: string) {
            if (!url) return;
            let assetCollector = AssetCollector.globalAsset;
            if (assetCollector) {
                assetCollector.addAsset(url);
            }
        }

        private _removeAsset(url: string) {
            if (!url) return;
            let assetCollector = AssetCollector.globalAsset;
            if (assetCollector) {
                assetCollector.decResourceRef(url);
            }
        }

        private setAtlas(value: any) {
            if (!this.destroyed) {
                let data = Laya.Loader.getRes(value);
                if (!data)
                    return;
                let aniScale = 1;
                for (let name in data.mc) {
                    let mcData = data.mc[name];
                    this.ani.interval = 1000 / mcData.frameRate;
                    if (mcData.scale) {
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

                if (!this._noAdjustSize)
                    this.adjustBoundSize(data);
                this.ani.frames = Laya.Animation.createFrames(value, '');
                if (!this.autoPlay)
                    this.ani.graphics = null;
                this.event(Laya.Event.LOADED);
            } else {
                //console.log("已经销毁");
            }
        }

        private adjustBoundSize(data: any) {
            let width = 0, height = 0;
            for (var name in data.res) {
                let res = data.res[name]
                width = Math.max(width, res.w);
                height = Math.max(height, res.h);
            }
            this.width = this.width || width;
            this.height = this.height || height;
            this.ani.x = this.width / 2;
            this.ani.y = this.height / 2;
        }
        /**
         *
         * @param start（可选）指定动画播放开始的索引(int)或帧标签(String)。帧标签可以通过addLabel(...)和removeLabel(...)进行添加和删除。
         */
        play(start?: any) {
            this.ani.play(start);
        }

        gotoAndStop(position: any) {
            this.ani.gotoAndStop(position);
        }

        stop() {
            this.ani.stop();
            this.ani.graphics = null;
        }

        clear() {
            let assetCollector = AssetCollector.globalAsset;
            if (assetCollector) assetCollector.decResourceRef(this._skin);
            this._skin = "";
            this.ani.clear();
        }

        onLoopComplete() {
            this._completedLoop++;
            if (this._loopCount > 0 && this._completedLoop >= this._loopCount) {
                Laya.timer.callLater(this, () => {
                    this.stop();
                    this.event(Laya.Event.COMPLETE);
                    if (this._autoRemove) {
                        this.removeSelf();
                    }

                })
            }
        }

        get animation(): Laya.Animation {
            return this.ani;
        }

        destroy(destroyChild = true) {
            this.scaleX = 1;
            this.scaleY = 1;
            this._aniScaleX = 1;
            this._aniScaleY = 1;
            this._baseScaleX = 1;
            this._baseScaleY = 1;
            this._initBaseScale = false;
            this.offAll();
            this.clear();
            super.destroy(destroyChild);
        }


    }
}
