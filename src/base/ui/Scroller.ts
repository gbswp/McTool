namespace app {
    export const enum ScrollerType {
        All = 0,
        Vertical = 1,
        Horizontal = 2
    }

    export class Scroller {
        onScrollHandler: Laya.Handler;
        scrollRect: Laya.Rectangle;
        hScrollBar: Laya.HScrollBar;
        vScrollBar: Laya.VScrollBar;
        protected target: Laya.Sprite;
        protected contentWidth: number;
        protected contentHeight: number;
        protected hTween: TweenWrapper;
        protected vTween: TweenWrapper;
        private _elasticDistance: number = 300;
        private _scrollerType: number;


        constructor() {

        }

        bindTarget(target: Laya.Sprite, scrollRect: Laya.Rectangle, type: number = ScrollerType.Vertical) {
            if (!target || target.destroyed) return;
            if (this.target != target) {
                this.target && this.target.offAll(Laya.Event.UNDISPLAY);
                this.target = target;
                this.target.once(Laya.Event.UNDISPLAY, this, this.dispose);
                this.scrollRect = scrollRect;
                this.setContentSize(target.width, target.height);
            }
            this.restScrollerRect(scrollRect, true);
            this._scrollerType = type;
            this.initScrollerBar();
            this._updateElasticDistance();
        }

        protected initScrollerBar() {
            let type = this._scrollerType;
            (type == ScrollerType.Vertical || type == ScrollerType.All) && this.initVScrollBar();
            (type == ScrollerType.Horizontal || type == ScrollerType.All) && this.initHScrollBar();
        }

        setContentSize(contentWidth: number, contentHeight: number, stop = true) {
            if (this.contentWidth == contentWidth && this.contentHeight == contentHeight) return;
            this.contentWidth = contentWidth;
            this.contentHeight = contentHeight;
            this.vScrollBar && this.initVScrollBar(stop);
            this.hScrollBar && this.initHScrollBar(stop);
        }

        protected initVScrollBar(stop = true) {
            let rect = this.scrollRect;
            this.vScrollBar || (this.vScrollBar = new Laya.VScrollBar());
            let bar = this.vScrollBar;
            stop && bar.stopScroll();
            let maxValue = Math.max(0, this.contentHeight - rect.height);
            bar.thumbPercent = rect.height / maxValue;
            bar.setScroll(0, maxValue, bar.value);
            bar.target = this.target;
            bar.on(Laya.Event.CHANGE, this, this.onVscrollBarChange);
        }

        protected initHScrollBar(stop = true) {
            let rect = this.scrollRect;
            this.hScrollBar || (this.hScrollBar = new Laya.HScrollBar());
            let bar = this.hScrollBar;
            stop && bar.stopScroll();
            let maxValue = Math.max(0, this.contentWidth - rect.width);
            bar.thumbPercent = rect.width / maxValue;
            bar.setScroll(0, maxValue, bar.value);
            bar.target = this.target;
            bar.on(Laya.Event.CHANGE, this, this.onHscrollBarChange);
        }

        protected onVscrollBarChange() {
            let value = this.vScrollBar.value;
            let rect = this.target.scrollRect;
            rect.y = value;
            this.restScrollerRect(rect);
        }

        protected onHscrollBarChange() {
            let value = this.hScrollBar.value;
            let rect = this.target.scrollRect;
            rect.x = value;
            this.restScrollerRect(rect);
        }

        protected restScrollerRect(rect: Laya.Rectangle, isInit = false) {
            this.target.scrollRect = rect;
            this.target.conchModel && (this.target.conchModel.scrollRect(rect.x, rect.y, rect.width, rect.height));
            !isInit && this.onScrollHandler && this.onScrollHandler.run();
        }

        set vScrollBarValue(value: number) {
            this.vScrollBar && (this.vScrollBar.value = value);
        }
        get vScrollBarValue() {
            return this.vScrollBar ? this.vScrollBar.value : 0;
        }
        tweenVScrollBarValue(value: number, duration = 200, complete?: Laya.Handler) {
            if (this.vTween) this.vTween.clear();
            this.vTween = Laya.Tween.to(this.vScrollBar, { value: value }, duration, null, complete);
        }

        set hScrollBarValue(value: number) {
            this.hScrollBar && (this.hScrollBar.value = value);
        }
        get hScrollBarValue() {
            return this.hScrollBar ? this.hScrollBar.value : 0;
        }
        tweenHScrollBarValue(value: number, duration = 200, complete?: Laya.Handler) {
            if (this.hTween) this.hTween.clear();
            this.hTween = Laya.Tween.to(this.hScrollBar, { value: value }, duration, null, complete);
        }

        centerToValue(value: number) {
            if (this.hScrollBar) {
                this.hScrollBar.value = Math.range(value - this.scrollRect.width / 2, 0, this.maxScrollValue);
            } else if (this.vScrollBar) {
                this.vScrollBar.value = Math.range(value - this.scrollRect.height / 2, 0, this.maxScrollValue);
            }
        }

        get maxScrollValue() {
            if (this.hScrollBar) return this.hScrollBar.max;
            else if (this.vScrollBar) return this.vScrollBar.max;
            return 0;
        }

        get currentValue() {
            if (this.hScrollBar) {
                return this.hScrollBar.value;
            } else if (this.vScrollBar) {
                return this.vScrollBar.value;
            } else return 0;
        }

        get isMax() {
            return this.currentValue == this.maxScrollValue;
        }

        scrollMax() {
            if (this.hScrollBar) {
                this.hScrollBar.value = this.hScrollBar.max;
            } else if (this.vScrollBar) {
                this.vScrollBar.value = this.vScrollBar.max;
            }
        }

        set elasticDistance(value: number) {
            if (this._elasticDistance == value) return;
            this._elasticDistance = value;
            this._updateElasticDistance();
        }
        get elasticDistance() { return this._elasticDistance };

        private _updateElasticDistance() {
            this.vScrollBar && (this.vScrollBar.elasticDistance = this._elasticDistance);
            this.hScrollBar && (this.hScrollBar.elasticDistance = this._elasticDistance);
        }

        stopVScrollBar() {
            if (this.vScrollBar) {
                this.vScrollBar.stopScroll();
            }
        }

        stopHScrollBar() {
            if (this.hScrollBar) {
                this.hScrollBar.stopScroll();
            }
        }

        clearScorllerBar() {
            if (this.vScrollBar) {
                this.vScrollBar.offAll();
                this.vScrollBar.destroy();
                this.vScrollBar = null;
            }
            if (this.hScrollBar) {
                this.hScrollBar.offAll();
                this.hScrollBar.destroy();
                this.hScrollBar = null;
            }
        }

        dispose() {
            this.clearScorllerBar();

            if (this.onScrollHandler) {
                this.onScrollHandler.clear();
                this.onScrollHandler = null;
            }
            this.scrollRect = null;
            if (this.target) this.target.offAll(Laya.Event.UNDISPLAY);
            this.target = null;
        }
    }
}
