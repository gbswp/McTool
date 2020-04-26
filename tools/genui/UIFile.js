var fs = require('fs');
var path = require('path');
var helper = require('./helper');
var dust = require('dustjs-helpers');
var config = require('../config')
var settings = require(path.join(config.projectPath, config.settingsFile));
var resmanager = require('../resmanager');
var _ = require('lodash');
_.mergeDefaults = require('merge-defaults');
var crypto = require('crypto');

// root中需要保留的key
var neededKeys = {
    'type': true,
    'props': true,
    'child': true,
    'compId': true,
    'animations': true
};

// 不需要的props中的key
var noNeedProps = {
    'layers': true,
    'layer': true,
    'sceneWidth': true,
    'sceneHeight': true,
    'sceneColor': true,
    'sceneBg': true,
    'styleSkin': true
};

// 允许注册的事件，以$结尾的代表事件会穿透到邻近的View层，以$$结尾的代表事件会穿透到Dialog层
var allowedEvents = ['click', 'select', 'cellClick', 'cellChildClick', 'inputChange', 'change', 'render', 'link', 'mousedown'];
allowedEvents = allowedEvents.concat(allowedEvents.map(name => name + '$')).concat(allowedEvents.map(name => name + '$$'));

// 需要调整数字精度的key
var adjustKeys = ['x', 'y', 'width', 'height'];

// 根节点的组件类型
var rootCompTypes = ['View', 'Dialog', 'CellView'];

// 应用需继承的UI组件的文件名后缀, 'View'包含了'CellView'的情况
var appExtendViewPostfix = ['View', 'Dlg'];
var dlgPostFix = 'Dlg';
var skinPostFix = 'Skin';

function UIFile() {
    this.needGen = false;
    this.isDlg = false;
    this.vars = {};
    this.moduleBase = 'app'; // 指生成的文件相对于src的目录对应的module，目前为ui
    this.moduleName = ''; // 相对于moduleBase的module路径
    this.baseName = ''; // 目前为去除扩展名的文件名称：如ItemBag
    this.className = ''; // 目前为baseName + 'UI'
    this.inherit = '';
    this.viewMap = {};
    this.views = [];
    this.imports = {};
    this.hasEvents = false;
    this.events = {};
    this.upEvents = {}; // 临时存放需要穿透的事件，事件的名称可能为原始的名称，或加了$,$$后缀的名称
    this.eventsCollected = false // 当前组件的事件是否已经收集
    this.uiObj = null;
    this.uiObjKey = '';
    this.animationNodes = {};
    this.hasAnimations = false;
    this.dependencies = {};
    this.resUsed = {}; // 当前使用的资源，未合图时，不包括依赖对象
    this.fontUsed = {}; // 当前使用的字体，不包括依赖对象
    this.atlasUsed = {}; // 当前使用的资源，合图后，包括所有依赖对象
    this.uiResMap = {}; // 当前使用的合图资源，字体等，包括所有依赖对象
    this.uiResRef = {}; // 当前使用的资源计数，包括所有依赖对象
    this.uiResMapHandled = false; // 当前组件的使用的最终合图资源，或字体，是否已经都填充进uiResMap
    this.uiResRefHandled = false; // 当前组件的资源计数，是否已经都填充进uiResRef了
    this.guideIds = {}; //引导id
    this.upGuideIds = {};
    this.guideIdCollected = false;
    this.hasGuideId = false;
    this.openKeys = {}; //显示对象开放注册key
    this.upOpenKeys = {};
    this.soundIds = {}; //声音id
    this.openKeyCollected = false;
    this.hasOpenKey = false;
    this.hasSoundId = false;
}

UIFile.prototype.iterateObj = function(obj, callback, parent) {
    if (callback)
        callback.call(this, obj, parent);
    var children = obj.child;
    if (children) {
        var len = children.length
        for (var i = 0; i < len; i++) {
            this.iterateObj(children[i], callback, obj);
        }
    }
}

