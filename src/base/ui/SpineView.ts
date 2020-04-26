namespace app.ui {

    import Skeleton = Laya.Skeleton;
    import Event = Laya.Event;

    export class SpineView extends Laya.Component {
        private static __options: any = { "isDebugEnabled": false };
        static debugLog(message?: any, ...optionalParams: any[]): void {
            (SpineView.__options["isDebugEnabled"])
                && (console.log(message, ...optionalParams));
        }

        public static LOADED: string = 'loaded';
        public static LOAD_ERROR: string = "load_error"

        private _source: string;
        private _aniName: string;
        private _aniRate: number = 1;
        private _loopCount: number = 0;
        private _autoPlay: boolean = true;

        private _factory: Laya.Templet;
        private _armature: Skeleton;
        private _cb: any;
        private _loaded: boolean = false;//是否已加载


        get loaded() {
            return this._loaded;
        }

        set source(value: string) {
            if (this._source == value)
                return;

            this._source = value;
            if (this._factory) {
                this.cleanData();
            }

            if (value.endsWith('.sk')) { //加载sk文件
                this._loaded = false;
                this._factory = new Laya.Templet();
                this._factory.once(Event.COMPLETE, this, this.parseComplete);
                this._factory.once(Event.ERROR, this, this.onError);

                this._factory.loadAni(value);
            }
            else { //如果不是sk文件，给出提示不加载
                //console.error('SpineView: animation must convert to sk file');
            }
        }

        get source(): string {
            return this._source ? this._source : "";
        }

        get aniName(): string {
            return this._aniName;
        }

        set aniName(value: string) {
            this._aniName = value;
            if (this._armature) this._armature.play(this._aniName || 0, true);
        }

        get aniRate(): number {
            return this._aniRate;
        }

        set aniRate(value: number) {
            this._aniRate = value;
        }

        get loopCount(): number {
            return this._loopCount;
        }

        set loopCount(value: number) {
            this._loopCount = value;
        }

        get autoPlay(): boolean {
            return this._autoPlay;
        }

        set autoPlay(value: boolean) {
            if (this._autoPlay == value) return;
            this._autoPlay = value;
            value && this._loaded && this.play();
        }

        get player() {
            return this._armature ? this._armature.player : null;
        }

        private onError(): void {
            this.event(ui.SpineView.LOAD_ERROR);
            //console.error("SpineView: Load animation error.");
        }

        private parseComplete(): void {
            //创建模式为0
            this._armature = this._factory.buildArmature(0);
            this._armature.x = 0;
            this._armature.y = 0;
            this.addChild(this._armature);
            this._autoPlay && this.play();
            this._loaded = true;
            this.event(ui.SpineView.LOADED);
        }

        onClose() {
            if (this._armature) {
                this._armature.stop();
                this._armature.destroy(true);
                this._armature = null;
            }
        }

        onStop() {
            if (this._cb) {
                this._cb();
            }
        }

        setStopFunction(cb?: () => void) {
            this._cb = cb;
        }

        play(aniName?: string, loopCount?: number, cb?: () => void): void {
            if (!this._armature) {
                return;
            }
            if (loopCount) this.loopCount = loopCount;
            if (cb) this._cb = cb;
            this._armature.once(Event.STOPPED, this, this.onStop);
            if (aniName) {
                this._armature.play(aniName, this.loopCount === 0);
                this._armature.playbackRate(this.aniRate);
            } else if (this.aniName) {
                this._armature.play(this.aniName, this.loopCount === 0);
                this._armature.playbackRate(this.aniRate);
            } else {
                this._armature.play(0, this.loopCount === 0);
                this._armature.playbackRate(this.aniRate);
            }
        }

        stop(): void {
            if (this._armature) this._armature.stop();
        }

        protected _getArmaturePromise(): Promise<Laya.Skeleton> {
            if (this.loaded) return Promise.resolve(this._armature);
            return new Promise((resolve: any, reject: any) => {
                this.once(ui.SpineView.LOADED, this, () => {
                    resolve(this._armature);
                });
            })
        }

        waitPlayCompleted() {
            return new Promise((resolve: any, reject: any) => {
                this._getArmaturePromise().then(skleton => {
                    skleton.player.once(Laya.Event.COMPLETE, this, resolve);
                })
            })
        }

        waitStoped() {
            return new Promise((resolve: any, reject: any) => {
                this._getArmaturePromise().then(skleton => {
                    skleton.once(Laya.Event.STOPPED, this, resolve);
                })
            })
        }

        // stopOnPlayCompleted() {
        //     this.waitPlayCompleted().then(() => {
        //         this._armature.index = this._armature.total;
        //         this._armature.stop();
        //     })
        // }

        cleanData() {
            this._source = "";
            if (this._armature) {
                this._armature.stop();
                this._armature.destroy(true);
                this._armature = null;
            }
            if (this._factory) {
                this._factory.offAll();
                this._factory.destroy();
                //this._factory.releaseResource(true);
                this._factory = null;
            }

        }

        destroy(destroyChild = true) {
            this.cleanData();
            super.destroy(destroyChild);
        }
    }
}
