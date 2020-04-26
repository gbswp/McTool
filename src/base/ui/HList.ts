namespace app.ui {
    export interface IItemConstructor<T> {
        new(): T;
    }
    export interface IItemView extends View {
        setData?: (data: any) => void;
    }

    export class HList extends HBox {
        private _pool: IItemView[] = [];
        private _itemConstructor: IItemConstructor<IItemView>;
        private _data: any[];
        renderHandler: Laya.Handler;
        private _sumWidth: number = 0;

        setItem<T extends IItemView>(itemConstructor: IItemConstructor<T>) {
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

        destroy(destroyChild = true) {
            this._pool.length = 0;
            this._pool = null;
            this._itemConstructor = undefined;
            this._data = null;
            if (this.renderHandler) {
                this.renderHandler.recover();
                this.renderHandler = null;
            }
            super.destroy(destroyChild);
        }

    }
}