UIFile.prototype.isCellView = function() {
    return this.uiObj.type == 'CellView';
}

UIFile.prototype.getType = function(type) {
    if (this.hasImport(type))
        return type;
    var runClass = helper.getCompProp(type, 'runClass')
    if (!runClass) {
        if (type == "Image")
            runClass = "ImageView";
        else
            runClass = 'Laya.' + type;
    }
    return runClass;
}

UIFile.prototype.getSkin = function(obj) {
    if (settings.skinLabels && settings.skinLabels[obj.type])
        return settings.skinLabels[obj.type].map(skin => obj.props[skin]).filter(skin => !!skin);

    var skinLabel = helper.getCompProp(obj.type, 'skinLabel', 'styleSkin');
    var skin = obj.props[skinLabel] || obj.props['skin'];
    return skin ? [skin] : [];
}

UIFile.prototype.collectAnimationNodes = function() {
    this.iterateObj(this.uiObj, obj => {
        if (obj.animations) {
            var animations = obj.animations;
            for (var i = 0; i < animations.length; i++) {
                var nodes = animations[i].nodes;
                if (nodes && nodes.length > 0) {
                    if (!this.hasAnimations) this.hasAnimations = true;
                    for (var j = 0; j < nodes.length; j++) {
                        this.animationNodes[nodes[j].target] = true;
                    }
                }
            }
        }
    });
}

UIFile.prototype.collectVars = function() {
    this.iterateObj(this.uiObj, obj => {
        if (obj.animations) {
            var animations = obj.animations;
            for (var i = 0, n = animations.length; i < n; i++) {
                if (animations[i].nodes && animations[i].nodes.length > 0)
                    this.vars[animations[i].name] = 'Laya.FrameAnimation';
            }
        }
        if (obj.props.var) {
            this.vars[obj.props.var] = obj.props.runtime ? obj.props.runtime : this.getType(obj.type);
        }
    });
}

UIFile.prototype.collectGuideIds = function() {
    this.iterateObj(this.uiObj, (obj, parent) => {
        var name = obj.props.var;
        var guideId = "";
        if (typeof(obj.props.guideId) == "number") {
            guideId = obj.props.guideId + "";
        }

        if (!guideId && guideId == "") return;
        if (!name) {
            console.warn('component has guideId but without name, in ' + this.baseName, obj.type);
            return;
        }
        if (guideId.endsWith('$') || (!this.needGen && !this.isCellView())) {
            this.upGuideIds[name] = guideId;
        } else {
            this.hasGuideId = true;
            this.guideIds[name] = guideId.replace(/\$*$/, '');;
        }
    });
}

UIFile.prototype.collectUpGuideIds = function(uifiles) {
    if (this.guideIdCollected)
        return this.upGuideIds;

    var upGuideIds = {};
    this.iterateObj(this.uiObj, obj => {
            var name = obj.props.var;
            if (obj.type == 'UIView') {
                var uifile = uifiles.getUIFile(obj.source);
                var guideIds = uifile.collectUpGuideIds(uifiles);
                if (_.size(guideIds) > 0 && !name) {
                    console.warn('UIView has no name when handling guideId, in ' + this.baseName);
                    return;
                }
                _.each(guideIds, (guideId, key) => upGuideIds[name + '.' + key] = guideId);
            }
        })
        // 先处理本层级需要拦截的引导id
    if (this.needGen) {
        _.each(upGuideIds, (guideId, name) => {
            if (!guideId.endsWith('$$') || this.isDlg) {
                this.guideIds[name] = guideId.replace(/\$*$/, '');
                this.hasGuideId = true;
            }
        });
    }
    this.upGuideIds = _.extend(upGuideIds, this.upGuideIds);
    this.guideIdCollected = true;
    return this.upGuideIds;
}

