namespace app.ui {

    export function getCompInfo(obj: any, compName: string) {
        if (compName.indexOf('.') >= 0) {
            var fields = compName.split('.')
            for (let i = 0; i < fields.length; i++) {
                obj = obj[fields[i]]
            }
            compName = fields[fields.length - 1];
        } else {
            obj = obj[compName];
        }
        compName = compName.replace(/[0-9]+$/, '');
        return { name: compName, comp: obj };
    }

    export class View extends Laya.View {
        static registerOpenKeyImpl: (openKey: string, comp: Laya.Component) => void;
        static VIEW_CREATED = "onViewCreated";
        static getViewClass(name: string) {//获取注册的类
            return this.viewClassMap[name];
        }
        // 可以直接为一个events数组，也可以指定dispatcher及其events
        protected _modelEvents: Interest[];
        private _viewCreated: boolean;  // 防止设置skin时重复调用createView
        private _assetCollector: AssetCollector;
        protected autoDestroyRes: boolean = true;

        constructor() {
            super();
            // 由于类成员的默认初始化总是在constructor之后，所以initialize函数调用时机可能会有问题
            // 这里重新引入onCreate来避免上述问题
            if (!(this instanceof Dialog)) {
                this.callLater(this.onCreate);
            }
            //在super.createView执行之后初始化，uiResMap中定义的资源不会重复addAsset
            if (this instanceof Dialog || this.isAutoManageRes()) {
                this.assetCollector = new AssetCollector(Object.getPrototypeOf(this).constructor.name);
            }
        }

        setViewData(data?: any) {

        }

        isAutoManageRes(): boolean {
            return false;
        }

        get assetCollector(): AssetCollector {
            return this._assetCollector;
        }

        set assetCollector(v: AssetCollector) {
            this._assetCollector = v;
        }

        protected onCreate() {
            this.registerModelEvents(true);
            this.registerOpenKeys();
            this.event(View.VIEW_CREATED);
        }

        waitCreated() {
            return new Promise((resolve: any, reject: any) => {
                this.once(View.VIEW_CREATED, this, resolve);
            })
        }

        createChildren() {
            super.createChildren();

            let ClassUI = Object.getPrototypeOf(this).constructor;
            ClassUI.uiView && this.createView(ClassUI);
            ClassUI.uiEvent && this.registerEvents(ClassUI);
        }

        protected createView(uiSkin: Skin) {
            if (this.destroyed) return;
            let uiView: any = uiSkin.uiView;
            if (typeof uiView == 'string') {
                uiView = uiSkin.uiView = JSON.parse(uiView);
            }
            super.createView(uiView || {});
            this._viewCreated = true;
        }

        set templateParam(value: string) {
            if (!value) return;
            let params = value.split(',');
            for (let i = 0; i < params.length; i++) {
                let keyValue = params[i].split('=');
                let nameProp = keyValue[0].split('.');
                let comp = this[nameProp[0]];
                if (comp) {
                    let num = _.toNumber(keyValue[1]);
                    comp[nameProp[1]] = num.toString() == keyValue[1] ? num : keyValue[1];
                }
            }
        }

        public getDialog(): Dialog {
            let parent = this.parent;
            while (parent != null) {
                if (parent instanceof Dialog)
                    return parent;
                parent = parent.parent;
            }
            return null;
        }

        set viewSkin(value: Skin | string) {
            if (typeof value == 'string') {
                let skin = getCompInfo(app, value).comp;
                this.setViewSkin(skin);
            } else {
                this.setViewSkin(value);
            }
        }

        // 用户换肤功能，必须在构造之后立即调用，以便onCreate触发时，界面已经初始化完成
        setViewSkin(skin: Skin) {
            if (skin && skin.uiView && !this._viewCreated) {
                this.createView(skin);
                this.registerEvents(skin);
                this.registerOpenKeys();
            }
        }

