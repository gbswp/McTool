namespace app.ui {

    export class UIConfig {
        public static designWidth = 640;
        public static desighHeight = 1136;
        public static popupBgColor = '#000000';
        public static popupBgAlpha = 0.8;
        public static bgMaskColor = '#222222'; // 对话框背景的遮盖颜色，避免切换对话框时显示下面的对话框
    }

    export const enum DisplayLayer {
        MAIN,       //  主界面层
        POPUP,      //  弹出的模式对话框层
        LOADING,    //  加载动画层
        TOAST,      //  文字消息层
        SYSTEM,     //  系统消息层
        GUIDE,      //  新手引导层
    }
    export const enum LOADING_TYPE {
        DIALOG = 1,     // 界面
        SOCKET = 2,    // 通信
    }

    // 控制对话框出现的显示参数
    export interface ShowOptions {
        closeAllOther?: boolean; // 关闭本层的其他所有View
        closeCurrent?: boolean;  // 关闭当前的最顶层的View
        clearPopup?: boolean;    // 关闭popup层的所有View
        closeOnClick?: boolean;  // 是否点击空白区域即关闭，只用于popup
        showBgMask?: boolean;    // 是否显示对话框背景遮盖
        params?: any[];          // 构造函数的参数
        animating?: boolean;     // 是否显示界面打开的动画
        popupBgColor?: string;   // 弹出界面的背景颜色
        popupBgAlpha?: number;   // 弹出界面的背景alpha
        popupNoMask?: boolean;   // 弹出界面不需要背景，不阻挡鼠标
        container?: Laya.Component; // 是否显示在指定的容器中
        isPool?: boolean;            //是否有缓存池子
        skin?: Skin;
        modalize?: boolean            // 是否屏蔽鼠标事件
        zorder?: number            //层级处理
    }

    export interface RemoveOptions {
        until?: Laya.Component;   // 从顶层遍历直到until指定的view停止
        exclude?: Laya.Component; // 排除exclude指定的view
        onlyOne?: boolean;             // 只清除顶层
    }

    export interface Skin {
        uiResMap: any;
        uiResRef: any;
        uiView: any;
        uiEvent: any;
    }

    interface DialogConstructor<T> {
        new(...params: any[]): T
    };

    export const enum MessageButton {
        Yes = 1,
        No = 2,
        YesNo = 3
    }

    export const enum DialogResult {
        None = 0,//无结果
        No = 1,
        Yes = 2,
        Skip = 3,
    }

    export interface DialogResultData {
        result: DialogResult;
        data: any;
    }
    export interface BtnOption {
        label?: string;
        image?: string;
        skin?: string;
    }

    export interface MessageBoxOption {
        buttons?: MessageButton,
        skin?: Skin,
        title?: string,
        buttonSkins?: BtnOption[],
        hideClose?: boolean,
        titleTxt?: string,
    }

    export interface ToastTimerQueue {
        add(text: any, cb: (text: any) => void): void;
        clear(): void;
    }

    export interface LabelStyle {
        fontSize?: number;
        color?: number;
        stroke?: number;
        strokeColor?: number;
        align?: string;
        [index: string]: any;
    }

    export interface LayoutStyle {
        verticalLayout?: number;//垂直布局差
        verticalLayoutDiff?: number;
        horizontalLayout?: number;//水平布局差
        horizontalLayoutDiff?: number;
    }

    export interface ImageStyle {
        left?: number;
        right?: number,
        top?: number,
        bottom?: number,
        sizeGrid?: string,
        skin?: string
        [index: string]: any;
    }

    export interface ToastOption {
        labelStyle?: LabelStyle;
        layer?: DisplayLayer;
        backgroundImageStyle?: ImageStyle; // 背景图片
        queue?: ToastTimerQueue; // 是否需要队列延迟
        animator?: (obj: Laya.Component, finishCb: () => void) => void; // 显示动画回调，动画结束再回传
        layout?: LayoutStyle;
        container?: Laya.Component; // 是否显示在指定的容器中
    }

    interface PopupMaskOptions {
        closeOnClick?: boolean;
        bgColor?: string;
        bgAlpha?: number;
        noMask?: boolean;   // 不需要背景，不阻挡鼠标事件
        modalize?: boolean; // 是否模态化
    }

    export interface LoadingCloser {
        (): void;
    }

    const emptyObject = {};
    const defaultMsgBoxOption = { buttons: MessageButton.Yes };
    const VIEW_AUTO_HIDDEN_KEY = "__auto_hidden__"; // 用于自动隐藏全屏界面下面的界面，目前只处理覆盖的最顶层的一个界面

    /**
     * 管理一组界面，对应DialogManager中的一个Layer
    */
    class ViewContainer extends Laya.View {
        private _layer: DisplayLayer;

        constructor(layer: DisplayLayer) {
            super();
            this._layer = layer;
        }

        get layer(): DisplayLayer {
            return this._layer;
        }
    }

    /**
     * 模式弹出框如果需要使用半透明背景，则使用本容器
     * 每个PopupMaskContainer实例只容纳一个对话框
     */
    export class PopupMaskContainer extends Laya.View {
        private bgColor: string;
        private bgAlpha: number;
        private noMask: boolean;
        private _view: Laya.Component;
        private _bgSprite: Laya.Sprite;

        constructor(opt: PopupMaskOptions = emptyObject) {
            super();
            this.bgColor = opt.bgColor != undefined ? opt.bgColor : UIConfig.popupBgColor;
            this.bgAlpha = opt.bgAlpha != undefined ? opt.bgAlpha : UIConfig.popupBgAlpha; // 防止opt.bgAlpha设置为0
            this.noMask = !!opt.noMask;
            this.mouseEnabled = opt.modalize == null ? true : opt.modalize; // 隔离鼠标事件
            this.mouseThrough = this.noMask;//无遮罩时鼠标事件可穿透
            let closeOnClick = opt.closeOnClick;

            this.left = this.right = this.top = this.bottom = 0;
            this.onCompResize();
            if (!this._bgSprite) return;
            this._bgSprite.on(Laya.Event.CLICK, this, (e: Laya.Event) => {
                e.stopPropagation();
                if (closeOnClick && this.numChildren > 0) {
                    let index = this._bgSprite ? 1 : 0;
                    let component = this.getChildAt(index) as Laya.Component;
                    if (component instanceof Dialog) {
                        component.close();
                    } else {
                        manager.close(component);
                    }
                    // playContinueSound();
                }
            });

        }

        protected onCompResize() {
            super.onCompResize();
            if (this.noMask) return;
            let sp = this._bgSprite;
            if (!sp) {
                sp = this._bgSprite = new Laya.Sprite();
                sp.mouseEnabled = true;
                this.addChild(sp);
            }
            sp.graphics.clear();
            sp.alpha = this.bgAlpha;
            sp.graphics.drawRect(0, 0, Laya.stage.width, Laya.stage.height, this.bgColor);
            this._bgSprite.size(Laya.stage.width, Laya.stage.height);
        }

        set view(value: Laya.Component) {
            this._view = value;
            this.addChild(value);
        }

        get view(): Laya.Component {
            return this._view;
        }
    }

    /**
     * 管理游戏中的所有界面，并按层来确定最主要的几个显示层级关系
     * 所有窗口界面的打开和关闭都必须通过DialogManger的show和close来进行，以便集中管理
     */
    class DialogManager {

        private _mainLayer: ViewContainer;              // 主界面层
        private _popupLayer: ViewContainer;             // 弹出的模式对话框层
        private _toastLayer: ViewContainer;             // 文字消息层
        private _loadingLayer: ViewContainer;           // 加载动画层
        private _systemLayer: ViewContainer;            // 系统消息层
        private _guideLayer: ViewContainer;            // 系统消息层
        private _layers: ViewContainer[];
        private _chain: Array<string> = [];

        get chain(): Array<string> {
            return this._chain;
        }

        init() {
            this._mainLayer = new ViewContainer(DisplayLayer.MAIN);
            this._popupLayer = new ViewContainer(DisplayLayer.POPUP);
            this._toastLayer = new ViewContainer(DisplayLayer.TOAST);
            this._loadingLayer = new ViewContainer(DisplayLayer.LOADING);
            this._systemLayer = new ViewContainer(DisplayLayer.SYSTEM);
            this._guideLayer = new ViewContainer(DisplayLayer.GUIDE);
            this._layers = [this._mainLayer, this._popupLayer, this._toastLayer, this._loadingLayer, this._systemLayer, this._guideLayer];
            this._layers.forEach(layer => layer.mouseThrough = true);

            let stage = Laya.stage;
            stage.addChild(this._mainLayer);
            stage.addChild(this._popupLayer);
            stage.addChild(this._toastLayer);
            stage.addChild(this._loadingLayer);
            stage.addChild(this._systemLayer);
            stage.addChild(this._guideLayer);

            Laya.stage.on(Laya.Event.RESIZE, this, this.onStageResize);
            this.onStageResize();
        }

        private onStageResize() {
            Laya.Browser.onIPhoneX = !Laya.Render.isConchApp && (Laya.stage._height / Laya.stage._width > 2);
            this._layers.forEach(layer => {
                layer.left = layer.right = 0;
                layer.top = 0;
                layer.bottom = 0;
            });
        }

        needAdapt() {
            return Laya.Browser.onIPhoneX && adaptParam;
        }

        private addToContainer(view: Laya.Component, container: Laya.Component, opt: ShowOptions) {
            opt.clearPopup && this.removeAll(this._popupLayer);
            opt.closeCurrent && this.removeAll(container, { onlyOne: opt.closeCurrent });
            opt.closeAllOther && this.removeAll(container, {});

            container.addChild(view); // 必需先addChild，否则view的宽高获取不到

            let num = container.numChildren;
            if (!isNaN(opt.zorder) && opt.zorder < container.numChildren - 1) {
                container.setChildIndex(view, opt.zorder);
                view = container.getChildAt(num - 1) as Laya.Component;
            }

            if (isViewHideBackground(view)) {
                this.enumChildren(container, (v: Laya.Component, index: number) => {
                    if (v.destroyed) return false;
                    if (v === view) // 排除刚加入的
                        return false;
                    if (v[VIEW_AUTO_HIDDEN_KEY])
                        return true;
                    v[VIEW_AUTO_HIDDEN_KEY] = true;
                    v.visible = false;
                    return false;
                })
            }
        }

        private removeFromContainer(view: Laya.Component) {
            let container = view.parent;
            if (container instanceof PopupMaskContainer && container.view == view) {
                // container.removeChildren();
                view = container;
                container = container.parent;
            }
            view && view.removeSelf();
            this.enumChildren(container as any, (v: any, index: number) => {
                if (v[VIEW_AUTO_HIDDEN_KEY]) {
                    v.visible = true;
                    v[VIEW_AUTO_HIDDEN_KEY] = false;
                }
                return isViewHideBackground(v) // 如果是全屏的视图，则结束遍历
            })
        }

        show(view: Laya.Component, layer: DisplayLayer, opt: ShowOptions = emptyObject) {
            let container = opt.container || this._layers[layer];
            if (!container || container.destroyed || view.destroyed) return;
            let maskContainer: PopupMaskContainer;
            if (opt.closeOnClick || layer == DisplayLayer.POPUP || layer == DisplayLayer.SYSTEM || layer == DisplayLayer.LOADING) {
                maskContainer = new PopupMaskContainer({
                    closeOnClick: opt.closeOnClick,
                    bgColor: opt.popupBgColor,
                    bgAlpha: layer != DisplayLayer.LOADING ? opt.popupBgAlpha : 0,
                    noMask: opt.popupNoMask,
                    modalize: opt.modalize
                });
            }
            if (maskContainer) {
                maskContainer.view = view;
                this.addToContainer(maskContainer, container, opt);
            } else {
                this.addToContainer(view, container, opt);
            }
        }

        close(view: Laya.Component, result: DialogResult = DialogResult.No, data?: any) {
            if (!view || view.destroyed) return;
            this.removeFromContainer(view);

            if (view instanceof Dialog) {
                let pos = this._chain.indexOf(Object.getPrototypeOf(view).constructor.name);
                if (pos > -1)
                    this._chain.splice(pos, 1);
                view.event(Laya.Event.CLOSE, data === void (0) ? result : [result, data]);
            }
            Laya.SoundManager.playSound('music.d/close_ui.mp3');
            view.destroy(true);
        }

        removeAll(container: Laya.Component, opt: RemoveOptions = emptyObject) {
            this.enumChildren(container, (view, index): boolean => {
                if (view === opt.until)
                    return true;
                if (view !== opt.exclude)
                    this.close(view, DialogResult.None);
                if (opt.onlyOne)
                    return true;
                return false;
            })
        }

        filterChildren(container: Laya.Component, cb: (view: Laya.Component, index: number) => boolean) {
            let arr: Laya.Component[] = [];
            this.enumChildren(container, (view, index): boolean => {
                if (cb(view, index))
                    arr.push(view);
                return false;
            })
            return arr;
        }

        enumChildren(container: Laya.Component, cb: (view: Laya.Component, index: number) => boolean) {
            if (!container) return;
            let count = container.numChildren;
            for (let i = count - 1; i >= 0; i--) {
                let view = container.getChildAt(i);
                if (view instanceof PopupMaskContainer)
                    view = (view as PopupMaskContainer).view;
                if (cb(view as Laya.Component, count - 1 - i))
                    return;
            }
        }

        getViewContainer(view: Laya.Component): ViewContainer {
            for (let container = view.parent; container != null; container = container.parent) {
                if (container instanceof ViewContainer)
                    return container;
            }
            return null;
        }

        getDisplayLayer(view: Laya.Component): DisplayLayer {
            let container = this.getViewContainer(view);
            if (container)
                return container.layer;
            return void (0);
        }

        getLayer(layer: DisplayLayer) {
            return this._layers[layer];
        }
    }

    export function isViewHideBackground(view: Laya.Component): boolean {
        if (!(view instanceof ui.Dialog))
            return false;
        let parent = view.parent;
        if (!parent) return false;
        if (!(parent instanceof ViewContainer)) return false;
        let dlg = (view as any) as ui.Dialog;
        let stage = dlg.stage;
        if (!stage) return false;
        return !dlg.destroyed && (dlg.autoHideBackground && dlg.autoResize) && (isNaN(dlg.alpha) || dlg.alpha == 1);
    }

    function internalShowDialog<T extends Dialog>(c: { new(...params: any[]): T }, layer: DisplayLayer, opt: ShowOptions): Promise<T> {
        let dlg = new c(...opt.params);
        if (!dlg.checkOpen()) return Promise.reject({ code: -1, message: "功能不可开启" });
        showViewEventImpl && showViewEventImpl(dlg.moduleKey);
        //根据预先统计的资源计数，在assetCollector中进行标记
        var uiResRef: any[] = c.prototype.constructor.uiResRef;
        if (typeof uiResRef == 'string')
            uiResRef = c.prototype.constructor.uiResRef = JSON.parse(uiResRef);
        if (dlg.assetCollector)
            dlg.assetCollector.init(uiResRef);
        if (dlg instanceof ui.Dialog) {
            manager.chain.push(c.prototype.constructor.name);
        }
        dlg.showBgMask = opt.showBgMask;
        opt.animating != undefined && (dlg.animating = opt.animating);

        return dlg.open(opt.skin).then(() => {
            manager.show(dlg, layer, opt);
            dlg.animatingShow();

            return dlg;
        })
    }

    export interface IAdaptParam {
        top: number;
        bottom: number;
        topSkin: string;
        bottomSkin: string;
    }


    export interface InitParam {
        helpDlgImpl?: { new(helpId: number | string): Dialog };
        messageBoxImpl?: { new(...parmas: any[]): Dialog };
        loadingImpl?: { new(...params: any[]): View };
        toastImpl?: { new(...params: any[]): Laya.Component & { text: string } };
        showMsgImpl?: (msgId: number, ...args: any[]) => void;
        inputBoxImpl?: { new(...parmas: any[]): Dialog };
        checkModuleOpenImpl?: (openKey: number, showTip?: boolean) => boolean;
        showViewEventImpl?: (openKey: number) => void;
        registerGuideImpl?: (btnID: number, comp: Laya.Component) => void;
        registerOpenKeyImpl?: (openKey: string, comp: Laya.Component) => void;
        opCheckLimit?: (key: string | number, time?: number, showTip?: boolean) => boolean;
        modelEventsDispatcher: Laya.EventDispatcher;
        adaptParam?: IAdaptParam;
    }

    let helpDlgImpl: { new(helpId: number | string): Dialog };
    let messageBoxImpl: { new(...parmas: any[]): Dialog };
    let inputBoxImpl: { new(...parmas: any[]): Dialog };
    let loadingImpl: { new(...params: any[]): View };
    let toastImpl: { new(...params: any[]): Laya.Component & { text: string } };
    let showMsgImpl: (msgId: number, ...args: any[]) => void;
    export let adaptParam: IAdaptParam;//适配参数
    export let checkModuleOpenImpl: (openKey: number, showTip?: boolean, playSound?: boolean) => boolean;
    export let checkModuleOpenByTargetImpl: (targetKey: string, showTip?: boolean, playSound?: boolean) => boolean;
    export let showViewEventImpl: (openKey: number) => void;
    export let opCheckLimit: (key: string | number, time?: number, showTip?: boolean) => boolean;
    export let modelEventsDispatcher: Laya.EventDispatcher;
    export let playContinueSound: () => void;
    export let playButtonSound: (soundKey?: string) => void;


    export function init(param: InitParam) {
        if (param.helpDlgImpl) helpDlgImpl = param.helpDlgImpl;
        if (param.messageBoxImpl) messageBoxImpl = param.messageBoxImpl;
        if (param.inputBoxImpl) inputBoxImpl = param.inputBoxImpl;
        if (param.loadingImpl) loadingImpl = param.loadingImpl;
        if (param.toastImpl) toastImpl = param.toastImpl;
        if (param.showMsgImpl) showMsgImpl = param.showMsgImpl;
        if (param.checkModuleOpenImpl) checkModuleOpenImpl = param.checkModuleOpenImpl;
        if (param.showViewEventImpl) showViewEventImpl = param.showViewEventImpl;
        if (param.opCheckLimit) opCheckLimit = param.opCheckLimit;
        if (param.modelEventsDispatcher) modelEventsDispatcher = param.modelEventsDispatcher;
        // if (param.adaptParam) adaptParam = param.adaptParam;
        manager.init();
    }

    export function isParentComp(comp: Laya.Component, parentComp: Laya.Node): boolean {
        if (comp == parentComp) return true;
        let parent = comp.parent;
        while (parent instanceof Laya.Component) {
            if (parent == parentComp) return true;
            parent = parent.parent;
        }
        return false;
    }

    export function getParentDialog(view: Laya.Component): ui.Dialog {
        if (view instanceof ui.Dialog)
            return view;

        let parent = view.parent;
        while (parent != null) {
            if (parent instanceof ui.Dialog)
                return parent;
            parent = parent.parent;
        }
        return null;
    }

    export function getTopDialog(layer: DisplayLayer = DisplayLayer.MAIN): Dialog {
        let container = manager.getLayer(layer);
        let dlg: Dialog;
        manager.enumChildren(container, (view, index) => {
            dlg = view instanceof Dialog ? view : null;
            return dlg != null;
        });
        return dlg;
    }

    export function show<T extends Dialog>(c: DialogConstructor<T>, opt: ShowOptions = emptyObject): Promise<T> {
        return internalShowDialog(c, DisplayLayer.MAIN, opt);
    }

    export function popup<T extends Dialog>(c: DialogConstructor<T>, opt: ShowOptions = emptyObject): Promise<T> {
        return internalShowDialog(c, DisplayLayer.POPUP, opt);
    }

    export function load<T extends Dialog>(c: DialogConstructor<T>, opt: ShowOptions = emptyObject): Promise<T> {
        return internalShowDialog(c, DisplayLayer.LOADING, opt);
    }


    export var msgBoxLimit: { [index: string]: boolean } = {};
    export function msgBox(msg: string, opt?: MessageBoxOption, key?: string): Promise<DialogResultData> {
        if (!messageBoxImpl) throw "messageBoxImpl is not set in ui.init";
        opt = opt || defaultMsgBoxOption
        if (!!msgBoxLimit[key]) return Promise.resolve({ result: DialogResult.Yes, data: null });
        return internalShowDialog(messageBoxImpl, DisplayLayer.SYSTEM, { params: [msg, opt, key], skin: opt.skin }).then(dlg => {
            return dlg.wait();
        });
    }

    export function inputBox(msg: string, opt?: MessageBoxOption): Promise<DialogResultData> {
        if (!inputBoxImpl) throw "inputBoxImpl is not set in ui.init";
        return internalShowDialog(inputBoxImpl, DisplayLayer.POPUP, { params: [msg, opt] }).then(dlg => {
            return dlg.wait();
        });
    }

    export function showMsg(msgId: number, ...args: any[]) {
        if (!showMsgImpl) throw "showMsgImpl is not set in ui.init";
        showMsgImpl(msgId, args);
    }

    export function toast(msg: string, opt: ToastOption = emptyObject) {
        if (opt.queue) { // 需要启用延迟队列
            opt.queue.add(msg, () => displayMsg(msg));
        } else {
            displayMsg(msg);
        }

        function displayMsg(text: string) {
            let view = Toast.create(opt.labelStyle || emptyObject, opt.backgroundImageStyle || emptyObject, text, opt.layout);
            manager.show(view, opt.layer || DisplayLayer.TOAST, { container: opt.container })
            if (opt.animator) {
                opt.animator(view, () => manager.close(view));
            } else {
                setTimeout(() => manager.close(view), 3000);
            }
        }
    }

    var loadingNum = 0;
    var loadingView: View;
    export function showLoading(fromType: number = LOADING_TYPE.SOCKET): LoadingCloser {
        if (!loadingImpl) throw "loadingImpl is not set in ui.init";
        loadingNum++;
        doShowLoading(fromType);
        return () => {
            loadingNum = Math.max(loadingNum - 1, 0);
            doShowLoading(fromType);
        }
    }

    function doShowLoading(fromType: number = LOADING_TYPE.SOCKET) {
        if (loadingNum > 0) {
            if (!loadingView) {
                loadingView = new loadingImpl(fromType);
                let bgAlpha = fromType == LOADING_TYPE.SOCKET ? 0 : .4;
                manager.show(loadingView, DisplayLayer.LOADING, { popupBgAlpha: bgAlpha });//,popupBgColor: "#0d2134", popupBgAlpha: 0.4
            }
        } else {
            manager.close(loadingView);
            loadingView = null;
        }
    }



    export function forceRemoveLoading() {
        loadingNum = 0;
        doShowLoading();
    }

    export function showHelp(helpId: number | string) {
        popup(helpDlgImpl, { params: [helpId], closeOnClick: true });
    }

    export function showSystem<T extends Dialog>(c: DialogConstructor<T>, opt: ShowOptions = emptyObject): Promise<T> {
        return internalShowDialog(c, DisplayLayer.SYSTEM, opt);
    }

    export let manager = new DialogManager();
}
let ui = app.ui;