UIFile.prototype.collectOpenKeys = function() {
    this.iterateObj(this.uiObj, (obj, parent) => {
        var name = obj.props.var;
        var openkey = obj.props.openKey;
        if (!openkey) return;
        if (!name) {
            console.warn('component has openkey but without name, in ' + this.baseName, obj.type);
            return;
        }
        if (openkey.endsWith('$') || (!this.needGen && !this.isCellView())) {
            this.upOpenKeys[name] = openkey;
        } else {
            this.hasOpenKey = true;
            this.openKeys[name] = openkey.replace(/\$*$/, '');
        }
    });
}

UIFile.prototype.collectSoundIds = function() {
    this.iterateObj(this.uiObj, (obj, parent) => {
        var name = obj.props.var;
        var soundId = obj.props.soundId;
        if (!soundId) return;
        if (!name) {
            console.warn('button has soundId but without name, in ' + this.baseName, obj.type);
            return;
        }

        this.hasSoundId = true;
        this.soundIds[name] = soundId.replace(/\$*$/, '');
    });
}

UIFile.prototype.collectUpOpenKeys = function(uifiles) {
    if (this.openKeyCollected)
        return this.upOpenKeys;

    var upOpenKeys = {};
    this.iterateObj(this.uiObj, obj => {
            var name = obj.props.var;
            if (obj.type == 'UIView') {
                var uifile = uifiles.getUIFile(obj.source);
                var openKeys = uifile.collectUpOpenKeys(uifiles);
                if (_.size(openKeys) > 0 && !name) {
                    console.warn('UIView has no name when handling openKey, in ' + this.baseName);
                    return;
                }
                _.each(openKeys, (openKey, key) => upOpenKeys[name + '.' + key] = openKey);
            }
        })
        // 先处理本层级需要拦截的openKey
    if (this.needGen) {
        _.each(upOpenKeys, (openKey, name) => {
            if (!openKey.endsWith('$$') || this.isDlg) {
                this.openKeys[name] = openKey.replace(/\$*$/, '');
                this.hasOpenKey = true;
            }
        });
    }
    this.upOpenKeys = _.extend(upOpenKeys, this.upOpenKeys);
    this.openKeyCollected = true;
    return this.upOpenKeys;
}

// 收集本视图需要处理的事件，并缓存需要穿透的事件以便稍后collectUpEvents的处理
UIFile.prototype.collectEvents = function() {
    this.iterateObj(this.uiObj, (obj, parent) => {
        var name = obj.props.var;
        var events = obj.props.events;
        if (!events)
            return;
        if (!name) {
            console.warn('component has event but without name, in ' + this.baseName, obj.type);
            return;
        }

        var events = events.split(',')
        if (_.without(events, ...allowedEvents).length > 0) {
            console.log('unknown event ' + events + ' for node ' + name + ', in ' + this.baseName);
            return;
        }
        var thisEvents = [];
        var upEvents = [];
        _.each(events, event => {
            if (event.endsWith('$') || (!this.needGen && !this.isCellView())) upEvents.push(event);
            !event.endsWith('$') && thisEvents.push(event);
        });

        if (thisEvents.length > 0) {
            this.events[name] = thisEvents;
            this.hasEvents = true;
        }
        if (upEvents.length > 0) {
            this.upEvents[name] = upEvents;
        }
        delete obj.props.events;
    });
}

