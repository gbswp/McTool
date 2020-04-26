namespace app.ui {
    export class List extends Laya.List {

        changeCellStateHandler: Laya.Handler;

        private _scroll = false;
        private _temp: any[];
        private _elasticDistance: number = 300;

        private _bImmediate: boolean = false;

        set data(value: any[]) {
            this.array = value;
        }
        get data() { return this._array }

        set array(value: Array<any>) {
            if (this.destroyed) return;
            if (this._scroll && !this._bImmediate) {
                this._temp = value;
                return;
            }
            this["_$set_array"](value);
        }
        get array() { return this._array }

        protected changeCells() {
            if (!this._scroll) super.changeCells();
            else this._cellChanged = false;
        }

        protected renderItem(cell: CellView, index: number): void {
            if (index >= 0 && index < this._array.length) {
                cell.visible = true;
                cell._index = index;
                this["posCell"](cell, index);
                if (!this.event(Laya.Event.RENDER, [cell, index, this]))
                    cell.updateData(this._array[index], index);
            } else {
                cell.visible = false;
                cell._index = void (0);
            }
        }

        protected addCell(cell: CellView): void {
            // 不调用super，避免注册过多事件
            // 此时cell已经添加到ListView中了
            cell.visible = false;
            cell.on(Laya.Event.CLICK, this, this.onCellMouse);
            this._cells.push(cell);
        }

        protected changeCellState(cell: Laya.Box, visable: boolean, index: number) {
            super.changeCellState(cell, visable, index);
            this.changeCellStateHandler && this.changeCellStateHandler.runWith([cell, visable]);
        }

        get cellWidth() {
            return this.createItem().width;
        }

        get cellHeight() {
            return this.createItem().height;
        }

        set scrollBar(value: Laya.ScrollBar) {
            this["_$set_scrollBar"](value);
            let scrollBar = this._scrollBar;
            if (!scrollBar) return;
            scrollBar.elasticDistance = this._elasticDistance;
            scrollBar.elasticBackTime = 300;
            scrollBar.on(Laya.Event.START, this, () => this.scroll = true);
            scrollBar.on(Laya.Event.END, this, () => this.scroll = false);
            scrollBar["afterTargetMouseDown"] = () => this._scroll = false;
        }
        get scrollBar() {
            return this._scrollBar;
        }

        set scroll(value: boolean) {
            if (this._scroll == value) return;
            this._scroll = value;
            if (!value && !!this._temp) {
                this.array = this._temp;
                this._temp = null;
            }
        }
        get scroll() {
            return this._scroll;
        }

        tweenPage(value: number) {
            this._page = Math.range(value, 0, this.totalPage);
            this.tweenTo(this._page * this.repeatX * this.repeatY);
        }

        set elasticDistance(value: number) {
            if (this._elasticDistance == value) return;
            this._elasticDistance = value;
            this._scrollBar && (this._scrollBar.elasticDistance = this._elasticDistance);
        }
        get elasticDistance() { return this._elasticDistance };

        setImmediate(bImmediate: boolean) {
            this._bImmediate = bImmediate;
        }

        destroy(destroyChild = true) {
            this._temp = null;
            if (this._scrollBar) {
                this._scrollBar.offAll();
                this._scrollBar["afterTargetMouseDown"] = null;
            }
            super.destroy(destroyChild);
        }
    }
}
