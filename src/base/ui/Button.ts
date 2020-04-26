namespace app.ui {

    // 管理一个鼠标点击周期内的所有事件状态
    class MouseClick {
        private _oldPivotX: number;
        private _oldPivotY: number;
        private _downMode: boolean = false;
        private _clicked: boolean = false;
        button: Button;
        state: number;
        outed: boolean = false;
        canceled: boolean = false;
        promise: Promise<void>;
        protected scale: number = 0.9;


        static create(button: Button) {
            return new MouseClick(button);
        }

        constructor(button: Button) {
            this.button = button;
        }

        onEvent(e: Laya.Event) {
            let eventType = e.type;
            if (eventType === Laya.Event.MOUSE_DOWN) {
                this.promise = this.scaleDown().then(() => {

                });
            }
            else if (eventType === Laya.Event.MOUSE_OUT || eventType === Laya.Event.MOUSE_UP) {
                this.outed = true;
                if (this.promise) {
                    this.promise.then(() => this.scaleUp())
                }
            }
            else if (eventType === Laya.Event.CLICK) {
                this._clicked = true;
                if (this.promise) {
                    this.promise.then(() => !this.outed && this.scaleUp()).then(() => {
                        this._clicked = false;
                        this.doClick();
                    })
                }
            }

            this.promise && this.promise.then(() => {
                if (!this.canceled) {
                    let button = this.button;
                    !button.selected && (button.setState(Laya.Button['stateMap'][eventType]));
                }
            })
        }

        scaleDown(): Promise<void> {
            this.downMode = true;
            return Promise.resolve(void (0));
        }

        scaleUp(): Promise<void> {
            this.downMode = false;
            return Promise.resolve(void (0));
        }

        get downMode(): boolean {
            return this._downMode;
        }

        set downMode(value: boolean) {
            let button = this.button;
            if (!button.parent || this._downMode == value) // button被destroy之后不能再进行操作
                return;
            this._downMode = value;
            let parent = button.parent;
            if (parent && (parent instanceof HBox || parent instanceof VBox)) {
                parent.enable = !value;
            }
            if (value) {
                this._oldPivotX = button.pivotX;
                this._oldPivotY = button.pivotY;
                let newPivotX = button.width * .5;
                let newPivotY = button.height * .5;
                let dx = (newPivotX - this._oldPivotX) * button.scaleX;
                let dy = (newPivotY - this._oldPivotY) * button.scaleY;
                button.pivot(newPivotX, newPivotY);
                button.pos(button.x + dx, button.y + dy);
                Laya.Sprite.prototype['_$set_scaleX'].call(button, button.scaleX * this.scale);
                Laya.Sprite.prototype['_$set_scaleY'].call(button, button.scaleY * this.scale);
            } else {
                Laya.Sprite.prototype['_$set_scaleX'].call(button, button.scaleX / this.scale);
                Laya.Sprite.prototype['_$set_scaleY'].call(button, button.scaleY / this.scale);
                let dx = (this._oldPivotX - button.pivotX) * button.scaleX;
                let dy = (this._oldPivotY - button.pivotY) * button.scaleY;
                button.pivot(this._oldPivotX, this._oldPivotY);
                button.pos(button.x + dx, button.y + dy);
            }
        }

        cancel() {
            if (this.downMode) {
                if (this._clicked)
                    this.doClick();
                this.downMode = false;
            }
        }

        private doClick() {
            if (this.downMode)
                return;
            let button = this.button;
            button.toggle && (button.selected = !button.selected);
            button.clickHandler && button.clickHandler.run();
        }
    }

    export class Button extends Laya.Button {
        static REVERSE_HORIZONTAL = 'horizontal';
        static REVERSE_VERTICAL = 'vertical';
        static LAYER_TOP = 'top';
        static LAYER_BOTTOM = 'bottom';
        private _enableAnimating = true;       // 是否支持点击动画
        private _mouseClick: MouseClick;

        private _image: Laya.Image;             // 前景图片
        private _imageSkin: string;             // 前景图片资源
        private _imageSources: Laya.Texture[];  //
        private _effectOn: boolean;             // 是否开启动画
        private _effect: string;                // 动画资源
        private _effectAni: AniView;            // 动画对象，只在需要显示时才创建
        private _effectAutoScale: boolean;      // 是否自动缩放特效，以匹配Button的大小
        private _effectLayer: string;           // 动画显示的层次，top, middle, bottom三个，对应动画与背景和前景的位置关系
        private _reversed: boolean = false;
        private _reverseDirection: string = Button.REVERSE_HORIZONTAL;

        soundOn: boolean = true;
        enableLongPress: boolean = false;//长按enable 阻止事件穿透


        get enableAnimating(): boolean {
            return this._enableAnimating;
        }

        set enableAnimating(value: boolean) {
            this._enableAnimating = value;
        }

        set image(value: string) {
            if (this._imageSkin == value)
                return;

            if (!this._image) {
                let img = this._image = new ImageView();
                img.anchorX = img.anchorY = 0.5;
                img.centerX = -0;
                img.centerY = -8;           //适配按钮有阴影
                this.addChild(img);
            }
            this._imageSkin = value;
            this._image.skin = value;
            Laya.timer.callLater(this, this.changeImages);
        }

        get image(): string {
            return this._imageSkin;
        }

        get imageItem() {
            return this._image;
        }

        get effectOn(): boolean {
            return this._effectOn;
        }

        set effectOn(value: boolean) {
            if (this._effectOn != value) {
                this._effectOn = value;
                Laya.timer.callLater(this, this.updateEffect);
            }
        }

        get effect(): string {
            return this._effect;
        }

        set effect(value: string) {
            if (this._effect != value) {
                this._effect = value;
                Laya.timer.callLater(this, this.updateEffect);
            }
        }

        get effectAutoScale(): boolean {
            return this._effectAutoScale;
        }

        set effectAutoScale(value: boolean) {
            this._effectAutoScale = value;
        }

        get effectLayer(): string {
            return this._effectLayer;
        }

        set effectLayer(value: string) {
            if (this._effectLayer != value) {
                this._effectLayer = value;
                Laya.timer.callLater(this, this.updateEffect);
            }
        }

        get reverseDirection(): string {
            return this._reverseDirection;
        }

        set reverseDirection(value: string) {
            if (this._reverseDirection == value)
                return;
            this._reverseDirection = value;
        }

        get reversed(): boolean {
            return this._reversed;
        }

        set reversed(value: boolean) {
            if (this._reversed == value)
                return;
            this._reversed = value;
        }

        protected updateEffect() {
            if (!this._effect) {
                if (this._effectAni)
                    this._effectAni.autoPlay = false;
                return;
            }
            if (this._effectOn) {
                let layer = this._effectLayer || Button.LAYER_BOTTOM;
                let ani = this._effectAni;
                if (!ani) {
                    ani = this._effectAni = new AniView();
                    ani.centerX = ani.centerY = 0;
                    if (layer == Button.LAYER_TOP)
                        this.addChild(ani);
                    else if (layer == Button.LAYER_BOTTOM)
                        this.addChildAt(ani, 0);
                }
                ani.autoPlay = true;
                if (ani.skin != this._effect) {
                    ani.skin = this._effect;
                    this._effectAutoScale && ani.once(Laya.Event.LOADED, this, () => {
                        ani.scaleX = this.width / ani.width;
                        ani.scaleY = this.height / ani.height;
                    });
                }
            } else {
                let ani = this._effectAni;
                if (!ani)
                    return;
                ani.autoPlay = false;
            }
        }

        protected onMouse(e: Laya.Event) {
            if (!this.enableAnimating) {
                super.onMouse(e);
                return;
            }
            if (this.toggle === false && this._selected) return;
            if (!this._mouseClick) this._mouseClick = MouseClick.create(this);
            if (e.type === Laya.Event.MOUSE_DOWN || e.type === Laya.Event.MOUSE_OVER) this._mouseClick.cancel();
            this._mouseClick.onEvent(e);
            if (this.enableLongPress) {
                if (e.type == Laya.Event.MOUSE_DOWN) {
                    e.stopPropagation();
                }
            }
        }

        protected changeImages() {
            if (this.destroyed) return;
            let img = Laya.Loader.getRes(this._imageSkin);
            if (!img) {
                //console.log("lose image", this._imageSkin);
                return;
            };
            img.$_GID || (img.$_GID = Laya.Utils.getGID());
            let key = img.$_GID;
            let clips = Laya.WeakObject.I.get(key);
            if (clips) this._imageSources = clips;
            else {
                this._imageSources = [img];
                let imgDown = Laya.Loader.getRes(this.getStateRes(this._imageSkin, 'down'));
                let imgSelect = Laya.Loader.getRes(this.getStateRes(this._imageSkin, 'select'));
                if (imgDown) this._imageSources.push(imgDown);
                if (imgSelect) {
                    !imgDown && this._imageSources.push(img); // 如果有3态，且没有Down状态，则补充down状态
                    this._imageSources.push(imgSelect);
                }
                Laya.WeakObject.I.set(key, this._imageSources);
            }
        }

        protected changeClips() {
            if (this.destroyed || !this._skin) return;
            let img = Laya.Loader.getRes(this._skin);
            if (!img) {
                //console.log("lose skin", this._skin);
                return;
            };
            let width = img.sourceWidth;
            let height = img.sourceHeight;
            img.$_GID || (img.$_GID = Laya.Utils.getGID());
            let key = img.$_GID;
            let clips = Laya.WeakObject.I.get(key);
            if (clips) this._sources = clips;
            else {
                this._sources = [img];
                let imgDown = Laya.Loader.getRes(this.getStateRes(this._skin, 'down'));
                let imgSelect = Laya.Loader.getRes(this.getStateRes(this._skin, 'select'));
                if (imgDown) this._sources.push(imgDown);
                if (imgSelect) {
                    !imgDown && this._sources.push(img); // 如果有3态，且没有Down状态，则补充down状态
                    this._sources.push(imgSelect);
                }
                // this._stateNum = this._sources.length;
                Laya.WeakObject.I.set(key, this._sources);
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

        setState(value: number) {
            this.state = value;
        }

        protected changeState() {
            if (this.destroyed) return;
            this._stateChanged = false;

            this.runCallLater(this.changeClips);
            if (this._sources) {
                let len = this._sources.length;
                let index = this._state < len ? this._state : len - 1;
                let source = this._sources[index];
                this._bitmap.source = source;
            }
            this.runCallLater(this.changeImages);
            if (this._imageSources && this._image) {
                let len = this._imageSources.length;
                let index = this._state < len ? this._state : len - 1;
                let source = this._imageSources[index];
                this._image._bitmap.source = source;
            }
            if (this.label && this._sources) {
                let len = this._sources.length;
                let index = this._state < len ? this._state : len - 1;
                this._text.color = this._labelColors[index];
                if (this._strokeColors) this._text.strokeColor = this._strokeColors[index];
            }
        }

        private getStateRes(res: string, state: 'down' | 'select') {
            let pos = res.lastIndexOf('.');
            if (pos < 0)
                return res;
            return res.substr(0, pos) + '$' + state + res.substr(pos);
        }

        destroy(destroyChild = true) {
            Laya.timer.clearAll(this);
            super.destroy(destroyChild)
        }
    }
}