// 处理需要穿透的事件, $结尾的事件穿透到邻近的View层，$$结尾的事件穿透到Dialog层
UIFile.prototype.collectUpEvents = function(uifiles) {
    if (this.eventsCollected)
        return this.upEvents;

    var upEvents = {}; // 所有关联的UIView中需要穿透的事件映射
    this.iterateObj(this.uiObj, obj => {
            var name = obj.props.var;
            if (obj.type == 'UIView') {
                var uifile = uifiles.getUIFile(obj.source);
                var events = uifile.collectUpEvents(uifiles);
                if (_.size(events) > 0 && !name) {
                    console.warn('UIView has no name when handling events, in ' + this.baseName);
                    return;
                }
                _.each(events, (event, key) => upEvents[name + '.' + key] = event.concat()); // 对于每个界面，必须复制一份event
            }
        })
        // 先处理本层级需要拦截的事件
        // if (this.needGen) {//非Dlg view 等UI文件 因当做皮肤类的需求 也需要所有非上传的事件
    _.each(upEvents, (events, name) => {
        var thisEvents = events.filter(event => !event.endsWith('$$') || this.isDlg); // event可以没有后缀，或包含$, $$后缀
        if (thisEvents.length > 0) {
            this.events[name] = thisEvents.map(event => event.replace(/\$*$/, ''));
            this.hasEvents = true;
            _.pullAll(events, thisEvents);
        }
    });
    // }
    this.upEvents = _.extend(upEvents, this.upEvents);
    _.each(this.upEvents, (events, name) => events.length == 0 && delete this.upEvents[name]);
    this.eventsCollected = true;
    return this.upEvents;
}

UIFile.prototype.hasImport = function(name) {
    return this.imports[name] != null || settings.uiimports[name] != null;
}

UIFile.prototype.collectImports = function() {
    var viewMap = this.viewMap;
    var imports = this.imports;
    for (var key in viewMap) {
        var libName = key.substring(key.lastIndexOf('.') + 1, key.length);
        imports[libName] = key;
    }
}

UIFile.prototype.fillDefaults = function() {
    this.iterateObj(this.uiObj, obj => {
        var compType = obj.type;
        if (rootCompTypes.indexOf(compType) < 0) {
            if (compType != 'UIView') {
                var skins = this.getSkin(obj);
                _.each(skins, skin => {
                    var defaultProps = helper.resStyles.getProps(skin);
                    if (defaultProps) {
                        _.mergeDefaults(obj.props, defaultProps);
                    }
                })
            } else {
                var defaultProps = helper.pageStyles.getProps(obj.source);
                if (obj.source && defaultProps) {
                    _.mergeDefaults(obj.props, defaultProps);
                }
            }
        }
        for (var key in obj.props) {
            if (adjustKeys.indexOf(key) >= 0) {
                var value = obj.props[key];
                var float = (typeof value === 'string') ? parseFloat(value).toFixed(2) : value.toFixed(2);
                var int = float | 0;
                obj.props[key] = float == int ? int : float;
            }
        }
    });
}

UIFile.prototype.collectViewMap = function() {
    this.iterateObj(this.uiObj, obj => {
        var viewMap = this.viewMap;
        var compType = obj.type;
        var runtime = obj.props.runtime;
        if (runtime) {
            if (runtime.match(/^\s/) || runtime.match(/\s$/)) {
                console.warn(`${this.baseName}中注册的runtime=${runtime}首尾含有空白字符`);
            }
            obj.props.runtime = runtime = runtime.trim();
        }
        if (compType == 'UIView') {
            this.dependencies[obj.source] = 1;
            var viewName = helper.getFileName(obj.source);
            var needAppExtend = _.some(appExtendViewPostfix, name => viewName.endsWith(name));
            viewName += needAppExtend ? '' : 'UI';
            // obj.type = viewName; // laya ide修改了type为viewName，这里保持type不变，以便postProcess能够识别UIView
            if (!runtime) {
                runtime = obj.props.runtime = this.moduleBase + '.' + path.dirname(obj.source) + '.' + viewName;
            } else {
                obj.needFillViewSkin = true; // 需要填充viewSkin皮肤，以便运行时能绑定此皮肤
            }
            var id = obj.props.var
            if (id && this.views.indexOf(id) < 0) {
                this.views.push(id)
            }
        }
        if (runtime) {
            viewMap[runtime] = runtime;
        }
    });
}

