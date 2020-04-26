/// <reference path="./View.ts" />
namespace app.ui {
    const dialogRejection = { message: '取消操作' };
    const noLoadingTime = 700;
    export class Dialog extends View {
        // private _adjustWidth: boolean;
        // private _adjustHeight: boolean;
        protected _autoResize: boolean;
        protected panelName: string;

        protected loadClose: () => void;
        protected preFuncList: Array<() => Promise<any>> = [];
        autoHideBackground: boolean = true; // 当全屏时，是否自动隐藏背后的界面
        showBgMask: boolean; // 是否显示一个背景的遮盖，以便界面没有完全显示时不至于显示后面的界面
        animating: boolean = true;
        extraResMap: any[] = [];//额外需要加载资源
        showLoad = true;
        moduleKey: number;//功能key Data.openTypeKey 枚举
        defaultSkin: Skin;//默认skin
        protected _tempUrls: string[];//open加载中资源列表
        soundOn = false;//声音开关

        enableAdapt = true;//界面适配开启
        adaptVisible = true;//显示适配条
        protected imgTop: Laya.Image;
        protected imgBottom: Laya.Image;
        protected _topSkin = "";//上适配资源
        protected _bottonSkin = "";//下适配资源

        get autoResize() {
            return this._autoResize;
        }

        onCompResize() {
            super.onCompResize();
            if (this.showBgMask) {
                this.graphics.clear();
                this.graphics.drawRect(0, 0, this.width, this.height, "#000000");
            }
            this.adapt();
        }

        /**
         * 适配
         * @protected
         * @memberof Dialog
         */
        protected adapt() {
            let needAdapt = ui.manager.needAdapt();
            if (!this._autoResize || !this.enableAdapt || !this.adaptVisible || !needAdapt) return
            //顶适配
            let imgTop = this.imgTop;
            if (!imgTop) {
                imgTop = this.imgTop = new Laya.Image();
                this.addChildAt(imgTop, 0)
            }
            imgTop.skin = this._topSkin || ui.adaptParam.topSkin;
            imgTop.top = -ui.adaptParam.top;
            imgTop.left = imgTop.right = 0;
            imgTop.height = ui.adaptParam.top;
            //底适配
            let imgBottom = this.imgBottom;
            if (!imgBottom) {
                imgBottom = this.imgBottom = new Laya.Image();
                this.addChildAt(imgBottom, 0)
            }
            imgBottom.skin = this._bottonSkin || ui.adaptParam.bottomSkin;
            imgBottom.bottom = -ui.adaptParam.bottom;
            imgBottom.left = imgBottom.right = 0;
            imgBottom.height = ui.adaptParam.bottom;
        }

        /**
         * 设置适配skin
         * @protected
         * @param {string} topSkin
         * @param {string} bottomSkin
         * @memberof Dialog
         */
        protected setAdaptSkin(topSkin: string, bottomSkin: string) {
            this._topSkin = topSkin;
            this._bottonSkin = bottomSkin;
            this.adapt();
        }

        wait(): Promise<DialogResultData> {
            return new Promise((resolve: any, reject: any) => {
                this.once(Laya.Event.CLOSE, this, (result: DialogResult, data: any) => {
                    resolve({ result: result, data: data });
                })
            })
        }

        close(result: DialogResult = DialogResult.No, data?: any) {
            ui.manager.close(this, result, data);
        }

        onBtnCloseClick(e: Laya.Event): void {
            this.close();
        }

        onBtnBackClick(e: Laya.Event): void {
            this.close();
        }

        onBtnHelpClick(e: Laya.Event): void {
            if (this.moduleKey != null) {
                ui.showHelp(this.moduleKey);
            }
        }

        animatingShow() {
            if (this.animating && !this._autoResize) {
                Laya.Tween.from(this, { alpha: 0, scaleX: 0.8, scaleY: 0.8 }, 200, Laya.Ease.backOut);
            }
        }

