
(function (window, document, Laya) {
    var __un = Laya.un, __uns = Laya.uns, __static = Laya.static, __class = Laya.class, __getset = Laya.getset;
    var Browser = laya.utils.Browser, Event = laya.events.Event, EventDispatcher = laya.events.EventDispatcher;
    var HTMLImage = laya.resource.HTMLImage, Handler = laya.utils.Handler, Loader = laya.net.Loader, Input = laya.display.Input;
    var RunDriver = laya.utils.RunDriver, SoundChannel = laya.media.SoundChannel, SoundManager = laya.media.SoundManager;
    var URL = laya.net.URL, Utils = laya.utils.Utils;

    //class laya.vq.mini.MiniAdapter
    var MiniAdapter = (function () {
        function MiniAdapter() { }
        __class(MiniAdapter, 'laya.vq.mini.MiniAdapter');
        MiniAdapter.getJson = function (data) {
            return JSON.parse(data);
        }

        MiniAdapter.init = function (isPosMsg, isSon) {
            (isPosMsg === void 0) && (isPosMsg = false);
            (isSon === void 0) && (isSon = false);
            if (MiniAdapter._inited) return;
            MiniAdapter._inited = true;
            MiniAdapter.window =/*__JS__ */window;
            MiniAdapter.isZiYu = isSon;
            MiniAdapter.isPosMsgYu = isPosMsg;
            MiniAdapter.EnvConfig = {};
            try {
			/*__JS__ */laya.webgl.resource.WebGLCanvas.premulAlpha = true;
            } catch (e) {
            }
            if (!MiniAdapter.isZiYu) {
                MiniFileMgr$1.setNativeFileDir("/layaairGame");
                MiniFileMgr$1.existDir(MiniFileMgr$1.fileNativeDir, Handler.create(MiniAdapter, MiniAdapter.onMkdirCallBack));
            }
            MiniAdapter.systemInfo = { pixelRatio: MiniAdapter.window.devicePixelRatio };
            MiniAdapter.window.focus = function () { };
            Laya['getUrlPath'] = function () { };
            MiniAdapter.window.logtime = function (str) { };
            MiniAdapter.window.alertTimeLog = function (str) { };
            MiniAdapter.window.resetShareInfo = function () { };
            MiniAdapter.window.document.body.appendChild = function () { };
            MiniAdapter.EnvConfig.pixelRatioInt = 0;
            RunDriver.getPixelRatio = MiniAdapter.pixelRatio;
            MiniAdapter._preCreateElement = Browser.createElement;
            RunDriver.createShaderCondition = MiniAdapter.createShaderCondition;
            MiniAdapter.EnvConfig.load = Loader.prototype.load;
            Loader.prototype.load = MiniLoader$1.prototype.load;
            Loader.prototype._loadImage = MiniImage$1.prototype._loadImage;
            Input['_createInputElement'] = function () {
                Input._initInput(Input.area = Browser.createElement("textarea"));
                Input._initInput(Input.input = Browser.createElement("input"));
                Input.inputContainer = Browser.createElement("div");
                Input.inputContainer.style.position = "absolute";
                Input.inputContainer.style.zIndex = 1E5;
                Browser.container.appendChild(Input.inputContainer);
                Input.inputContainer.setPos = function (x, y) { Input.inputContainer.style.left = x + 'px'; Input.inputContainer.style.top = y + 'px'; };
                SoundManager._soundClass = MiniSound$1;
                SoundManager._musicClass = MiniSound$1;
            }
        }

        MiniAdapter.getUrlEncode = function (url, type) {
            if (url.indexOf(".fnt") != -1)
                return "utf8";
            else if (type == "arraybuffer")
                return "";
            return "ascii";
        }

        MiniAdapter.downLoadFile = function (fileUrl, fileType, callBack, encoding) {
            (fileType === void 0) && (fileType = "");
            (encoding === void 0) && (encoding = "ascii");
            var fileObj = MiniFileMgr$1.getFileInfo(fileUrl);
            if (!fileObj)
                MiniFileMgr$1.downLoadFile(fileUrl, fileType, callBack, encoding);
            else {
                callBack != null && callBack.runWith([0]);
            }
        }

        MiniAdapter.remove = function (fileUrl, callBack) {
            MiniFileMgr$1.deleteFile("", fileUrl, callBack, "", 0);
        }

        MiniAdapter.removeAll = function () {
            MiniFileMgr$1.deleteAll();
        }

        MiniAdapter.hasNativeFile = function (fileUrl) {
            return MiniFileMgr$1.isLocalNativeFile(fileUrl);
        }

        MiniAdapter.getFileInfo = function (fileUrl) {
            return MiniFileMgr$1.getFileInfo(fileUrl);
        }

        MiniAdapter.getFileList = function () {
            return MiniFileMgr$1.filesListObj;
        }

        MiniAdapter.exitMiniProgram = function () {
        }

        MiniAdapter.onMkdirCallBack = function (errorCode, data) {
            if (!errorCode)
                MiniFileMgr$1.filesListObj = JSON.parse(data.data);
        }

        MiniAdapter.pixelRatio = function () {
            if (!MiniAdapter.EnvConfig.pixelRatioInt) {
                try {
                    MiniAdapter.EnvConfig.pixelRatioInt = MiniAdapter.systemInfo.pixelRatio;
                    return MiniAdapter.systemInfo.pixelRatio;
                } catch (error) { }
            }
            return MiniAdapter.EnvConfig.pixelRatioInt;
        }

        MiniAdapter.EnvConfig = null;
        MiniAdapter.window = null;
        MiniAdapter._preCreateElement = null;
        MiniAdapter._inited = false;
        MiniAdapter.systemInfo = null;
        MiniAdapter.isZiYu = false;
        MiniAdapter.isPosMsgYu = false;
        MiniAdapter.autoCacheFile = true;
        MiniAdapter.minClearSize = (5 * 1024 * 1024);

        MiniAdapter.idx = 1;
        __static(MiniAdapter,
            ['nativefiles', function () { return this.nativefiles = ["layaNativeDir", "wxlocal"]; }
            ]);
        return MiniAdapter;
    })()


    /**@private **/
    //class laya.vq.mini.MiniFileMgr
    var MiniFileMgr$1 = (function () {
        function MiniFileMgr() { }
        __class(MiniFileMgr, 'laya.vq.mini.MiniFileMgr', null, 'MiniFileMgr$1');
        MiniFileMgr.isLocalNativeFile = function (url) {
            for (var i = 0, sz = MiniAdapter.nativefiles.length; i < sz; i++) {
                if (url.indexOf(MiniAdapter.nativefiles[i]) != -1)
                    return true;
            }
            return false;
        }

        MiniFileMgr.getFileInfo = function (fileUrl) {
            var fileNativePath = fileUrl;
            var fileObj = MiniFileMgr.filesListObj[fileNativePath];
            if (fileObj == null)
                return null;
            else
                return fileObj;
        }

        MiniFileMgr.read = function (filePath, encoding, callBack, readyUrl, isSaveFile, fileType) {
            (encoding === void 0) && (encoding = "ascill");
            (readyUrl === void 0) && (readyUrl = "");
            (isSaveFile === void 0) && (isSaveFile = false);
            (fileType === void 0) && (fileType = "");
            var fileUrl;
            if (readyUrl != "" && (readyUrl.indexOf("http://") != -1 || readyUrl.indexOf("https://") != -1)) {
                fileUrl = MiniFileMgr.getFileNativePath(filePath)
            } else {
                fileUrl = filePath;
            }
            MiniFileMgr.fs.readFile({
                uri: fileUrl,
                encoding: encoding,
                success: function (data) {
                    callBack != null && callBack.runWith([0, data]);
                }, fail: function (data) {
                    if (data && readyUrl != "")
                        MiniFileMgr.downFiles(readyUrl, encoding, callBack, readyUrl, isSaveFile, fileType);
                    else
                        callBack != null && callBack.runWith([1]);
                }
            });
        }

        MiniFileMgr.downFiles = function (fileUrl, encoding, callBack, readyUrl, isSaveFile, fileType) {
            (encoding === void 0) && (encoding = "ascii");
            (readyUrl === void 0) && (readyUrl = "");
            (isSaveFile === void 0) && (isSaveFile = false);
            (fileType === void 0) && (fileType = "");
            var downloadTask = MiniFileMgr.wxdown({
                url: fileUrl,
                success: function (data) {
                    MiniFileMgr.readFile(data.tempFilePath, encoding, callBack, readyUrl, isSaveFile, fileType);
                }, fail: function (data) {
                    callBack != null && callBack.runWith([1, data]);
                }
            });
            downloadTask.onProgressUpdate(function (data) {
                callBack != null && callBack.runWith([2, data.progress]);
            });
        }

        MiniFileMgr.readFile = function (filePath, encoding, callBack, readyUrl, isSaveFile, fileType) {
            (encoding === void 0) && (encoding = "ascill");
            (readyUrl === void 0) && (readyUrl = "");
            (isSaveFile === void 0) && (isSaveFile = false);
            (fileType === void 0) && (fileType = "");
            MiniFileMgr.fs.readFile({
                uri: filePath,
                encoding: encoding,
                success: function (data) {
                    if (filePath.indexOf("http://") != -1 || filePath.indexOf("https://") != -1) {
                        if (MiniAdapter.autoCacheFile || isSaveFile) {
                            MiniFileMgr.copyFile(filePath, readyUrl, callBack, encoding);
                        }
                    }
                    else
                        callBack != null && callBack.runWith([0, data]);
                }, fail: function (data) {
                    if (data)
                        callBack != null && callBack.runWith([1, data]);
                }
            });
        }

        MiniFileMgr.downOtherFiles = function (fileUrl, callBack, readyUrl, isSaveFile) {
            (readyUrl === void 0) && (readyUrl = "");
            (isSaveFile === void 0) && (isSaveFile = false);
            MiniFileMgr.wxdown({
                url: fileUrl,
                success: function (data) {
                    if ((MiniAdapter.autoCacheFile || isSaveFile) && readyUrl.indexOf("swan.qlogo.cn") == -1)
                        MiniFileMgr.copyFile(data.tempFilePath, readyUrl, callBack);
                    else
                        callBack != null && callBack.runWith([0, data.tempFilePath]);
                }, fail: function (data) {
                    callBack != null && callBack.runWith([1, data]);
                }
            });
        }

        MiniFileMgr.downLoadFile = function (fileUrl, fileType, callBack, encoding) {
            (fileType === void 0) && (fileType = "");
            (encoding === void 0) && (encoding = "ascii");
            if (fileType ==/*laya.net.Loader.IMAGE*/"image" || fileType ==/*laya.net.Loader.SOUND*/"sound")
                MiniFileMgr.downOtherFiles(fileUrl, callBack, fileUrl, true);
            else
                MiniFileMgr.downFiles(fileUrl, encoding, callBack, fileUrl, true, fileType);
        }

        MiniFileMgr.copyFile = function (tempFilePath, readyUrl, callBack, encoding) {
            (encoding === void 0) && (encoding = "");
            var temp = tempFilePath.split("/");
            var tempFileName = temp[temp.length - 1];
            var fileurlkey = readyUrl;
            var fileObj = MiniFileMgr.getFileInfo(readyUrl);
            var saveFilePath = MiniFileMgr.getFileNativePath(tempFileName);
            var totalSize = 50 * 1024 * 1024;
            var chaSize = 4 * 1024 * 1024;
            var fileUseSize = MiniFileMgr.getCacheUseSize();
            if (fileObj) {
                if (fileObj.readyUrl != readyUrl) {
                    MiniFileMgr.fs.getFileInfo({
                        uri: tempFilePath,
                        success: function (data) {
                            if ((fileUseSize + chaSize + data.length) >= totalSize) {
                                if (data.length > MiniAdapter.minClearSize)
                                    MiniAdapter.minClearSize = data.length;
                                MiniFileMgr.onClearCacheRes();
                            }
                            MiniFileMgr.deleteFile(tempFileName, readyUrl, callBack, encoding, data.length);
                        },
                        fail: function (data) {
                            callBack != null && callBack.runWith([1, data]);
                        }
                    });
                }
                else
                    callBack != null && callBack.runWith([0]);
            } else {
                MiniFileMgr.fs.getFileInfo({
                    uri: tempFilePath,
                    success: function (data) {
                        if ((fileUseSize + chaSize + data.length) >= totalSize) {
                            if (data.length > MiniAdapter.minClearSize)
                                MiniAdapter.minClearSize = data.length;
                            MiniFileMgr.onClearCacheRes();
                        }
                        MiniFileMgr.fs.copyFile({
                            srcUri: tempFilePath,
                            dstUri: saveFilePath,
                            success: function (data2) {
                                MiniFileMgr.onSaveFile(readyUrl, tempFileName, true, encoding, callBack, data.length);
                            }, fail: function (data) {
                                callBack != null && callBack.runWith([1, data]);
                            }
                        });
                    },
                    fail: function (data) {
                        callBack != null && callBack.runWith([1, data]);
                    }
                });
            }
        }

        MiniFileMgr.onClearCacheRes = function () {
            var memSize = MiniAdapter.minClearSize;
            var tempFileListArr = [];
            for (var key in MiniFileMgr.filesListObj) {
                tempFileListArr.push(MiniFileMgr.filesListObj[key]);
            }
            MiniFileMgr.sortOn(tempFileListArr, "times", 16);
            var clearSize = 0;
            for (var i = 1, sz = tempFileListArr.length; i < sz; i++) {
                var fileObj = tempFileListArr[i];
                if (clearSize >= memSize)
                    break;
                clearSize += fileObj.size;
                MiniFileMgr.deleteFile("", fileObj.readyUrl);
            }
        }

        MiniFileMgr.sortOn = function (array, name, options) {
            (options === void 0) && (options = 0);
            if (options == 16) return array.sort(function (a, b) { return a[name] - b[name]; });
            if (options == (16 | 2)) return array.sort(function (a, b) { return b[name] - a[name]; });
            return array.sort(function (a, b) { return a[name] - b[name] });
        }

        MiniFileMgr.getFileNativePath = function (fileName) {
            return laya.vq.mini.MiniFileMgr.fileNativeDir + "/" + fileName;
        }

        MiniFileMgr.deleteFile = function (tempFileName, readyUrl, callBack, encoding, fileSize) {
            (readyUrl === void 0) && (readyUrl = "");
            (encoding === void 0) && (encoding = "");
            (fileSize === void 0) && (fileSize = 0);
            var fileObj = MiniFileMgr.getFileInfo(readyUrl);
            var deleteFileUrl = MiniFileMgr.getFileNativePath(fileObj.md5);
            MiniFileMgr.fs.deleteFile({
                uri: deleteFileUrl,
                success: function (data) {
                    var isAdd = tempFileName != "" ? true : false;
                    if (tempFileName != "") {
                        var saveFilePath = MiniFileMgr.getFileNativePath(tempFileName);
                        MiniFileMgr.fs.copyFile({
                            srcUri: tempFileName,
                            dstUri: saveFilePath,
                            success: function (data) {
                                MiniFileMgr.onSaveFile(readyUrl, tempFileName, isAdd, encoding, callBack, data.length);
                            }, fail: function (data) {
                                callBack != null && callBack.runWith([1, data]);
                            }
                        });
                    } else {
                        MiniFileMgr.onSaveFile(readyUrl, tempFileName, isAdd, encoding, callBack, fileSize);
                    }
                }, fail: function (data) {
                    console.error('deleteFile', data);
                }
            });
        }

        MiniFileMgr.deleteAll = function () {
            var tempFileListArr = [];
            for (var key in MiniFileMgr.filesListObj) {
                tempFileListArr.push(MiniFileMgr.filesListObj[key]);
            }
            for (var i = 1, sz = tempFileListArr.length; i < sz; i++) {
                var fileObj = tempFileListArr[i];
                MiniFileMgr.deleteFile("", fileObj.readyUrl);
            }
        }

        MiniFileMgr.onSaveFile = function (readyUrl, md5Name, isAdd, encoding, callBack, fileSize) {
            (isAdd === void 0) && (isAdd = true);
            (encoding === void 0) && (encoding = "");
            (fileSize === void 0) && (fileSize = 0);
            var fileurlkey = readyUrl;
            if (MiniFileMgr.filesListObj['fileUsedSize'] == null)
                MiniFileMgr.filesListObj['fileUsedSize'] = 0;
            if (isAdd) {
                var fileNativeName = MiniFileMgr.getFileNativePath(md5Name);
                MiniFileMgr.filesListObj[fileurlkey] = { md5: md5Name, readyUrl: readyUrl, size: fileSize, times: Browser.now(), encoding: encoding };
                MiniFileMgr.filesListObj['fileUsedSize'] = parseInt(MiniFileMgr.filesListObj['fileUsedSize']) + fileSize;
                MiniFileMgr.writeFilesList(fileurlkey, JSON.stringify(MiniFileMgr.filesListObj), true);
                callBack != null && callBack.runWith([0]);
            } else {
                if (MiniFileMgr.filesListObj[fileurlkey]) {
                    var deletefileSize = parseInt(MiniFileMgr.filesListObj[fileurlkey].size);
                    MiniFileMgr.filesListObj['fileUsedSize'] = parseInt(MiniFileMgr.filesListObj['fileUsedSize']) - deletefileSize;
                    delete MiniFileMgr.filesListObj[fileurlkey];
                    MiniFileMgr.writeFilesList(fileurlkey, JSON.stringify(MiniFileMgr.filesListObj), false);
                    callBack != null && callBack.runWith([0]);
                }
            }
        }

        MiniFileMgr.writeFilesList = function (fileurlkey, filesListStr, isAdd) {
            var listFilesPath = MiniFileMgr.fileNativeDir + "/" + MiniFileMgr.fileListName;
            MiniFileMgr.fs.writeFile({
                uri: listFilesPath,
                text: filesListStr,
                encoding: 'utf8',
                success: function (data) {
                    console.log("writeFile success ", listFilesPath);
                }, fail: function (data) {
                }
            });
            if (!MiniAdapter.isZiYu && MiniAdapter.isPosMsgYu) {
			/*__JS__ */wx.postMessage({ url: fileurlkey, data: MiniFileMgr.filesListObj[fileurlkey], isLoad: "filenative", isAdd: isAdd });
            }
        }

        MiniFileMgr.getCacheUseSize = function () {
            if (MiniFileMgr.filesListObj && MiniFileMgr.filesListObj['fileUsedSize'])
                return MiniFileMgr.filesListObj['fileUsedSize'];
            return 0;
        }

        MiniFileMgr.existDir = function (dirPath, callBack) {
            MiniFileMgr.fs.mkdir({
                uri: dirPath,
                success: function (data) {
                    callBack != null && callBack.runWith([0, { data: JSON.stringify({}) }]);
                },
                fail: function (data, code) {
                    console.log(`handling fail, code = ${code}`);
                    if (code == 300) {
                        MiniFileMgr.readSync(MiniFileMgr.fileListName, "utf8", callBack);
                    } else {
                        callBack != null && callBack.runWith([1, data]);
                    }
                }
            });
        }

        MiniFileMgr.readSync = function (filePath, encoding, callBack, readyUrl) {
            (encoding === void 0) && (encoding = "ascill");
            (readyUrl === void 0) && (readyUrl = "");
            var fileUrl = MiniFileMgr.getFileNativePath(filePath);
            var filesListStr
            try {
                filesListStr = MiniFileMgr.fs.readFileSync(fileUrl, encoding);
                callBack != null && callBack.runWith([0, { data: filesListStr }]);
            }
            catch (error) {
                callBack != null && callBack.runWith([1]);
            }
        }

        MiniFileMgr.setNativeFileDir = function (value) {
            MiniFileMgr.fileNativeDir =/*__JS__ */'internal://cache' + value;
        }

        MiniFileMgr.filesListObj = {};
        MiniFileMgr.fileNativeDir = null;
        MiniFileMgr.fileListName = "layaairfiles.txt";
        MiniFileMgr.ziyuFileData = {};
        MiniFileMgr.loadPath = "";
        MiniFileMgr.DESCENDING = 2;
        MiniFileMgr.NUMERIC = 16;
        __static(MiniFileMgr,
            ['fs', function () { return this.fs =/*__JS__ */qg; }, 'wxdown', function () { return this.wxdown =/*__JS__ */qg.download; }
            ]);
        return MiniFileMgr;
    })()

    /**@private **/
    //class laya.vq.mini.MiniImage
    var MiniImage$1 = (function () {
        function MiniImage() { }
        __class(MiniImage, 'laya.vq.mini.MiniImage', null, 'MiniImage$1');
        var __proto = MiniImage.prototype;
        /**@private **/
        __proto._loadImage = function (url) {
            var thisLoader = this;
            if (MiniAdapter.isZiYu) {
                MiniImage.onCreateImage(url, thisLoader, true);
                return;
            };
            var isTransformUrl = false;
            if (!MiniFileMgr$1.isLocalNativeFile(url)) {
                isTransformUrl = true;
                url = URL.formatURL(url);
            } else {
                if (url.indexOf("http://") != -1 || url.indexOf("https://") != -1) {
                    if (MiniFileMgr$1.loadPath != "") {
                        url = url.split(MiniFileMgr$1.loadPath)[1];
                    } else {
                        var tempStr = URL.rootPath != "" ? URL.rootPath : URL.basePath;
                        if (tempStr != "")
                            url = url.split(tempStr)[1];
                    }
                }
            }
            if (!MiniAdapter.autoCacheFile || !MiniFileMgr$1.getFileInfo(url)) {
                if (url.indexOf("http://") != -1 || url.indexOf("https://") != -1) {
                    if (MiniAdapter.isZiYu) {
                        MiniImage.onCreateImage(url, thisLoader, true);
                    } else {
                        MiniFileMgr$1.downOtherFiles(url, new Handler(MiniImage, MiniImage.onDownImgCallBack, [url, thisLoader]), url);
                    }
                }
                else
                    MiniImage.onCreateImage(url, thisLoader, true);
            } else {
                MiniImage.onCreateImage(url, thisLoader, !isTransformUrl);
            }
        }

        MiniImage.onDownImgCallBack = function (sourceUrl, thisLoader, errorCode, tempFilePath) {
            (tempFilePath === void 0) && (tempFilePath = "");
            if (!errorCode)
                MiniImage.onCreateImage(sourceUrl, thisLoader, false, tempFilePath);
            else {
                thisLoader.onError(null);
            }
        }

        MiniImage.onCreateImage = function (sourceUrl, thisLoader, isLocal, tempFilePath) {
            (isLocal === void 0) && (isLocal = false);
            (tempFilePath === void 0) && (tempFilePath = "");
            var fileNativeUrl;
            if (MiniAdapter.autoCacheFile) {
                if (!isLocal) {
                    if (tempFilePath != "") {
                        fileNativeUrl = tempFilePath;
                    } else {
                        var fileObj = MiniFileMgr$1.getFileInfo(sourceUrl);
                        var fileMd5Name = fileObj.md5;
                        fileNativeUrl = MiniFileMgr$1.getFileNativePath(fileMd5Name);
                    }
                } else
                    fileNativeUrl = sourceUrl;
            } else {
                if (!isLocal)
                    fileNativeUrl = tempFilePath;
                else
                    fileNativeUrl = sourceUrl;
            }
            if (thisLoader.imgCache == null)
                thisLoader.imgCache = {};
            var image;
            function clear() {
                image.onload = null;
                image.onerror = null;
                delete thisLoader.imgCache[sourceUrl]
            };
            var onload = function () {
                clear();
                thisLoader._url = URL.formatURL(thisLoader._url);
                thisLoader.onLoaded(image);
            };
            var onerror = function () {
                clear();
                thisLoader.event(/*laya.events.Event.ERROR*/"error", "Load image failed");
            }
            if (thisLoader._type == "nativeimage") {
                image = new Browser.window.Image();
                image.crossOrigin = "";
                image.onload = onload;
                image.onerror = onerror;
                image.src = fileNativeUrl;
                thisLoader.imgCache[sourceUrl] = image;
            } else {
                new HTMLImage.create(fileNativeUrl, {
                    onload: onload, onerror: onerror, onCreate: function (img) {
                        image = img;
                        thisLoader.imgCache[sourceUrl] = img;
                    }
                });
            }
        }

        return MiniImage;
    })()

    /**@private **/
    //class laya.vq.mini.MiniLoader extends laya.events.EventDispatcher
    var MiniLoader$1 = (function (_super) {
        function MiniLoader() {
            MiniLoader.__super.call(this);
        }

        __class(MiniLoader, 'laya.vq.mini.MiniLoader', _super, 'MiniLoader$1');
        var __proto = MiniLoader.prototype;
		/**
		*@private
		*@param url
		*@param type
		*@param cache
		*@param group
		*@param ignoreCache
		*/
        __proto.load = function (url, type, cache, group, ignoreCache) {
            (cache === void 0) && (cache = true);
            (ignoreCache === void 0) && (ignoreCache = false);
            var thisLoader = this;
            thisLoader._url = url;
            if (url.indexOf("data:image") === 0) thisLoader._type = type =/*laya.net.Loader.IMAGE*/"image";
            else {
                thisLoader._type = type || (type = thisLoader.getTypeFromUrl(url));
            }
            thisLoader._cache = cache;
            thisLoader._data = null;
            if (!ignoreCache && Loader.loadedMap[URL.formatURL(url)]) {
                thisLoader._data = Loader.loadedMap[URL.formatURL(url)];
                this.event(/*laya.events.Event.PROGRESS*/"progress", 1);
                this.event(/*laya.events.Event.COMPLETE*/"complete", thisLoader._data);
                return;
            }
            if (Loader.parserMap[type] != null) {
                thisLoader._customParse = true;
                if (((Loader.parserMap[type]) instanceof laya.utils.Handler)) Loader.parserMap[type].runWith(this);
                else Loader.parserMap[type].call(null, this);
                return;
            };
            var encoding = MiniAdapter.getUrlEncode(url, type);
            var urlType = Utils.getFileExtension(url);
            if ((MiniLoader._fileTypeArr.indexOf(urlType) != -1)) {
                MiniAdapter.EnvConfig.load.call(this, url, type, cache, group, ignoreCache);
            } else {
                if (MiniAdapter.isZiYu && MiniFileMgr$1.ziyuFileData[url]) {
                    var tempData = MiniFileMgr$1.ziyuFileData[url];
                    thisLoader.onLoaded(tempData);
                    return;
                }
                if (!MiniFileMgr$1.getFileInfo(url)) {
                    if (MiniFileMgr$1.isLocalNativeFile(url)) {
                        MiniFileMgr$1.read(url, encoding, new Handler(MiniLoader, MiniLoader.onReadNativeCallBack, [encoding, url, type, cache, group, ignoreCache, thisLoader]));
                        return;
                    };
                    var tempUrl = url;
                    url = URL.formatURL(url);
                    if (url.indexOf("http://") != -1 || url.indexOf("https://") != -1) {
                        MiniAdapter.EnvConfig.load.call(thisLoader, tempUrl, type, cache, group, ignoreCache);
                    } else {
                        MiniFileMgr$1.readFile(url, encoding, new Handler(MiniLoader, MiniLoader.onReadNativeCallBack, [encoding, url, type, cache, group, ignoreCache, thisLoader]), url);
                    }
                } else {
                    var fileObj = MiniFileMgr$1.getFileInfo(url);
                    fileObj.encoding = fileObj.encoding == null ? "ascii" : fileObj.encoding;
                    MiniFileMgr$1.readFile(url, fileObj.encoding, new Handler(MiniLoader, MiniLoader.onReadNativeCallBack, [encoding, url, type, cache, group, ignoreCache, thisLoader]), url);
                }
            }
        }

        MiniLoader.onReadNativeCallBack = function (encoding, url, type, cache, group, ignoreCache, thisLoader, errorCode, data) {
            (cache === void 0) && (cache = true);
            (ignoreCache === void 0) && (ignoreCache = false);
            (errorCode === void 0) && (errorCode = 0);
            if (!errorCode) {
                var tempData;
                if (type ==/*laya.net.Loader.JSON*/"json" || type ==/*laya.net.Loader.ATLAS*/"atlas") {
                    tempData = MiniAdapter.getJson(data.data);
                } else if (type ==/*laya.net.Loader.XML*/"xml") {
                    tempData = Utils.parseXMLFromString(data.data);
                } else {
                    tempData = data.data;
                }
                if (!MiniAdapter.isZiYu && MiniAdapter.isPosMsgYu && type !=/*laya.net.Loader.BUFFER*/"arraybuffer") {
                }
                thisLoader.onLoaded(tempData);
            } else if (errorCode == 1) {
                MiniAdapter.EnvConfig.load.call(thisLoader, url, type, cache, group, ignoreCache);
            }
        }

        __static(MiniLoader,
            ['_fileTypeArr', function () { return this._fileTypeArr = ['png', 'jpg', 'bmp', 'jpeg', 'gif']; }
            ]);
        return MiniLoader;
    })(EventDispatcher)

    /**@private **/
	//class laya.vq.mini.MiniSound extends laya.events.EventDispatcher
	var MiniSound$1 = (function (_super) {
		function MiniSound() {
			/**@private **/
			this._sound = null;
			/**
			*@private
			*声音URL
			*/
			this.url = null;
			/**
			*@private
			*是否已加载完成
			*/
			this.loaded = false;
			/**@private **/
			this.readyUrl = null;
			MiniSound.__super.call(this);
		}

		__class(MiniSound, 'laya.vq.mini.MiniSound', _super, 'MiniSound$1');
		var __proto = MiniSound.prototype;
		/**
		*@private
		*加载声音。
		*@param url 地址。
		*
		*/
		__proto.load = function (url) {
			url = URL.formatURL(url);
			this.url = url;
			this.readyUrl = url;
			// if (MiniSound._audioCache[this.readyUrl]) {
			// 	this.event(/*laya.events.Event.COMPLETE*/"complete");
			// 	return;
            // }
			if (MiniAdapter.autoCacheFile && MiniFileMgr$1.getFileInfo(url)) {
				this.onDownLoadCallBack(url, 0);
			} else {
				// if (!MiniAdapter.autoCacheFile) {
				// 	this.onDownLoadCallBack(url, 0);
				// } else {
				// 	MiniFileMgr$1.downOtherFiles(url, Handler.create(this, this.onDownLoadCallBack, [url]), url);
                // }
                MiniFileMgr$1.downOtherFiles(url, Handler.create(this, this.onDownLoadCallBack), url);
			}
		}

		/**@private **/
		__proto.onDownLoadCallBack = function (errorCode, sourceUrl) {
			if (!errorCode) {
                this.onCanPlay();
                if (this._sound) {
                    var fileNativeUrl;
                    if (MiniAdapter.autoCacheFile) {
                        var fileObj = MiniFileMgr$1.getFileInfo(sourceUrl);
                        var fileMd5Name = fileObj.md5;
                        fileNativeUrl = MiniFileMgr$1.getFileNativePath(fileMd5Name);
                        this._sound.src = this.url = fileNativeUrl;
                    } else {
                        this._sound.src = this.url = sourceUrl;
                    }
                    this._sound.play();
                }
			} else {
				this.event(/*laya.events.Event.ERROR*/"error");
			}
		}

		/**@private **/
		__proto.onError = function (error) {
			try {
				console.log("-----1---------------minisound-----id:" + MiniSound._id);
				console.log(error);
			}
			catch (error) {
				console.log("-----2---------------minisound-----id:" + MiniSound._id);
				console.log(error);
			}
			this.event(/*laya.events.Event.ERROR*/"error");
			this._sound.offError(null);
		}

		/**@private **/
		__proto.onCanPlay = function () {
			this.loaded = true;
			this.event(/*laya.events.Event.COMPLETE*/"complete");
			//this._sound.offCanplay(null);
		}

		/**
		*@private
		*播放声音。
		*@param startTime 开始时间,单位秒
		*@param loops 循环次数,0表示一直循环
		*@return 声道 SoundChannel 对象。
		*
		*/
		__proto.play = function (startTime, loops) {
			(startTime === void 0) && (startTime = 0);
            (loops === void 0) && (loops = 0);
            var tSound;

            if (!MiniSound._audioCache[this.readyUrl])
                MiniSound._audioCache[this.readyUrl] = this
            if (MiniSound._audioCache[this.readyUrl]._sound) {
                tSound = MiniSound._audioCache[this.readyUrl]._sound;
            } else {
                tSound = MiniSound._audioCache[this.readyUrl]._sound = MiniSound._createSound();
            }
			if (this.readyUrl == SoundManager._tMusic) {
                MiniSound._musicAudio = tSound;
            }

			if (MiniAdapter.autoCacheFile && MiniFileMgr$1.getFileInfo(this.url)) {
				var fileNativeUrl;
				var fileObj = MiniFileMgr$1.getFileInfo(this.url);
				var fileMd5Name = fileObj.md5;
				tSound.src = this.url = MiniFileMgr$1.getFileNativePath(fileMd5Name);
			} else {
				tSound.src = this.url;
			};
			var channel = new MiniSoundChannel$1(tSound, this);
			channel.url = this.url;
			channel.loops = loops;
			channel.loop = (loops === 0 ? true : false);
			channel.startTime = startTime;
			channel.play();
			return channel;
		}

		/**
		*@private
		*释放声音资源。
		*
		*/
		__proto.dispose = function () {
			var ad = MiniSound._audioCache[this.readyUrl];
			if (ad) {
                ad.src = "";
				if (ad._sound) {
					MiniSound._destroySound(ad._sound);
					ad._sound = null;
					ad = null;
				}
				delete MiniSound._audioCache[this.readyUrl];
			}
		}

		/**
		*@private
		*获取总时间。
		*/
		__getset(0, __proto, 'duration', function () {
			return this._sound ? this._sound.duration : 0;
		});

		MiniSound._createSound = function () {
            MiniSound._id++;
            if (MiniSound._gpAudioPool && MiniSound._gpAudioPool.length > 0)
                return MiniSound._gpAudioPool.pop();
            else
			    return qg.createInnerAudioContext();
        }

        MiniSound._destroySound = function(audio) {
            if (audio) {
                audio.stop();
                MiniSound._gpAudioPool.push(audio);
            }
        }

		MiniSound.bindToThis = function (fun, scope) {
			var rst = fun;
		/*__JS__ */rst = fun.bind(scope);;
			return rst;
		}

		MiniSound._musicAudio = null;
		MiniSound._id = 0;
        MiniSound._audioCache = {};
        MiniSound._gpAudioPool = [];
		return MiniSound;
	})(EventDispatcher)

    /**@private **/
    // class laya.vq.mini.MiniSoundChannel extends laya.media.SoundChannel
    var MiniSoundChannel$1 = (function (_super) {
        function MiniSoundChannel(audio, miniSound) {
            /**@private **/
            this._audio = null;
            /**@private **/
            this._onEnd = null;
            /**@private **/
            this._miniSound = null;
            MiniSoundChannel.__super.call(this);
            this._audio = audio;
            this._miniSound = miniSound;
            this._onEnd = MiniSoundChannel.bindToThis(this.__onEnd, this);

        }

        __class(MiniSoundChannel, 'laya.vq.mini.MiniSoundChannel', _super, 'MiniSoundChannel$1');
        var __proto = MiniSoundChannel.prototype;
        /**@private **/
        __proto.__onEnd = function () {
            if (this.loops == 1) {
                if (this.completeHandler) {
                    Laya.timer.once(10, this, this.__runComplete, [this.completeHandler], false);
                    this.completeHandler = null;
                }
                this.stop();
                this.event(/*laya.events.Event.COMPLETE*/"complete");
                return;
            }
            if (this.loops > 0) {
                this.loops--;
            }
            this.startTime = 0;
            this.play();
        }

    	/**
    	*@private
    	*播放
    	*/
        __proto.play = function () {
            this.isStopped = false;
            SoundManager.addChannel(this);
            this._audio.play();
            this._audio.onEnded(this._onEnd);
        }

    	/**
    	*@private
    	*停止播放
    	*
    	*/
        __proto.stop = function () {
            this.isStopped = true;
            SoundManager.removeChannel(this);
            this.completeHandler = null;
            if (!this._audio)
                return;
            this._audio.pause();
            this._audio.offEnded(null);
            this._audio = null;
            this._miniSound = null;
            this._onEnd = null;
        }

        /**@private **/
        __proto.pause = function () {
            this.isStopped = true;
            this._audio.pause();
        }

        /**@private **/
        __proto.resume = function () {
            if (!this._audio)
                return;
            this.isStopped = false;
            SoundManager.addChannel(this);
            this._audio.play();
        }

        /**@private **/
    	/**
    	*@private
    	*自动播放
    	*@param value
    	*/
        __getset(0, __proto, 'autoplay', function () {
            return this._audio.autoplay;
        }, function (value) {
            this._audio.autoplay = value;
        });

    	/**
    	*@private
    	*当前播放到的位置
    	*@return
    	*
    	*/
        __getset(0, __proto, 'position', function () {
            if (!this._audio)
                return 0;
            return this._audio.currentTime;
        });

    	/**
    	*@private
    	*获取总时间。
    	*/
        __getset(0, __proto, 'duration', function () {
            if (!this._audio)
                return 0;
            return this._audio.duration;
        });

        /**@private **/
        /**@private **/
        __getset(0, __proto, 'loop', function () {
            return this._audio.loop;
        }, function (value) {
            this._audio.loop = value;
        });

    	/**
    	*@private
    	*设置音量
    	*@param v
    	*
    	*/
    	/**
    	*@private
    	*获取音量
    	*@return
    	*/
        __getset(0, __proto, 'volume', function () {
            if (!this._audio) return 1;
            return this._audio.volume;
        }, function (v) {
            if (!this._audio) return;
            if (v > 1) {
                v = 1;
            }
            this._audio.volume = v;
        });

        MiniSoundChannel.bindToThis = function (fun, scope) {
            var rst = fun;
    	/*__JS__ */rst = fun.bind(scope);;
            return rst;
        }

        return MiniSoundChannel;
    })(SoundChannel)

})(window, document, Laya);

if (typeof define === 'function' && define.amd) {
    define('laya.core', ['require', "exports"], function (require, exports) {
        'use strict';
        Object.defineProperty(exports, '__esModule', { value: true });
        for (var i in Laya) {
            var o = Laya[i];
            o && o.__isclass && (exports[i] = o);
        }
    });
}