// 收集当前UI所使用的所有图片资源，字体
UIFile.prototype.collectResUsed = function() {
    this.iterateObj(this.uiObj, obj => {
        var skins = this.getSkin(obj);
        _.each(skins, skin => {
            if (this.resUsed[skin])
                this.resUsed[skin] += 1;
            else
                this.resUsed[skin] = 1;
        })
        if (obj.props.font)
            this.fontUsed[obj.props.font] = 1;
        // 处理UIView中的templateParam，首次其中引用的资源，暂时不考虑字体。
        if (obj.props.templateParam) {
            var params = obj.props.templateParam.split(',');
            _.each(params, param => {
                let extName = param.substr(param.length - 4);
                let resName = param.substr(param.indexOf('=') + 1);
                if (extName === '.png' || extName === '.jpg') {
                    if (this.resUsed[resName])
                        this.resUsed[resName] += 1;
                    else
                        this.resUsed[resName] = 1;
                }
            })
        }
    }, this);
}

// 清除运行时不需要的属性
UIFile.prototype.cleanObj = function() {
    this.iterateObj(this.uiObj, obj => {
        for (key in obj) {
            if (!neededKeys[key]) delete obj[key];
        }
        for (key in obj.props) {
            if (noNeedProps[key]) delete obj.props[key];
            if (key === 'text' || key === 'value') { // value为FontClip中使用
                var value = obj.props[key];
                if (typeof value === 'string' && value.charAt(0) === '~') {
                    if (obj.type === 'FontClip')
                        obj.props[key] = '';
                    else
                        delete obj.props[key]; // 去除设计界面上显示的临时文本
                }
            }
        }
        if (obj.child && obj.child.length == 0)
            delete obj.child;
        if (obj.compId && !this.animationNodes[obj.compId])
            delete obj.compId;
    });
    if (!this.hasAnimations) delete this.uiObj.animations;
}

UIFile.prototype.fillDependencyObj = function(uifiles) {
    var parsedFiles = uifiles.parsedFiles;
    for (var dependency in this.dependencies) {
        if (typeof this.dependencies[dependency] === 'object')
            break;
        var uifile = parsedFiles[dependency];
        if (uifile) {
            uifile.fillDependencyObj(uifiles);
            this.dependencies[dependency] = uifile;
        } else {
            console.log('unknown dependency ' + dependency + ' for ' + this.baseName);
        }
    }
}

UIFile.prototype.checkRes = function(uifiles) {
    var resMap = resmanager.getUIResMap();
    for (var res in this.resUsed) {
        if (!resMap[res]) {
            console.error(res + ' in ' + this.baseName + ' does not exists')
        }
    }
}

UIFile.prototype.collectUIResMap = function(uifiles) {
    if (this.uiResMapHandled)
        return this.uiResMap;

    var atlasMap = resmanager.getAtlasMap();
    var atlasDir = path.basename(config.atlasPath);
    var uiResMap = this.uiResMap;
    for (var res in this.resUsed) {
        var resName = atlasMap[res] ? atlasDir + '/' + atlasMap[res] : res;
        var extName = path.extname(resName);
        var isImage = extName === '.jpg' || extName === '.png';
        if (isImage && resName.indexOf('.e.') > 0 || extName === '.st' || extName === '.atlas' || (extName === ".json" && !resName.startsWith("ani.d"))) {
            uiResMap[resName] = helper.getResLoaderType(extName);
        } else if (extName === '.png' && !/\.d[\.\/]/.test(resName)) {
            console.warn(`${res} is not packed into atlas in ${this.baseName}`);
        }
    }
    var fontMap = resmanager.getFontMap();
    for (var font in this.fontUsed) {
        var fontFile = fontMap[font];

        if (fontFile) {
            var loaderType = helper.getResLoaderType(path.extname(fontFile));
            uiResMap[fontFile] = loaderType;
        }
        // else if (font != 'SimHei') {
        //     console.warn(`font ${font} not found in ${this.baseName}`);
        // }
    }
    for (var dependency in this.dependencies) {
        var uifile = this.dependencies[dependency];
        var resItems = uifile.collectUIResMap(uifiles);
        _.each(resItems, (type, res) => uiResMap[res] = type);
    }
    this.uiResMapHandled = true;
    return uiResMap;
}

