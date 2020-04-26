namespace app {
    export class RectMaskProgressBar extends Laya.EventDispatcher implements IMaskProgressBar {
        target: Laya.Component;
        label: Laya.Label;
        update: Laya.Handler;

        protected mask: Laya.Sprite;
        protected tween: TweenWrapper;
        protected _size: Laya.Rectangle;
        protected _percent: number = 0;
        protected _totalTime: number = 1000;
        protected _isVertical: boolean = false;
        protected _isReverse: boolean = false;
        protected _isDisposed = false;

        constructor(isVertical: boolean = false, isReverse: boolean = false) {
            super();
            this._isVertical = isVertical;
            this._isReverse = isReverse;
        }

        get totalTime() {
            return this._totalTime;
        }

        set totalTime(value: number) {
            if (this._totalTime == value) return;
            this._totalTime = value;
        }

        get isVertical() {
            return this._isVertical;
        }

        set isVertical(value: boolean) {
            if (this._isVertical == value) return;
            this._isVertical = value;
        }

        get isReverse() {
            return this._isReverse;
        }

        set isReverse(value: boolean) {
            if (this._isReverse == value) return;
            this._isReverse = value;
        }

        bindTarget(target: Laya.Component, size?: Laya.Rectangle, label?: Laya.Label) {
            if (this.target)
                this.target.off(Laya.Event.UNDISPLAY, this, this.dispose);
            if (target)
                target.off(Laya.Event.UNDISPLAY, this, this.dispose);
            this.target = target;
            target.once(Laya.Event.UNDISPLAY, this, this.dispose);
            this._size = size || new Laya.Rectangle(0, 0, target.displayWidth, target.displayHeight);
            label && (this.label = label);
            this.updateValue();
        }

        setPercent(value: number) {
            this.clearTween();
            this.percent = value;
        }

        set percent(value: number) {
            if (this._isDisposed) return;
            if (this._percent == value) return;
            this._percent = value;
            this.updateValue();
        }
        get percent() {
            return this._percent;
        }

        //当前位置
        get currentPosition() {
            if (this._isDisposed) return 0;
            let size = this._size;
            let toLen: number;
            if (!this._isVertical) {
                toLen = size.width * this._percent;
                return this._isReverse ? size.right - toLen : size.x + toLen;
            } else {
                toLen = size.height * this._percent;
                return this._isReverse ? size.bottom - toLen : size.y + toLen;
            }
        }

        protected updateValue() {
            let mask = this.mask;
            if (!mask) {
                this.mask = mask = new Laya.Sprite();
            }
            let g = mask.graphics;
            g.clear();
            let size = this._size;
            let toLen: number;
            if (!this._isVertical) {
                toLen = size.width * this._percent;
                if (!this._isReverse) {
                    g.drawRect(size.x, size.y, toLen, size.height, '#ffffff');
                } else {
                    g.drawRect(size.right - toLen, size.y, toLen, size.height, '#ffffff');
                }
            } else {
                toLen = size.height * this._percent;
                if (!this._isReverse) {
                    g.drawRect(size.x, size.y, size.width, toLen, '#ffffff');
                } else {
                    g.drawRect(size.x, size.bottom - toLen, size.width, toLen, '#ffffff');
                }
            }

            this.target.mask = this.mask;
            this.label && (this.label.value = Math.floor(this._percent * 100) + "%");

            this.update && this.update.run();

            this.event(Laya.Event.CHANGED);
        }

        tweenValue(value: number, duration?: number, complete?: Laya.Handler) {
            if (this._isDisposed) return;
            value = Math.range(value, 0, 1);
            this.clearTween();
            duration = duration || (value - this._percent) * this._totalTime;
            this.tween = Laya.Tween.to(this, { percent: value }, duration, Laya.Ease.linearIn, Handler.create(this, () => {
                complete && complete.run();
                this.tween = null
            }));
        }

        clearTween() {
            if (this.tween) {
                this.tween.clear();
                this.tween = null;
            }
        }

        dispose() {
            this.clearTween();
            if (this.target)
                this.target.off(Laya.Event.UNDISPLAY, this, this.dispose);
            this.target && (this.target.mask = null);
            this.target = null;
            this.mask = null;
            this.label = null;
            this._size = null;
            this.update = undefined;
            this._isDisposed = true;
        }
    }
}
