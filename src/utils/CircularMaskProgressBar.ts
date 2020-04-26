namespace app {
    export interface IMaskProgressBar {
        percent: number;
        tweenValue(value: number, duration?: number, complete?: Laya.Handler): void;
        dispose(): void;
    }

    //圆形遮罩进度条
    export class CircularMaskProgressBar extends Laya.EventDispatcher implements IMaskProgressBar {
        target: Laya.Sprite;
        label: Laya.Label;
        update: Laya.Handler;

        protected mask: Laya.Sprite;
        protected _percent: number = 0;
        protected _totalTime: number = 1000;
        protected sa = -90;
        protected ea = 270;
        protected mx: number;
        protected my: number;
        protected rad: number;
        protected tween: TweenWrapper;
        protected _isReverse: boolean = false;

        constructor(isReverse: boolean = false) {
            super();
            this._isReverse = isReverse;
        }

        get totalTime() {
            return this._totalTime;
        }

        set totalTime(value: number) {
            if (this._totalTime == value) return;
            this._totalTime = value;
        }

        get isReverse() {
            return this._isReverse;
        }

        set isReverse(value: boolean) {
            if (this._isReverse == value) return;
            this._isReverse = value;
        }

        bindTarget(target: Laya.Sprite, mx: number, my: number, rad?: number, label?: Laya.Label) {
            if (this.target)
                this.target.off(Laya.Event.UNDISPLAY, this, this.dispose);
            if (target)
                target.off(Laya.Event.UNDISPLAY, this, this.dispose);
            this.target = target;
            target.once(Laya.Event.UNDISPLAY, this, this.dispose);
            this.mx = mx;
            this.my = my;
            this.rad = rad || target.width >> 1;
            label && (this.label = label);
            this.updateValue();
        }

        set percent(value: number) {
            if (this._percent == value) return;
            this._percent = value;
            this.updateValue();
        }
        get percent() {
            return this._percent;
        }

        get currentAngle() {
            let angle = this._percent * this.totalAngle;
            return this._isReverse ? this.ea - angle : this.sa + angle;
        }

        protected updateValue() {
            if (!this.mask) {
                this.mask = new Laya.Sprite();
            }
            let g = this.mask.graphics;
            g.clear();
            let angle = (this._percent || 0.001) * this.totalAngle;
            if (this._percent < 1) {
                if (!this._isReverse) {
                    g.drawPie(this.mx, this.my, this.rad, this.sa, this.sa + angle, '#ff0000');
                } else {
                    g.drawPie(this.mx, this.my, this.rad, this.ea - angle, this.ea, '#ff0000');
                }
            } else {
                g.drawCircle(this.mx, this.my, this.rad, '#ff0000');
            }

            this.target && (this.target.mask = this.mask);
            this.label && (this.label.value = Math.floor(this._percent * 100) + "%");

            this.update && this.update.run();

            this.event(Laya.Event.CHANGED);
        }

        tweenValue(value: number, duration?: number, complete?: Laya.Handler) {
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


        set startAngle(value: number) {
            this.sa = value;
        }

        set endAngle(value: number) {
            this.ea = value;
        }

        get totalAngle() {
            return this.ea - this.sa;
        }

        dispose() {
            this.clearTween();
            if (this.target)
                this.target.off(Laya.Event.UNDISPLAY, this, this.dispose);
            this.target && (this.target.mask = null);
            this.target = null;
            this.mask && this.mask.destroy(true);
            this.mask = null;
            this.label && this.label.destroy(true);
            this.label = null;
            this.update = undefined;
        }
    }
}