UIFile.prototype.collectUIResRef = function(uifiles) {
    if (this.uiResRefHandled)
        return this.uiResRef;

    var atlasMap = resmanager.getAtlasMap();
    var atlasDir = path.basename(config.atlasPath);
    var uiResRef = this.uiResRef;
    for (var res in this.resUsed) {
        var resName = atlasMap[res] ? atlasDir + '/' + atlasMap[res] : res;
        var extName = path.extname(resName);
        var isImage = extName === '.jpg' || extName === '.png';
        if (isImage || extName === '.st' || extName === '.atlas' || extName == ".json") {
            if (uiResRef[resName])
                uiResRef[resName] += this.resUsed[res];
            else
                uiResRef[resName] = this.resUsed[res];
        }
    }
    var fontMap = resmanager.getFontMap();
    for (var font in this.fontUsed) {
        var fontFile = fontMap[font];

        if (fontFile) {
            uiResRef[fontFile] = 1;
        }
    }
    for (var dependency in this.dependencies) {
        var uifile = this.dependencies[dependency];
        var resItems = uifile.collectUIResRef(uifiles);
        _.each(resItems, (count, res) => {
            if (uiResRef[res])
                uiResRef[res] += count;
            else
                uiResRef[res] = count;
        });
    }
    this.uiResRefHandled = true;
    return uiResRef;
}

UIFile.prototype.fillViewSkin = function(uifiles) {
    this.iterateObj(this.uiObj, obj => {
        if (obj.type == 'UIView' && obj.needFillViewSkin) {
            var uifile = uifiles.getUIFile(obj.source);
            obj.props.viewSkin = uifile.moduleName + '.' + uifile.className;
        }
    })
}

UIFile.prototype.parse = function(fileName) {
    var content = fs.readFileSync(path.join(config.pagesPath, fileName), 'utf8');
    var obj = this.uiObj = JSON.parse(content);
    if ('exportUI' in obj.props && !obj.props.exportUI) {
        return false;
    }
    this.moduleName = helper.getModuleName(fileName);
    this.baseName = helper.getFileName(fileName);
    this.isDlg = this.baseName.endsWith(dlgPostFix);
    this.needGen = _.some(appExtendViewPostfix, name => this.baseName.endsWith(name));
    this.className = this.baseName + 'UI';

    var md5 = crypto.createHash('md5');
    this.uiObjKey = md5.update(`app.${this.moduleName}.${this.className}`).digest('hex');
    this.fillDefaults();
    this.collectEvents(); //由于用到UIView的判断，需要在collectViewMap之前调用
    this.collectGuideIds();
    this.collectOpenKeys();
    this.collectSoundIds();
    this.collectViewMap(); // 这一步会把type为UIView的节点改成真正的类型
    this.collectImports();
    this.collectVars();
    this.collectAnimationNodes();
    this.collectResUsed();
    this.inherit = this.getType(obj.type);
    return true;
}

UIFile.prototype.postProcess = function(uifiles) {
    this.fillDependencyObj(uifiles);
    this.collectUpEvents(uifiles);
    this.collectUpGuideIds(uifiles);
    this.collectUpOpenKeys(uifiles);
    this.checkRes(uifiles);
    this.collectUIResMap(uifiles);
    this.collectUIResRef(uifiles);
    this.fillViewSkin(uifiles);
    this.cleanObj();
}

UIFile.prototype.export = function() {
    var result;
    dust.render('uifile', this, function(err, out) {
        if (err) return console.log(err);
        result = out;
    });
    return result;
}

module.exports = UIFile;