        //复写掉View方法 阻止createChildren时调用
        protected createView(uiSkin: Skin) {
        }
        //复写掉View方法 阻止createChildren时调用
        protected registerEvents(uiSkin: Skin) {
        }

        onCreate() {
            super.onCreate();
            this.on(Laya.Event.RESIZE, this, this.onCompResize);
            this.adapt();
        }

        checkOpen() {
            return !checkModuleOpenImpl || checkModuleOpenImpl(this.moduleKey, true);
        }

        open(skin?: Skin) {
            return new Promise((resolve: any, reject: any) => {
                this.showLoad && this.timerOnce(noLoadingTime, this, this.showLoading);
                !skin && (skin = this.defaultSkin);
                this.preFuncList.push(() => this.loadRes(skin));

                let temp: Promise<any>[] = [];
                this.preFuncList.forEach(func => temp.push(func()));
                Promise.all(temp).then(() => {
                    // setTimeout(() => {
                    this.removeLoading();
                    if (!this.destroyed) {
                        this.onLoadComplete(skin);
                        this.callLater(() => {
                            this.onCreate();
                            resolve();
                        })
                    } else {
                        reject(void 0);
                    }
                    // }, 3000);
                }).catch(error => {
                    this.removeLoading();
                    console.error(error);
                })
            })
        }

        protected addPreFunc(promise: () => Promise<any>) {
            this.preFuncList.pushOnce(promise);
        }

        private showLoading() {
            this.loadClose = ui.showLoading(ui.LOADING_TYPE.DIALOG);
            this.timerOnce(30000, this, this.openTimeOut);
        }

        private removeLoading() {
            this.clearTimer(this, this.openTimeOut)
            this.clearTimer(this, this.showLoading);
            // if (!this.showLoad) return;
            this.loadClose && this.loadClose();
            this.loadClose = null;
        }

        private openTimeOut() {
            this.removeLoading();
            // net.sendLoog(`ui:${this.name}打开界面超时`)
        }

        private loadRes(skin?: Skin): Promise<void> {
            return new Promise<void>((resolve: any, reject: any) => {
                let constructor = Object.getPrototypeOf(this).constructor;
                let uiResMap: any[] = constructor.uiResMap || [];
                let uiView = constructor.uiView;
                uiResMap = uiResMap.concat(this.extraResMap);
                if (!uiView && skin && skin.uiResMap) {
                    uiResMap = uiResMap.concat(skin.uiResMap);
                }
                if (uiResMap.length == 0) {
                    resolve();
                } else {
                    this._tempUrls = _.map(uiResMap, value => value.url);
                    this.loadP(uiResMap, null, 0).then(() => {
                        this._tempUrls = null;
                        resolve();
                    });
                }
            })
        }

        private onLoadComplete(skin: Skin) {
            let uiSkin: Skin = Object.getPrototypeOf(this).constructor;
            if (!uiSkin.uiView && skin) {
                uiSkin = skin;
            }
            uiSkin.uiView && super.createView(uiSkin);
            uiSkin.uiEvent && super.registerEvents(uiSkin);
            this.mouseEnabled = true;
            this._autoResize = this.width === UIConfig.designWidth && this.height === UIConfig.desighHeight;
            if (!this._autoResize) this.centerX = this.centerY = 0;
            else {
                let needAdapt = this.enableAdapt && ui.manager.needAdapt();
                this.top = needAdapt ? ui.adaptParam.top : 0;
                this.bottom = needAdapt ? ui.adaptParam.bottom : 0;
                this.left = this.right = 0;
            }
        }

        //清除加载
        cancelLoad() {
            !!this._tempUrls && Laya.loader.cancelLoadByUrls(this._tempUrls);
            this._tempUrls = null;
        }

        awaken(args: any[]) {
            this.registerModelEvents(true);
            this.registerOpenKeys();
        }

        sleep() {
            this.registerModelEvents(false);
        }

        destroy(destroyChild = true): void {
            this.cancelLoad();
            this.removeLoading();
            super.destroy(destroyChild);
        }
    }
}