        loadP(url: any, type?: string, priority?: number, cache?: boolean, group?: string): Promise<void> {
            if (this._assetCollector)
                return this._assetCollector.loadP(url, type, priority, cache, group);

            let dlg = ui.getParentDialog(this);
            if (dlg)
                return dlg.loadP(url, type, priority, cache, group);
            else
                return Laya.loader.loadP(url, type, priority, null, cache, group);
        }

        protected registerModelEvents(isRegister: boolean) {
            if (!this._modelEvents || !this._modelEvents.length) return;
            this._modelEvents.forEach(interest => {
                if (isRegister) {
                    modelEventsDispatcher.on(interest.eventType, this, interest.handler)
                } else {
                    modelEventsDispatcher.off(interest.eventType, this, interest.handler)
                }
            })
        }

        protected registerEvents(uiSkin: Skin) {
            let eventsInfo: any = uiSkin.uiEvent || {};
            if (typeof eventsInfo == 'string') {
                eventsInfo = uiSkin.uiEvent = JSON.parse(eventsInfo);
            }
            for (let compName in eventsInfo) {
                let compInfo = getCompInfo(this, compName);
                let events = eventsInfo[compName];
                events.forEach((event: any) => this.registerEvent(compInfo, event));
            }
        }

        protected registerEvent(compInfo: { name: string, comp: any }, event: string) {
            let upCompName = compInfo.name.charAt(0).toUpperCase() + compInfo.name.slice(1);
            let comp = compInfo.comp;
            if (!comp) return;

            let method = (<any>this)["on" + upCompName + event.charAt(0).toUpperCase() + event.slice(1)];
            if (!method)
                return;
            if (event === "click") {
                comp.on(Laya.Event.CLICK, this, (e: Laya.Event) => {
                    let guid = comp["$_GID"] || (comp["$_GID"] = Laya.Utils.getGID());
                    if (ui.opCheckLimit && !ui.opCheckLimit(guid)) return;
                    if (comp.openKey && ui.checkModuleOpenByTargetImpl && !ui.checkModuleOpenByTargetImpl(comp.openKey, true, true)) return;
                    e.stopPropagation();
                    method.call(this, e);
                });
            } else if (event === "select") {
                comp.selectHandler = Laya.Handler.create(this, (index: number) => {
                    method.call(this, index);
                }, null, false);
            } else if (event === "cellClick") {
                comp.mouseHandler = Laya.Handler.create(this, (e: Laya.Event, index: number) => {
                    e.type === Laya.Event.CLICK && method.call(this, e, index);
                }, null, false);
            } else if (event === "cellChildClick") {
                comp.on(CellView.EVENT_CHILD_VIEW_CLICK, this, (e: Laya.Event, index: number, childVarName: string) => {
                    e.stopPropagation();
                    method.call(this, e, index, childVarName);
                });
            } else if (event === "render" && comp instanceof List) {
                comp.on(Laya.Event.RENDER, this, method);
            } else if (event === "inputChange" && comp instanceof TextInput) {
                comp.on(Laya.Event.FOCUS, this, () => {
                    let oldValue = (comp as TextInput).text;
                    comp.once(Laya.Event.BLUR, this, () => {
                        let newValue = (comp as TextInput).text;
                        if (newValue !== oldValue) {
                            method.call(this, oldValue, newValue);
                        }
                    });
                });
            } else if (event === "change") {
                comp.on(Laya.Event.CHANGE, this, method);
            } else if (event === "link") {
                comp.on(Laya.Event.LINK, this, method)
            }
        }

        protected registerOpenKeys() {
            let constructor = Object.getPrototypeOf(this).constructor;
            let uiOpen: { [compName: string]: string } = constructor.uiOpen;
            if (_.size(uiOpen) <= 0) return;
            for (let compName in uiOpen) {
                let compInfo = getCompInfo(this, compName);
                View.registerOpenKeyImpl && View.registerOpenKeyImpl(uiOpen[compName], compInfo.comp);
            }
        }

        destroy(destroyChild = true): void {
            this.registerModelEvents(false);
            this.clearTimer(this, this.onCreate);
            super.destroy(destroyChild);
            if (this.autoDestroyRes && this._assetCollector)
                this._assetCollector.destroy();
        }
    }
}


