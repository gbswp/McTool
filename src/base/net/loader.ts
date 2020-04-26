namespace app {
    export class ResType {
        public static TEXT = "text";
        public static JSON = "json";
        public static XML = "xml";
        public static BUFFER = "arraybuffer";
        public static IMAGE = "image";
        public static SOUND = "sound";
        public static ATLAS = "atlas";
        public static FONT = "font";
        public static SHEET = "st";      // sheet
        public static MC = "mc";         // movieclip
        public static PKM = "pkm";
        public static TTF = "ttf";
    }

    const WXLOCAL = 'wxlocal'; // 微信小游戏中本地初始包资源的根目录

    function formatURL(url: string, base?: string) {
        if (!url) return "null path";
        if (url.startsWith(WXLOCAL)) return url;
        if (url.indexOf(":") > 0) return url;
        if (Laya.URL.customFormat != null) url = Laya.URL.customFormat(url, base);

        let char1 = url.charAt(0);
        if (char1 === ".") {
            return Laya.URL['formatRelativePath']((base || Laya.URL.basePath) + url);
        } else if (char1 === '~') {
            return Laya.URL.rootPath + url.substring(1);
        } else if (char1 === "d") {
            if (url.indexOf("data:image") === 0) return url;
        } else if (char1 === "/") {
            return url;
        }
        return (base || Laya.URL.basePath) + url;
    }
    if (config.isUseUrl) {
        Laya.URL.formatURL = formatURL;
    }
    // if (window.navigator.userAgent.indexOf('MiniGame') >= 0 || window.navigator.userAgent.indexOf('SwanGame') >= 0){
    //     Laya.URL.formatURL = formatURL;
    // }

    // export function loadImageP(url: string, isAtlas: boolean = true): Promise<Laya.Texture> {
    //     return new Promise((resolve: any, reject: any) => {
    //         if (!Laya.Browser.onMiniGame || !url.startsWith(WXLOCAL)) {
    //             url = Laya.URL.formatURL(url)
    //         }
    //         let img = Laya.HTMLImage.create(url); // HttpImage内部会进行formatURL
    //         img.onload = respHandler(true);
    //         img.onerror = respHandler(false);

    //         function respHandler(success: boolean) {
    //             return () => {
    //                 img.onload = null;
    //                 img.onerror = null;
    //                 if (success) {
    //                     let tex = new Laya.Texture(img);
    //                     tex.url = url;
    //                     if(isAtlas && tex && tex.bitmap)
    //                         tex.bitmap.enableMerageInAtlas = false;
    //                     resolve(tex);
    //                 } else {
    //                     reject({ message: 'load image error' });
    //                 }
    //             }
    //         }
    //     }).catch(()=>{
    //         throw new Error('load image error:::'+url);
    //     })

    // }

    // export function loadDataP(url: string): Promise<any> {
    //     return new Promise((resolve: any, reject: any) => {
    //         if (Laya.Browser.onMiniGame && url.startsWith(WXLOCAL)) {
    //             let fs = wx.getFileSystemManager();
    //             fs.readFile({filePath: url, encoding: 'ascii', success: (result: any) => {
    //                 resolve(JSON.parse(result.data));
    //             }, fail: (result: any) => {
    //                 reject({message: result.errMsg});
    //             }})
    //             return
    //         }

    //         let http = new Laya.HttpRequest();
    //         http.on(Laya.Event.ERROR, null, (err: string) => {
    //             reject({ message: err });
    //         });
    //         http.on(Laya.Event.COMPLETE, null, (data: any) => {
    //             resolve(data);
    //         });
    //         http.send(Laya.URL.formatURL(url), null, "get", 'json');
    //     })
    // }

    // function loadImage(loader: Laya.Loader) {
    //     let url = loader.url;
    //     loadImageP(url, false).then(tex => {
    //         loader.endLoad(tex)
    //     }).catch(err => {
    //         loader.event(Laya.Event.ERROR, err.message);
    //     });
    // }

    // function loadFont(loader: Laya.Loader) {
    //     let url = loader.url;
    //     let imgUrl = url.replace('.fnt', '.png');
    //     let index = url.lastIndexOf('/');
    //     let fontName = url.substr(index + 1, url.length - index - 5);
    //     Promise.all([loadDataP(url), loadImageP(imgUrl)]).then(result => {
    //         let data = result[0];
    //         let tex = result[1];
    //         if (!data.frames) return;
    //         var font = new Laya.BitmapFont();
    //         font.parseFont(data, tex);
    //         Laya.Text.registerBitmapFont(fontName, font);
    //         loader.endLoad(data);
    //     }).catch(err => {
    //         loader.event(Laya.Event.ERROR, err.message);
    //     })
    // }

    // // ATTENTION: 每次升级检查版本时，引擎中Loader.atlasMap是否改名
    // function loadAtlas(loader: Laya.Loader) {
    //     let url = loader.url;
    //     let imgUrl = url.replace('.json', '.png');
    //     Promise.all([loadDataP(url), loadImageP(imgUrl)]).then(result => {
    //         let data = result[0];
    //         let tex = result[1];
    //         if (data.frames && data.file) { // 普通合图
    //             let frames = data.frames;
    //             let directory = data.file.substr(0, data.file.length - 4); // 去除.png
    //             let atlasMap = (Laya.Loader as any)['atlasMap'];
    //             let map = atlasMap[url] || (atlasMap[url] = []);
    //             map.dir = directory;
    //             for (let name in frames) {
    //                 let frame = frames[name];
    //                 let _url = Laya.URL.formatURL(directory + '/' + name + '.png');
    //                 Laya.Loader.cacheRes(_url, Laya.Texture.create(tex, frame.x, frame.y, frame.w, frame.h));
    //                 Laya.Loader.loadedMap[_url].url = _url;
    //                 map.push(_url);
    //             }
    //             loader.endLoad(data);
    //         } else if (data.mc && data.res) { // 帧动画
    //             let baseDir = url.substring(0, url.lastIndexOf('/'));
    //             url = Laya.URL.formatURL(url);
    //             if (data.files) {
    //                 let loadPromise = data.files.map((file: any) => loadImageP(baseDir + '/' + file));
    //                 return Promise.all(loadPromise).then(textures => {
    //                     cacheFrames(url, data, textures);
    //                     loader.endLoad(data);
    //                 })
    //             } else {
    //                 cacheFrames(url, data, [tex]);
    //                 loader.endLoad(data);
    //             }
    //         }
    //         return Promise.resolve(void (0));
    //     }).catch(err => {
    //         loader.event(Laya.Event.ERROR, err.message);
    //     })
    // }

    // function loadSheet(loader: Laya.Loader) {
    //     let url = loader.url;
    //     url = Laya.URL.formatURL(url);
    //     let imgUrl = url.replace('.st', '.png');
    //     Promise.all([loadDataP(url), loadImageP(imgUrl)]).then(result => {
    //         let data = result[0];
    //         let tex = result[1];
    //         let frames = data.frames;
    //         let directory = data.file.substr(0, data.file.length - 4); // 去除.png
    //         let atlasMap = (Laya.Loader as any)['atlasMap'];
    //         let map = atlasMap[url] || (atlasMap[url] = []);
    //         map.dir = directory;
    //         for (let name in frames) {
    //             let frame = frames[name];
    //             let _url = Laya.URL.formatURL(directory + '/' + name + '.png');
    //             Laya.Loader.cacheRes(_url, Laya.Texture.create(tex, frame.x, frame.y, frame.w, frame.h));
    //             Laya.Loader.loadedMap[_url].url = _url;
    //             map.push(_url);
    //         }
    //         loader.endLoad(data);
    //     }).catch(err => {
    //         loader.event(Laya.Event.ERROR, err.message);
    //     })
    // }

    // function loadMc(loader: Laya.Loader) {
    //     let url = loader.url;
    //     let imgUrl = url.replace('.mc', '.png');
    //     Promise.all([loadDataP(url), loadImageP(imgUrl)]).then(result => {
    //         let data = result[0];
    //         let baseDir = url.substring(0, url.lastIndexOf('/'));
    //         url = Laya.URL.formatURL(url);
    //         if (data.files) {
    //             let loadPromise = data.files.map((file: any) => loadImageP(baseDir + '/' + file));
    //             return Promise.all(loadPromise).then(textures => {
    //                 cacheFrames(url, data, textures);
    //                 loader.endLoad(data);
    //             })
    //         } else {
    //             cacheFrames(url, data, [result[1]]);
    //             loader.endLoad(data);
    //         }
    //         return Promise.resolve(void (0));
    //     }).catch(err => {
    //         loader.event(Laya.Event.ERROR, err.message);
    //     })
    // }

    // function cacheFrames(url: string, data: any, textures: any[]) {
    //     let mc: any;
    //     for (let name in data.mc) {
    //         mc = data.mc[name];
    //         break;
    //     }
    //     let atlasMap = (Laya.Loader as any)['atlasMap'];
    //     let map = atlasMap[url] || (atlasMap[url] = []);
    //     let frameCount = mc.frames.length;
    //     let counter = 0;
    //     for (let i = 0; i < frameCount; i++) {
    //         let frame = mc.frames[i];
    //         let duration = frame.duration || 1;
    //         for (let j = 0; j < duration; j++) {
    //             let _url = Laya.URL.formatURL(url + '#' + (frame.res + '$$' + counter || `$$$${i}$${counter}`));
    //             counter++;
    //             if (frame.res) { // frame也可能是插入的空帧，这时res为空
    //                 let resData = data.res[frame.res];
    //                 let index = resData.index || 0;
    //                 Laya.Loader.cacheRes(_url, Laya.Texture.create(textures[index], resData.x, resData.y, resData.w, resData.h, frame.x, frame.y));
    //                 Laya.Loader.loadedMap[_url].url = _url;
    //             }
    //             map.push(_url);
    //         }
    //     }
    // }

    // Laya.Loader.typeMap['st'] = 'st';
    // Laya.Loader.typeMap['mc'] = 'mc';
    // Laya.Loader.typeMap['sk'] = Laya.Loader.BUFFER;
    // Laya.Loader.parserMap[Laya.Loader.IMAGE] = loadImage;
    // Laya.Loader.parserMap[Laya.Loader.FONT] = loadFont;
    // Laya.Loader.parserMap[Laya.Loader.ATLAS] = loadAtlas;
    // Laya.Loader.parserMap[ResType.SHEET] = loadSheet;
    // Laya.Loader.parserMap[ResType.MC] = loadMc;



    //=================load patch==============
    function parseLoadedImage(loader: any, data: any, isAtlas: boolean = true): void {
        let tex = new Laya.Texture(data);
        tex.url = loader.url;
        if (isAtlas && tex && tex.bitmap)
            tex.bitmap.enableMerageInAtlas = false;
        loader.complete(tex);
    }
    function parseLoadedFont(loader: any, data: any): void {
        let url = loader.url;
        if (!data.src) {
            if (!data.frames) {
                return;
            }
            let imgUrl = url.replace('.fnt', '.png');
            loader._data = data;
            loader.event(Laya.Event.PROGRESS, 0.5);
            return loader._loadImage(imgUrl);
        }
        else {
            let index = url.lastIndexOf('/');
            let fontName = url.substr(index + 1, url.length - index - 5);
            var font = new Laya.BitmapFont();
            font.parseFont(loader._data, data);
            Laya.Text.registerBitmapFont(fontName, font);
            loader._data = font;
            loader.complete(font);
        }
    }

    function parseLoadedAtlas(loader: any, data: any): void {
        let toloadPics: string[];
        if (!data.src) {
            if (!loader._data) {
                loader._data = data;
                //构造加载图片信息
                //带图片信息的
                let url = loader.url;
                let baseDir = url.substring(0, url.lastIndexOf('/'));
                if (data.frames && data.file) {//普通合图
                    toloadPics = [baseDir + "/" + data.file];
                }
                else if (data.mc && data.res && data.files) {
                    //帧动画，MC
                    toloadPics = [];
                    _.forEach(data.files, function (value, key) {
                        toloadPics.push(baseDir + "/" + value);
                    });
                }
                else {
                    //不带图片信息
                    toloadPics = [loader.url.replace(".json", ".png")];
                }
                toloadPics.reverse();
                data.toLoads = toloadPics;
                data.pics = [];
            }
            else {
                toloadPics = loader._data.toLoads;
            }
            loader.event(Laya.Event.PROGRESS, 0.3 + 1 / toloadPics.length * 0.6);
            return loader._loadImage(toloadPics.pop());
        }
        else {
            loader._data.pics.push(data);
            if (loader._data.toLoads.length > 0) {
                toloadPics = loader._data.toLoads;
                loader.event(Laya.Event.PROGRESS, 0.3 + 1 / toloadPics.length * 0.6);
                return loader._loadImage(toloadPics.pop());
            }
            //json. png都加载完成
            let jsonData = loader._data;
            let tex = data;
            if (jsonData.frames && jsonData.file) {
                //普通合图
                let frames = jsonData.frames;
                let directory = jsonData.file.substr(0, jsonData.file.length - 4);
                let atlasMap = (Laya.Loader as any)['atlasMap'];
                let atlasURL = Laya.URL.formatURL(loader.url);
                let map = atlasMap[atlasURL] || (atlasMap[atlasURL] = []);
                map.dir = directory;
                for (let name in frames) {
                    let frame = frames[name];
                    let _url = Laya.URL.formatURL(directory + "/" + name + ".png");
                    Laya.Loader.cacheRes(_url, Laya.Texture.create(tex, frame.x, frame.y, frame.w, frame.h));
                    Laya.Loader.loadedMap[_url].url = _url;
                }
                loader.complete(jsonData);
            }
            else if (jsonData.mc && jsonData.res) {
                loader._url = Laya.URL.formatURL(loader.url);
                cacheFrames(loader.url, jsonData, jsonData.pics);
                loader.complete(jsonData);
            }

        }
    }

    function cacheFrames(url: string, data: any, textures: any[]) {
        let mc: any;
        for (let name in data.mc) {
            mc = data.mc[name];
            break;
        }
        let atlasMap = (Laya.Loader as any)['atlasMap'];
        let map = atlasMap[url] || (atlasMap[url] = []);
        let frameCount = mc.frames.length;
        let counter = 0;
        for (let i = 0; i < frameCount; i++) {
            let frame = mc.frames[i];
            let duration = frame.duration || 1;
            for (let j = 0; j < duration; j++) {
                let _url = Laya.URL.formatURL(url + '#' + (frame.res + '$$' + counter || `$$$${i}$${counter}`));
                counter++;
                if (frame.res) { // frame也可能是插入的空帧，这时res为空
                    let resData = data.res[frame.res];
                    let index = resData.index || 0;
                    Laya.Loader.cacheRes(_url, Laya.Texture.create(textures[index], resData.x, resData.y, resData.w, resData.h, frame.x, frame.y));
                    Laya.Loader.loadedMap[_url].url = _url;
                }
                map.push(_url);
            }
        }
    }

    function parseLoadedPkm(loader: any, data: any): void {
        var image: Laya.HTMLImage = Laya.HTMLImage.create(data, loader.url);
        var tex1: Laya.Texture = new Laya.Texture(image);
        tex1.url = loader.url;
        loader.complete(tex1);
    }

    function parseLoadedSt(loader: any, data: any): void {
        let url = loader.url;
        if (!data.src) {
            if (!data.frames) {
                return;
            }
            if (!loader._data) {
                loader._data = data;
                let imgUrl = url.replace('.st', '.png');
                loader._data = data;
                loader.event(Laya.Event.PROGRESS, 0.5);
                return loader._loadImage(imgUrl);
            }
            else {
                return;
            }
        }
        else {
            let jsonData = loader._data;
            let tex = data;
            let frames = jsonData.frames;
            let directory = jsonData.file.substr(0, jsonData.file.length - 4); // 去除.png
            let atlasMap = (Laya.Loader as any)['atlasMap'];
            let atlasURL = Laya.URL.formatURL(url);
            let map = atlasMap[atlasURL] || (atlasMap[atlasURL] = []);
            map.dir = directory;
            for (let name in frames) {
                let frame = frames[name];
                let _url = Laya.URL.formatURL(directory + '/' + name + '.png');
                Laya.Loader.cacheRes(_url, Laya.Texture.create(tex, frame.x, frame.y, frame.w, frame.h));
                Laya.Loader.loadedMap[_url].url = _url;
                map.push(_url);
            }

            loader.complete(jsonData);
        }
    }

    let _proto: any = Laya.Loader.prototype;
    _proto.onLoaded = function (data: any = null): void {
        let thisLoader = this;
        var type = thisLoader.type;
        if (type == ResType.IMAGE) {
            parseLoadedImage(thisLoader, data, false);
        }
        else if (type == ResType.SOUND || type == "htmlimage" || type == "nativeimage") {
            thisLoader.complete(data);
        }
        else if (type == ResType.FONT) {
            parseLoadedFont(thisLoader, data);
        }
        else if (type == ResType.ATLAS) {
            parseLoadedAtlas(thisLoader, data);
        }
        else if (type == ResType.PKM) {
            parseLoadedPkm(thisLoader, data);
        }
        else if (type == ResType.SHEET) {
            parseLoadedSt(thisLoader, data);
        }
        else {
            thisLoader.complete(data);
        }
    }
    /**
     * 加载资源。加载错误会派发 Event.ERROR 事件，参数为错误信息。
     * @param	url			资源地址。
     * @param	type		(default = null)资源类型。可选值为：Loader.TEXT、Loader.JSON、Loader.XML、Loader.BUFFER、Loader.IMAGE、Loader.SOUND、Loader.ATLAS、Loader.FONT。如果为null，则根据文件后缀分析类型。
     * @param	cache		(default = true)是否缓存数据。
     * @param	group		(default = null)分组名称。
     * @param	ignoreCache (default = false)是否忽略缓存，强制重新加载。
     */
    _proto.load = function (url: string, type: string = null, cache: Boolean = true, group: string = null, ignoreCache: boolean = false): void {
        let thisLoader = this;
        thisLoader._url = url;
        if (url.indexOf("data:image") === 0) {
            thisLoader._type = type = ResType.IMAGE;
        }
        else {
            thisLoader._type = type || (type = thisLoader.getTypeFromUrl(url));
            url = Laya.URL.formatURL(url);
        }
        thisLoader._cache = cache;
        thisLoader._data = null;

        if (!ignoreCache && Laya.Loader.loadedMap[url]) {
            thisLoader._data = Laya.Loader.loadedMap[url];
            thisLoader.event(Laya.Event.PROGRESS, 1);
            thisLoader.event(Laya.Event.COMPLETE, thisLoader._data);
            return;
        }
        if (group) Laya.Loader.setGroup(url, group);

        //如果自定义了解析器，则自己解析，自定义解析不派发complete事件，但会派发loaded事件，手动调用endLoad方法再派发complete事件
        if (Laya.Loader.parserMap[type] != null) {
            thisLoader._customParse = true;
            if ((Laya.Loader.parserMap[type]) instanceof Laya.Handler) Laya.Loader.parserMap[type].runWith(thisLoader);
            else Laya.Loader.parserMap[type].call(null, thisLoader);
            return;
        }

        //htmlimage和nativeimage为内部类型
        if (type === ResType.IMAGE || type === "htmlimage" || type === "nativeimage") return thisLoader._loadImage(url);
        if (type === ResType.SOUND) return thisLoader._loadSound(url);
        if (type === ResType.TTF) return thisLoader._loadTTF(url);


        var contentType: string;
        switch (type) {
            case ResType.ATLAS:
            case ResType.FONT:
            case ResType.SHEET:
            case ResType.MC:
                contentType = ResType.JSON;
                break;
            case ResType.PKM:
                contentType = ResType.BUFFER;
                break
            default:
                contentType = type;
        }
        let preLoadedMap = (Laya.Loader as any)['preLoadedMap'];
        if (preLoadedMap[url]) {
            thisLoader.onLoaded(preLoadedMap[url]);
        } else {
            if (window['qg'] && thisLoader._http) {
                thisLoader._http.clear();
                thisLoader._http.offAll();
                thisLoader._http = null;
            }
            if (!thisLoader._http) {
                thisLoader._http = new Laya.HttpRequest();
                thisLoader._http.on(Laya.Event.PROGRESS, this, thisLoader.onProgress);
                thisLoader._http.on(Laya.Event.ERROR, this, thisLoader.onError);
                thisLoader._http.on(Laya.Event.COMPLETE, this, thisLoader.onLoaded);
            }
            thisLoader._http.http.onreadystatechange = null;
            thisLoader._http.send(url, null, "get", contentType);
        }
    }

    _proto.onError = function (message: string): void {
        let thisLoader = this;
        thisLoader.event(Laya.Event.ERROR, message);
        // net.sendLoog(`res:Failed to load ${thisLoader.url}`);
    }

    Laya.Loader.typeMap['st'] = 'st';
    Laya.Loader.typeMap['mc'] = 'mc';
    Laya.Loader.typeMap['sk'] = Laya.Loader.BUFFER;



}
