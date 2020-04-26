(function (window, document, Laya) {
    var __un = Laya.un, __uns = Laya.uns, __static = Laya.static, __class = Laya.class, __getset = Laya.getset, __newvec = Laya.__newvec;
    var ResFileManager = laya.ide.managers.ResFileManager,
        FileTools = laya.ide.devices.FileTools,
        FontLoader = laya.ide.managers.FontLoader,
        Graphics = laya.display.Graphics,
        Texture = laya.resource.Texture,
        Text = laya.display.Text,
        Loader = laya.net.Loader,
        BitmapFont = laya.display.BitmapFont;

    console.log('this is customUI.js');

    String.prototype.format = function () {
        let str = this.toString();
        let seq = 0;
        str = str.replace(/(%s|%d|%%)/g, (match) => {
            return match === '%%' ? '%' : `{${seq++}}`
        });
        if (!arguments.length)
            return str;
        let argType = typeof arguments[0];
        let args = (("string" == argType || "number" == argType) ? arguments : arguments[0]);
        for (let arg in args)
            str = str.replace(RegExp("\\{" + arg + "\\}", "gi"), args[arg]);
        return str;
    }

    // 修正scaleX为-1时的问题
    Laya.Component.prototype.resetLayoutX = function () {
        var parent = this.parent;
        if (parent) {
            var layout = this._layout;
            var scaleX = this.scaleX < 0 ? -this.scaleX : this.scaleX;
            var displayWidth = this.width * scaleX;
            if (!isNaN(layout.anchorX)) this.pivotX = layout.anchorX * this.width;
            var adjust = !isNaN(this.pivotX) ? this.pivotX * scaleX : 0;
            if (!isNaN(layout.centerX)) {
                this.x = (parent.width - displayWidth) * 0.5 + layout.centerX + adjust;
            } else if (!isNaN(layout.left)) {
                this.x = layout.left + adjust;
                if (!isNaN(layout.right)) {
                    this.width = (parent._width - layout.left - layout.right) / (scaleX || 0.01);
                }
            } else if (!isNaN(layout.right)) {
                this.x = parent.width - displayWidth - layout.right + adjust;
            }
        }
    }

    // 修正scaleX为-1时的问题
    Laya.Component.prototype.resetLayoutY = function () {
        var parent = this.parent;
        if (parent) {
            var layout = this._layout;
            var scaleY = this.scaleY < 0 ? -this.scaleY : this.scaleY;
            var displayHeight = this.height * scaleY;
            if (!isNaN(layout.anchorY)) this.pivotY = layout.anchorY * this.height;
            var adjust = !isNaN(this.pivotY) ? Math.abs(this.pivotY * scaleY) : 0;
            if (!isNaN(layout.centerY)) {
                this.y = (parent.height - displayHeight) * 0.5 + layout.centerY + adjust;
            } else if (!isNaN(layout.top)) {
                this.y = layout.top + adjust;
                if (!isNaN(layout.bottom)) {
                    this.height = (parent._height - layout.top - layout.bottom) / (scaleY || 0.01);
                }
            } else if (!isNaN(layout.bottom)) {
                this.y = parent.height - displayHeight - layout.bottom + adjust;
            }
        }
    }

    function applyTemplateParam(uiView) {
        var param = uiView.templateParam;
        if (!param) return;
        try {
            params = param.split(',');
            params.forEach(param => {
                var keyValue = param.split('=');
                var nameProp = keyValue[0].split('.');
                var v = getChildByTemplateVar(uiView, nameProp[0]);
                if (v) {
                    var num = +keyValue[1];
                    v[nameProp[1]] = num.toString() == keyValue[1] ? num : keyValue[1];
                }
            })
        } catch (e) {
            console.log('templateParam error: ' + param + ', ' + e.message);
        }

        function getChildByTemplateVar(view, varName) {
            for (var i = 0, n = view.numChildren; i < n; i++) {
                var child = view.getChildAt(i)
                if (child.templateVar && child.templateVar == varName) {
                    return child;
                }
                if (child = getChildByTemplateVar(child, varName))
                    return child;
            }
            return null;
        }
    }

    var UIView = laya.editor.core.UIView;
    __getset(0, UIView.prototype, "templateParam", function () {
        return this._templateParam;
    }, function (value) {
        this._templateParam = value;
        applyTemplateParam(this);
    });

    var oldCreateComp = UIView.prototype.createComp;
    UIView.prototype.createComp = function (xml, comp, visibleMap) {
        let comp1 = oldCreateComp.call(this, xml, comp, visibleMap);
        if (xml.props && xml.props.var)
            comp1.templateVar = xml.props.var;
        return comp1;
    }

    FontLoader.loadFont = function (loader) {
        var url = loader.url.replace('.font', '.fnt');
        var fontName = FileTools.getFileName(url);
        ResFileManager.clearRes(url);
        ResFileManager.clearRes(url.replace('.fnt', '.png'));
        getAtlas(url, function (err, data, tex) {
            if (err || !data.frames) return;
            var font = new BitmapFont();
            font._texture = tex;
            for (var char in data.frames) {
                var frame = data.frames[char];
                font._maxWidth = Math.max(font._maxWidth, frame.sourceW);
                font._fontCharDic[char] = Texture.create(tex, frame.x, frame.y, frame.w, frame.h, frame.offX, frame.offY, frame.sourceW, frame.sourceH);
                font._fontWidthMap[char] = frame.sourceW;
            }
            FontLoader.loadFontComplete(loader, fontName, font);
        })
    }
    Loader.parserMap["Font"] = FontLoader.loadFont;

    BitmapFont.prototype.getCharWidth = function (char) {
        if (this._fontWidthMap[char]) return this._fontWidthMap[char] + this.letterSpacing;
        if (char === ' ') return this._spaceWidth + this.letterSpacing;
        return 0;
    }

    BitmapFont.prototype.getCharTexture = function (char) {
        return this._fontCharDic[char];
    }

    function getAtlas(url, cb) {
        try {
            var data = JSON.parse(fs.readFileSync(ResFileManager.formatURL(url)));
            var tex = ResFileManager.getRes(url.replace('.json', '.png'));
            if (!data || !tex)
                return cb('read error');
            return cb(null, data, tex);
        } catch (e) {
            return cb('read error');
        }
    }

    __getset(0, laya.editorUI.Label.prototype, 'format', function () {
        return this._format;
    }, function (value) {
        this._format = value;
        if (this._value) {
            this.text = this._format ? this._format.format(typeof this._value === 'string' ? this._value.split(',') : this._value) : this._value.toString();
        }
    });

    __getset(0, laya.editorUI.Label.prototype, 'value', function () {
        return this._value;
    }, function (value) {
        this._value = value;
        if (this._format) {
            this.text = this._format.format(typeof value === 'string' ? value.split(',') : value);
        } else {
            this.text = value.toString();
        }
    });

    var Button = (function (_super) {
        function Button(skin, label) {
            (label === void 0) && (label = "");
            Button.__super.call(this, skin, label);
        }

        __class(Button, 'laya.customUI.Button', _super);
        var __proto = Button.prototype;

        __getset(0, __proto, 'image', function () {
            return this._image ? this._image.skin : "";
        }, function (v) {
            if (!this._image) {
                var img = this._image = new laya.editorUI.Image();
                img.centerX = img.centerY = 0;
                this.addChild(img);
            }
            this._image.skin = v;
        });

        __proto.changeClips = function () {
            if(!this._skin){
                console.log("null skin", this._skin);
                return;
            }
            var img = Laya.Loader.getRes(this._skin);
            if (!img) {
                console.log("lose skin", this._skin);
                return;
            };
            var width = img.sourceWidth;
            var height = img.sourceHeight;
            var clips = null;
            if (clips) this._sources = clips;
            else {
                this._sources = [img];
                var imgDownSkin = this.getStateRes(this._skin, 'down');
                var imgSelectSkin = this.getStateRes(this._skin, 'select');
                var imgDownUrl = ResFileManager.formatURL(imgDownSkin);
                var imgSelectUrl = ResFileManager.formatURL(imgSelectSkin);

                var imgDown = fs.existsSync(imgDownUrl) ? Laya.Loader.getRes(imgDownSkin) : null;
                var imgSelect = fs.existsSync(imgSelectUrl) ? Laya.Loader.getRes(imgSelectSkin) : null;
                if (imgDown) this._sources.push(imgDown);
                if (imgSelect) {
                    !imgDown && this._sources.push(img); // 如果有3态，且没有Down状态，则补充down状态
                    this._sources.push(imgSelect);
                }
                this._stateNum = this._sources.length;
            }
            if (this._autoSize) {
                this._bitmap.width = this._width || width;
                this._bitmap.height = this._height || height;
                if (this._text) {
                    this._text.width = this._bitmap.width;
                    this._text.height = this._bitmap.height;
                }
            } else {
                this._text && (this._text.x = width);
            }
        }

        __proto.changeState = function () {
            this._stateChanged = false;
            this.runCallLater(this.changeClips);
            var stateNum = this._sources ? this._sources.length : 1;
            var index = this._state < stateNum ? this._state : stateNum - 1;
            if (this._sources) {
                var source = this._sources[index];
                this._bitmap.source = source;
                if (this._autoSize) {
                    this._bitmap.width = this._width || source.sourceWidth;
                    this._bitmap.height = this._height || source.sourceHeight;
                    this.changeSize();
                }
            }
            if (this.label) {
                this._text.color = this._labelColors[index];
                if (this._strokeColors) this._text.strokeColor = this._strokeColors[index];
            }
        }

        __proto.getStateRes = function (res, state) {
            var pos = res.lastIndexOf('.');
            if (pos < 0)
                return res;
            return res.substr(0, pos) + '$' + state + res.substr(pos);
        }

        return Button;
    })(laya.editorUI.Button);

    var List = (function (_super) {
        function List() {
            List.__super.call(this);
        }

        __class(List, 'laya.customUI.List', _super);
        var __proto = List.prototype;

        __getset(0, __proto, 'isAdjustWidth', function () {
            return this._isAdjustWidth;
        }, function (v) {
            this._isAdjustWidth = v;
            this.adjustWidth();
        });

        __proto.adjustWidth = function () {
            if (this._isAdjustWidth && !this.width) {
                let startX = this._offset.x || 0;
                let len = this.array ? this.array.length : 0;
                let col = len > this.repeatX ? this.repeatX : len;
                let space = this.spaceX;
                this.width = Math.min(this.cellWidth * col + (col - 1) * space + startX * 2, this.width);
            }
        }

        return List;
    })(laya.editorUI.List);

    var AniView = (function (_super) {
        function AniView() {
            AniView.__super.call(this);
            var ani = this.ani = new laya.display.Animation();
            ani.autoPlay = false;
            this.addChild(ani);
        }
        __class(AniView, 'laya.customUI.AniView', _super);
        var __proto = AniView.prototype;
        __getset(0, __proto, 'skin', function () {
            return this._skin;
        }, function (v) {
            this._skin = v;
            getAtlas(v, (err, data, tex) => {
                if (err) return;
                var mc;
                for (name in data.mc) {
                    var mcData = data.mc[name];
                    this.ani.interval = 1000 / mcData.frameRate;
                    if (mcData.scale) {
                        this.ani.scaleX = this.ani.scaleX < 0 ? -parseFloat(mcData.scale) : parseFloat(mcData.scale);
                        this.ani.scaleY = this.ani.scaleY < 0 ? -parseFloat(mcData.scale) : parseFloat(mcData.scale);
                    }
                    break;
                }
                var mcFrames = [];
                var frameCount = mcData.frames.length;
                for (var i = 0; i < frameCount; i++) {
                    var frame = mcData.frames[i];
                    var resData = data.res[frame.res];
                    var tex1 = Laya.Texture.create(tex, resData.x, resData.y, resData.w, resData.h, frame.x, frame.y)
                    var g = new Graphics();
                    g.drawTexture(tex1, 0, 0);
                    mcFrames.push(g)
                }
                var width = 0, height = 0;
                for (var name in data.res) {
                    let res = data.res[name]
                    width = Math.max(width, res.w);
                    height = Math.max(height, res.h);
                }
                this.width = this.width || width * this.ani.scaleX;
                this.height = this.height || height * this.ani.scaleY;
                this.ani.x = this.width / 2;
                this.ani.y = this.height / 2;
                this.ani.frames = mcFrames;
            })
        });
        __getset(0, __proto, 'autoPlay', function () {
            return this.ani.autoPlay;
        }, function (v) {
            this.ani.autoPlay = v;
        });
        __getset(0, __proto, 'loopCount', function () {
            return this._loopCount || 0;
        }, function (v) {
            this._loopCount = v;
        });
        __getset(0, __proto, 'autoRemove', function () {
            return this._autoRemove || false;
        }, function (v) {
            this._autoRemove = v;
        });
        return AniView;
    })(laya.editorUI.Component);

    var __proto = Laya.Templet.prototype;

    __proto.onComplete = function () {
        if (this._isDestroyed) {
            this.destroy();
            return;
        };
        var tSkBuffer = Loader.getRes(this._skBufferUrl);
        if (!tSkBuffer) {
            this.event(/*laya.events.Event.ERROR*/"error", "load failed:" + this._skBufferUrl);
            return;
        }
        this._path = path.dirname(this._skBufferUrl);
        this.parseData(null, tSkBuffer);
    }

    __proto._parseTexturePath = function () {
        if (this._isDestroyed) {
            this.destroy();
            return;
        };
        var i = 0;
        this._loadList = [];
        var tByte = new Laya.Byte(this.getPublicExtData());
        var tX = 0, tY = 0, tWidth = 0, tHeight = 0;
        var tFrameX = 0, tFrameY = 0, tFrameWidth = 0, tFrameHeight = 0;
        var tTempleData = 0;
        var tTextureLen = tByte.getInt32();
        var tTextureName = tByte.readUTFString();
        var tTextureNameArr = tTextureName.split("\n");
        var tTexture;
        var tSrcTexturePath;
        for (i = 0; i < tTextureLen; i++) {
            tSrcTexturePath = path.join(this._path, tTextureNameArr[i * 2]);
            tTextureName = tTextureNameArr[i * 2 + 1];
            tX = tByte.getFloat32();
            tY = tByte.getFloat32();
            tWidth = tByte.getFloat32();
            tHeight = tByte.getFloat32();
            tTempleData = tByte.getFloat32();
            tFrameX = isNaN(tTempleData) ? 0 : tTempleData;
            tTempleData = tByte.getFloat32();
            tFrameY = isNaN(tTempleData) ? 0 : tTempleData;
            tTempleData = tByte.getFloat32();
            tFrameWidth = isNaN(tTempleData) ? tWidth : tTempleData;
            tTempleData = tByte.getFloat32();
            tFrameHeight = isNaN(tTempleData) ? tHeight : tTempleData;
            if (this._loadList.indexOf(tSrcTexturePath) == -1) {
                this._loadList.push(tSrcTexturePath);
            }
        }
        Laya.loader.load(this._loadList, Laya.Handler.create(this, this._textureComplete));
    }

    __proto._parsePublicExtData = function () {
        var i = 0, j = 0, k = 0, l = 0, n = 0;
        for (i = 0, n = this.getAnimationCount(); i < n; i++) {
            this._graphicsCache.push([]);
        };
        var isSpine = false;
        isSpine = this._aniClassName != "Dragon";
        var tByte = new Laya.Byte(this.getPublicExtData());
        var tX = 0, tY = 0, tWidth = 0, tHeight = 0;
        var tFrameX = 0, tFrameY = 0, tFrameWidth = 0, tFrameHeight = 0;
        var tTempleData = 0;
        var tTextureLen = tByte.getInt32();
        var tTextureName = tByte.readUTFString();
        var tTextureNameArr = tTextureName.split("\n");
        var tTexture;
        var tSrcTexturePath;
        for (i = 0; i < tTextureLen; i++) {
            tTexture = this._mainTexture;
            tSrcTexturePath = path.join(this._path, tTextureNameArr[i * 2]);
            tTextureName = tTextureNameArr[i * 2 + 1];
            if (this._mainTexture == null) {
                tTexture = this._textureDic[tSrcTexturePath];
            }
            if (!tTexture) {
                this.event("error", this);
                this.isParseFail = true;
                return;
            }
            tX = tByte.getFloat32();
            tY = tByte.getFloat32();
            tWidth = tByte.getFloat32();
            tHeight = tByte.getFloat32();
            tTempleData = tByte.getFloat32();
            tFrameX = isNaN(tTempleData) ? 0 : tTempleData;
            tTempleData = tByte.getFloat32();
            tFrameY = isNaN(tTempleData) ? 0 : tTempleData;
            tTempleData = tByte.getFloat32();
            tFrameWidth = isNaN(tTempleData) ? tWidth : tTempleData;
            tTempleData = tByte.getFloat32();
            tFrameHeight = isNaN(tTempleData) ? tHeight : tTempleData;
            this.subTextureDic[tTextureName] = Texture.create(tTexture, tX, tY, tWidth, tHeight, -tFrameX, -tFrameY, tFrameWidth, tFrameHeight);
        }
        this._mainTexture = tTexture;
        var tAniCount = tByte.getUint16();
        var tSectionArr;
        for (i = 0; i < tAniCount; i++) {
            tSectionArr = [];
            tSectionArr.push(tByte.getUint16());
            tSectionArr.push(tByte.getUint16());
            tSectionArr.push(tByte.getUint16());
            tSectionArr.push(tByte.getUint16());
            this.aniSectionDic[i] = tSectionArr;
        };
        var tBone;
        var tParentBone;
        var tName;
        var tParentName;
        var tBoneLen = tByte.getInt16();
        var tBoneDic = {};
        var tRootBone;
        for (i = 0; i < tBoneLen; i++) {
            tBone = new Laya.Bone();
            if (i == 0) {
                tRootBone = tBone;
            } else {
                tBone.root = tRootBone;
            }
            tBone.d = isSpine ? -1 : 1;
            tName = tByte.readUTFString();
            tParentName = tByte.readUTFString();
            tBone.length = tByte.getFloat32();
            if (tByte.getByte() == 1) {
                tBone.inheritRotation = false;
            }
            if (tByte.getByte() == 1) {
                tBone.inheritScale = false;
            }
            tBone.name = tName;
            if (tParentName) {
                tParentBone = tBoneDic[tParentName];
                if (tParentBone) {
                    tParentBone.addChild(tBone);
                } else {
                    this.mRootBone = tBone;
                }
            }
            tBoneDic[tName] = tBone;
            this.mBoneArr.push(tBone);
        }
        this.tMatrixDataLen = tByte.getUint16();
        var tLen = tByte.getUint16();
        var parentIndex = 0;
        var boneLength = Math.floor(tLen / this.tMatrixDataLen);
        var tResultTransform;
        var tMatrixArray = this.srcBoneMatrixArr;
        for (i = 0; i < boneLength; i++) {
            tResultTransform = new Laya.Transform();
            tResultTransform.scX = tByte.getFloat32();
            tResultTransform.skX = tByte.getFloat32();
            tResultTransform.skY = tByte.getFloat32();
            tResultTransform.scY = tByte.getFloat32();
            tResultTransform.x = tByte.getFloat32();
            tResultTransform.y = tByte.getFloat32();
            if (this.tMatrixDataLen === 8) {
                tResultTransform.skewX = tByte.getFloat32();
                tResultTransform.skewY = tByte.getFloat32();
            }
            tMatrixArray.push(tResultTransform);
            tBone = this.mBoneArr[i];
            tBone.transform = tResultTransform;
        };
        var tIkConstraintData;
        var tIkLen = tByte.getUint16();
        var tIkBoneLen = 0;
        for (i = 0; i < tIkLen; i++) {
            tIkConstraintData = new Laya.IkConstraintData();
            tIkBoneLen = tByte.getUint16();
            for (j = 0; j < tIkBoneLen; j++) {
                tIkConstraintData.boneNames.push(tByte.readUTFString());
                tIkConstraintData.boneIndexs.push(tByte.getInt16());
            }
            tIkConstraintData.name = tByte.readUTFString();
            tIkConstraintData.targetBoneName = tByte.readUTFString();
            tIkConstraintData.targetBoneIndex = tByte.getInt16();
            tIkConstraintData.bendDirection = tByte.getFloat32();
            tIkConstraintData.mix = tByte.getFloat32();
            tIkConstraintData.isSpine = isSpine;
            this.ikArr.push(tIkConstraintData);
        };
        var tTfConstraintData;
        var tTfLen = tByte.getUint16();
        var tTfBoneLen = 0;
        for (i = 0; i < tTfLen; i++) {
            tTfConstraintData = new Laya.TfConstraintData();
            tTfBoneLen = tByte.getUint16();
            for (j = 0; j < tTfBoneLen; j++) {
                tTfConstraintData.boneIndexs.push(tByte.getInt16());
            }
            tTfConstraintData.name = tByte.getUTFString();
            tTfConstraintData.targetIndex = tByte.getInt16();
            tTfConstraintData.rotateMix = tByte.getFloat32();
            tTfConstraintData.translateMix = tByte.getFloat32();
            tTfConstraintData.scaleMix = tByte.getFloat32();
            tTfConstraintData.shearMix = tByte.getFloat32();
            tTfConstraintData.offsetRotation = tByte.getFloat32();
            tTfConstraintData.offsetX = tByte.getFloat32();
            tTfConstraintData.offsetY = tByte.getFloat32();
            tTfConstraintData.offsetScaleX = tByte.getFloat32();
            tTfConstraintData.offsetScaleY = tByte.getFloat32();
            tTfConstraintData.offsetShearY = tByte.getFloat32();
            this.tfArr.push(tTfConstraintData);
        };
        var tPathConstraintData;
        var tPathLen = tByte.getUint16();
        var tPathBoneLen = 0;
        for (i = 0; i < tPathLen; i++) {
            tPathConstraintData = new Laya.PathConstraintData();
            tPathConstraintData.name = tByte.readUTFString();
            tPathBoneLen = tByte.getUint16();
            for (j = 0; j < tPathBoneLen; j++) {
                tPathConstraintData.bones.push(tByte.getInt16());
            }
            tPathConstraintData.target = tByte.readUTFString();
            tPathConstraintData.positionMode = tByte.readUTFString();
            tPathConstraintData.spacingMode = tByte.readUTFString();
            tPathConstraintData.rotateMode = tByte.readUTFString();
            tPathConstraintData.offsetRotation = tByte.getFloat32();
            tPathConstraintData.position = tByte.getFloat32();
            tPathConstraintData.spacing = tByte.getFloat32();
            tPathConstraintData.rotateMix = tByte.getFloat32();
            tPathConstraintData.translateMix = tByte.getFloat32();
            this.pathArr.push(tPathConstraintData);
        };
        var tDeformSlotLen = 0;
        var tDeformSlotDisplayLen = 0;
        var tDSlotIndex = 0;
        var tDAttachment;
        var tDeformTimeLen = 0;
        var tDTime = NaN;
        var tDeformVecticesLen = 0;
        var tDeformAniData;
        var tDeformSlotData;
        var tDeformSlotDisplayData;
        var tDeformVectices;
        var tDeformAniLen = tByte.getInt16();
        for (i = 0; i < tDeformAniLen; i++) {
            var tDeformSkinLen = tByte.getUint8();
            var tSkinDic = {};
            this.deformAniArr.push(tSkinDic);
            for (var f = 0; f < tDeformSkinLen; f++) {
                tDeformAniData = new Laya.DeformAniData();
                tDeformAniData.skinName = tByte.getUTFString();
                tSkinDic[tDeformAniData.skinName] = tDeformAniData;
                tDeformSlotLen = tByte.getInt16();
                for (j = 0; j < tDeformSlotLen; j++) {
                    tDeformSlotData = new Laya.DeformSlotData();
                    tDeformAniData.deformSlotDataList.push(tDeformSlotData);
                    tDeformSlotDisplayLen = tByte.getInt16();
                    for (k = 0; k < tDeformSlotDisplayLen; k++) {
                        tDeformSlotDisplayData = new Laya.DeformSlotDisplayData();
                        tDeformSlotData.deformSlotDisplayList.push(tDeformSlotDisplayData);
                        tDeformSlotDisplayData.slotIndex = tDSlotIndex = tByte.getInt16();
                        tDeformSlotDisplayData.attachment = tDAttachment = tByte.getUTFString();
                        tDeformTimeLen = tByte.getInt16();
                        for (l = 0; l < tDeformTimeLen; l++) {
                            if (tByte.getByte() == 1) {
                                tDeformSlotDisplayData.tweenKeyList.push(true);
                            } else {
                                tDeformSlotDisplayData.tweenKeyList.push(false);
                            }
                            tDTime = tByte.getFloat32();
                            tDeformSlotDisplayData.timeList.push(tDTime);
                            tDeformVectices = [];
                            tDeformSlotDisplayData.vectices.push(tDeformVectices);
                            tDeformVecticesLen = tByte.getInt16();
                            for (n = 0; n < tDeformVecticesLen; n++) {
                                tDeformVectices.push(tByte.getFloat32());
                            }
                        }
                    }
                }
            }
        };
        var tDrawOrderArr;
        var tDrawOrderAniLen = tByte.getInt16();
        var tDrawOrderLen = 0;
        var tDrawOrderData;
        var tDoLen = 0;
        for (i = 0; i < tDrawOrderAniLen; i++) {
            tDrawOrderLen = tByte.getInt16();
            tDrawOrderArr = [];
            for (j = 0; j < tDrawOrderLen; j++) {
                tDrawOrderData = new Laya.DrawOrderData();
                tDrawOrderData.time = tByte.getFloat32();
                tDoLen = tByte.getInt16();
                for (k = 0; k < tDoLen; k++) {
                    tDrawOrderData.drawOrder.push(tByte.getInt16());
                }
                tDrawOrderArr.push(tDrawOrderData);
            }
            this.drawOrderAniArr.push(tDrawOrderArr);
        };
        var tEventArr;
        var tEventAniLen = tByte.getInt16();
        var tEventLen = 0;
        var tEventData;
        for (i = 0; i < tEventAniLen; i++) {
            tEventLen = tByte.getInt16();
            tEventArr = [];
            for (j = 0; j < tEventLen; j++) {
                tEventData = new Laya.EventData();
                tEventData.name = tByte.getUTFString();
                tEventData.intValue = tByte.getInt32();
                tEventData.floatValue = tByte.getFloat32();
                tEventData.stringValue = tByte.getUTFString();
                tEventData.time = tByte.getFloat32();
                tEventArr.push(tEventData);
            }
            this.eventAniArr.push(tEventArr);
        };
        var tAttachmentLen = tByte.getInt16();
        if (tAttachmentLen > 0) {
            this.attachmentNames = [];
            for (i = 0; i < tAttachmentLen; i++) {
                this.attachmentNames.push(tByte.getUTFString());
            }
        };
        var tBoneSlotLen = tByte.getInt16();
        var tDBBoneSlot;
        var tDBBoneSlotArr;
        for (i = 0; i < tBoneSlotLen; i++) {
            tDBBoneSlot = new Laya.BoneSlot();
            tDBBoneSlot.name = tByte.readUTFString();
            tDBBoneSlot.parent = tByte.readUTFString();
            tDBBoneSlot.attachmentName = tByte.readUTFString();
            tDBBoneSlot.srcDisplayIndex = tDBBoneSlot.displayIndex = tByte.getInt16();
            tDBBoneSlot.templet = this;
            this.boneSlotDic[tDBBoneSlot.name] = tDBBoneSlot;
            tDBBoneSlotArr = this.bindBoneBoneSlotDic[tDBBoneSlot.parent];
            if (tDBBoneSlotArr == null) {
                this.bindBoneBoneSlotDic[tDBBoneSlot.parent] = tDBBoneSlotArr = [];
            }
            tDBBoneSlotArr.push(tDBBoneSlot);
            this.boneSlotArray.push(tDBBoneSlot);
        };
        var tNameString = tByte.readUTFString();
        var tNameArray = tNameString.split("\n");
        var tNameStartIndex = 0;
        var tSkinDataLen = tByte.getUint8();
        var tSkinData, tSlotData, tDisplayData;
        var tSlotDataLen = 0, tDisplayDataLen = 0;
        var tUvLen = 0, tWeightLen = 0, tTriangleLen = 0, tVerticeLen = 0, tLengthLen = 0;
        for (i = 0; i < tSkinDataLen; i++) {
            tSkinData = new Laya.SkinData();
            tSkinData.name = tNameArray[tNameStartIndex++];
            tSlotDataLen = tByte.getUint8();
            for (j = 0; j < tSlotDataLen; j++) {
                tSlotData = new Laya.SlotData();
                tSlotData.name = tNameArray[tNameStartIndex++];
                tDBBoneSlot = this.boneSlotDic[tSlotData.name];
                tDisplayDataLen = tByte.getUint8();
                for (k = 0; k < tDisplayDataLen; k++) {
                    tDisplayData = new Laya.SkinSlotDisplayData();
                    this.skinSlotDisplayDataArr.push(tDisplayData);
                    tDisplayData.name = tNameArray[tNameStartIndex++];
                    tDisplayData.attachmentName = tNameArray[tNameStartIndex++];
                    tDisplayData.transform = new Laya.Transform();
                    tDisplayData.transform.scX = tByte.getFloat32();
                    tDisplayData.transform.skX = tByte.getFloat32();
                    tDisplayData.transform.skY = tByte.getFloat32();
                    tDisplayData.transform.scY = tByte.getFloat32();
                    tDisplayData.transform.x = tByte.getFloat32();
                    tDisplayData.transform.y = tByte.getFloat32();
                    tSlotData.displayArr.push(tDisplayData);
                    tDisplayData.width = tByte.getFloat32();
                    tDisplayData.height = tByte.getFloat32();
                    tDisplayData.type = tByte.getUint8();
                    tDisplayData.verLen = tByte.getUint16();
                    tBoneLen = tByte.getUint16();
                    if (tBoneLen > 0) {
                        tDisplayData.bones = [];
                        for (l = 0; l < tBoneLen; l++) {
                            var tBoneId = tByte.getUint16();
                            tDisplayData.bones.push(tBoneId);
                        }
                    }
                    tUvLen = tByte.getUint16();
                    if (tUvLen > 0) {
                        tDisplayData.uvs = [];
                        for (l = 0; l < tUvLen; l++) {
                            tDisplayData.uvs.push(tByte.getFloat32());
                        }
                    }
                    tWeightLen = tByte.getUint16();
                    if (tWeightLen > 0) {
                        tDisplayData.weights = [];
                        for (l = 0; l < tWeightLen; l++) {
                            tDisplayData.weights.push(tByte.getFloat32());
                        }
                    }
                    tTriangleLen = tByte.getUint16();
                    if (tTriangleLen > 0) {
                        tDisplayData.triangles = [];
                        for (l = 0; l < tTriangleLen; l++) {
                            tDisplayData.triangles.push(tByte.getUint16());
                        }
                    }
                    tVerticeLen = tByte.getUint16();
                    if (tVerticeLen > 0) {
                        tDisplayData.vertices = [];
                        for (l = 0; l < tVerticeLen; l++) {
                            tDisplayData.vertices.push(tByte.getFloat32());
                        }
                    }
                    tLengthLen = tByte.getUint16();
                    if (tLengthLen > 0) {
                        tDisplayData.lengths = [];
                        for (l = 0; l < tLengthLen; l++) {
                            tDisplayData.lengths.push(tByte.getFloat32());
                        }
                    }
                }
                tSkinData.slotArr.push(tSlotData);
            }
            this.skinDic[tSkinData.name] = tSkinData;
            this.skinDataArray.push(tSkinData);
        };
        var tReverse = tByte.getUint8();
        if (tReverse == 1) {
            this.yReverseMatrix = new Laya.Matrix(1, 0, 0, -1, 0, 0);
            if (tRootBone) {
                tRootBone.setTempMatrix(this.yReverseMatrix);
            }
        } else {
            if (tRootBone) {
                tRootBone.setTempMatrix(new Laya.Matrix());
            }
        }
        this.showSkinByIndex(this.boneSlotDic, 0);
        this.isParserComplete = true;
        this.event("complete", this);
    }

    var SpineView = (function (_super) {
        function SpineView() {
            SpineView.__super.call(this);
            this._factory = new Laya.Templet();
        }

        __class(SpineView, 'laya.customUI.SpineView', _super);
        var __proto = SpineView.prototype;

        __getset(0, __proto, 'aniName', function () {
            return this._aniName;
        }, function (v) {
            this._aniName = v;
            if (this._armature) this._armature.play(this._aniName || 0, true);
        });

        __getset(0, __proto, 'source', function () {
            return this._source || false;
        }, function (v) {
            if (this._source == v)
                return;

            this._source = v;
            if (this._factory) {
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
            if (v.indexOf('.sk') > -1) {
                this._factory = new Laya.Templet();
                this._factory.once(Laya.Event.ERROR, this, function () { });
                this._factory.once(Laya.Event.COMPLETE, this, function () {
                    this._armature = this._factory.buildArmature(0);
                    this._armature.x = 0;
                    this._armature.y = 0;
                    this.addChild(this._armature);
                    this._armature.play(this._aniName || 0, true);
                    this._armature.playbackRate(1);
                });
                this._factory.loadAni(ResFileManager.formatURL(v));
            }
        });

        return SpineView;
    })(laya.editorUI.Component);

})(window, document, Laya);
