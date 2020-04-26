namespace app.ui {
    export class VList extends VBox {
        private _pool: IItemView[] = [];
        private _itemConstructor: IItemConstructor<IItemView>;
        private _data: any[] = [];
        renderHandler: Laya.Handler;
        scroller: Scroller;
        private _scrollEnable = true;
        constructor() {
            super();
            this.scroller = new Scroller();
        }

        protected changeSize() {
            super.changeSize();
            this.scrollEnable && this.bindScroller();
        }

        protected bindScroller() {
            let rect = this.scrollRect;
            if (rect && rect.width == this.width && rect.height == this.height) return;
            if (!rect) rect = new Laya.Rectangle(0, 0, this.width, this.height);
            else rect.setTo(rect.x, rect.y, this.width, this.height);
            rect.x = Math.range(rect.x, 0, Math.max(this.contentWidth - rect.width, 0));
            rect.y = Math.range(rect.y, 0, Math.max(this.contentHeight - rect.height, 0));
            this.scroller.bindTarget(this, rect);
        }

        setItem<T extends IItemView>(itemConstructor: IItemConstructor<T>) {
            this._clearPool();
            this._itemConstructor = itemConstructor;
        }

        set data(data: any[]) {
            if (this._data == data) return;
            this._data = data;
            this.updateData();
        }
        get data() {
            return this._data;
        }

        protected updateData() {
            if (!this._data || this.destroyed) return;
            this.clear();
            for (let i = 0, len = this._data.length; i < len; i++) {
                this.renderItem(i, this._data[i]);
            }
            this._setItemChanged();
        }

        protected renderItem(index: number, value: any) {
            let cell = this.get();
            this.addChildAt(cell, index);
            this.renderHandler && this.renderHandler.runWith([cell, value]);
            cell.setData && cell.setData(value);
            cell.on(Laya.Event.CHANGE, this, this._setItemChanged);
        }

        protected recycleItem(child: IItemView) {
            child.removeSelf();
            child.offAll();
            this.put(child);
        }

        protected get() {
            return this._pool.pop() || new this._itemConstructor();
        }

        protected put(item: View) {
            this._pool.pushOnce(item);
        }

        changeItems() {
            super.changeItems();
            this.scroller && this.scroller.setContentSize(this.contentWidth, this.contentHeight);
        }

        removeItem(oldIndex: number, value: any) {
            let index = this._data.indexOf(value);
            if (index == -1) index = oldIndex;
            if (index > -1) {
                let child = this.getChildAt(index) as IItemView;
                this.recycleItem(child);
                this._setItemChanged();
            }
        }

        appendItem(value: any) {
            this.renderItem(this._childs.length, value);
            this._setItemChanged();
        }

        get isMax() {
            return this.scroller.isMax;
        }

        //多次验证矫正置底位置
        scrollMax(count = 1) {
            this.clearTimer(this, this._checkScrollMax);
            if (count <= 0 && this.isMax) return;
            this.scroller.scrollMax();
            this.timerOnce(100, this, this._checkScrollMax, [count]);
        }

        private _checkScrollMax(count: number) {
            if (!this.isMax) this.scrollMax(count);
            else if (count > 0) {
                this.scrollMax(--count);
            }
        }

        set scrollEnable(value: boolean) {
            if (this._scrollEnable == value) return;
            this._scrollEnable = value;
            value ? this.bindScroller() : this.scroller.dispose();
        }
        get scrollEnable() {
            return this._scrollEnable;
        }

        refresh() {
            this.updateData();
        }

        clear() {
            let childs = this._childs;
            for (let len = childs.length, i = len - 1; i >= 0; i--) {
                let child = childs[i];
                this.recycleItem(child);
            }
        }

        private _clearPool() {
            this._pool.forEach(value => value.destroy(true));
            this._pool.length = 0;
        }

        destroy(destroyChild = true) {
            this._clearPool();
            this._itemConstructor = undefined;
            this._data = null;
            if (this.renderHandler) {
                this.renderHandler.recover();
                this.renderHandler = null;
            }
            if (this.scroller) {
                this.scroller.dispose();
                this.scroller = null;
            }
            Laya.timer.clearAll(this);
            super.destroy(destroyChild);
        }

    }
}
