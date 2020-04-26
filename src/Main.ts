class Main {
    constructor() {
        // Config.isAntialias = true;
        if ("undefined" != typeof VConsole) new VConsole();
        Laya.init(640, 1136, laya.webgl.WebGL);
        Laya.stage.scaleMode = Laya.Stage.SCALE_FIXED_AUTO;
        Laya.stage.screenMode = Laya.Stage.SCREEN_NONE;
        Laya.stage.alignH = Laya.Stage.ALIGN_MIDDLE;
        Laya.stage.alignV = Laya.Stage.ALIGN_CENTER;
        Laya.stage.frameRate = "fast";

        config.resBase = this.slashSuffix(config.resBase || "");
        config.resPath = this.slashSuffix(config.resPath || "laya");
        config.assetsPath = this.slashSuffix(config.assetsPath || `${config.resPath}assets`);
        Laya.URL.basePath = (config.resBase ? config.resBase : Laya.URL.basePath) + config.assetsPath;
        Laya.URL.rootPath = config.resBase ? config.resBase : Laya.URL.rootPath;
        app.urlParam.has("addr") && (config.addr = `ws://${app.urlParam.get("addr")}/ws`);
        if (app.urlParam.has("debugger")) debugger;

        Laya.stage.bgColor = "#ffffff";
        ui.registerComponents();

    }

    /** 斜杠结尾，但是空字符串不能加斜杠 **/
    private slashSuffix(str: string): string {
        return (str.length <= 0 || str.endsWith('/')) ? str : `${str}/`;
    }

    private loadViews(): Promise<void> {
        if (!app.ui.dynview)
            return Promise.resolve(void (0));
        let url = '~' + config.resPath + 'views.json';
        return Laya.loader.loadP(url).then((data: any) => {
            for (let name in data) {
                let fields = name.split('.');
                let obj = app[fields[0]];
                for (let i = 1; i < fields.length; i++) {
                    if (!obj) break;
                    obj = obj[fields[i]];
                }
                if (!obj) continue;
                let value: any = data[name];
                if (typeof value == 'string')
                    value = JSON.parse(data[name]);
                if (!value.uiView) {
                    obj.uiView = value;
                } else {
                    if (value.uiView) obj.uiView = value.uiView;
                    if (value.uiResMap) obj.uiResMap = value.uiResMap;
                    if (value.uiResRef) obj.uiResRef = value.uiResRef;
                    if (value.uiEvent) obj.uiEvent = value.uiEvent;
                    if (value.uiOpen) obj.uiOpen = value.uiOpen;
                }
            }

            Laya.Loader.clearRes(url)
        })
    }
}
var main = new Main();
