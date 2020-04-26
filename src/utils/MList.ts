namespace app {
    export interface IDataView<D> extends View {
        index?: number;
        selected?: boolean;
        setData: (data: D) => void;
        refreshData: () => void;
    }

    export class MList<T extends IDataView<D>, D> extends Laya.EventDispatcher {
        private _datas: D[] = [];
        private _items: T[] = [];
        private _selectedIndex: number = -1;
        renderHandler: Laya.Handler = Laya.Handler.create(this, this._renderHandler, null, false);
        selectHandler: Laya.Handler

        addItem(item: T) {
            this._items.pushOnce(item);
            let index = this._items.length - 1;
            item.index = index;
            item.selected = index == this.selectedIndex;
            item.on(Laya.Event.CLICK, this, this.onItemClick, [index])
        }

        set data(value: D[]) {
            if (this._datas == value) return;
            this._datas = value;
            this.renderItems();
        }

        get data(): D[] {
            return this._datas;
        }

        protected renderItems() {
            for (let i = 0, len = this._items.length; i < len; i++) {
                this.renderItem(this._items[i], i);
            }
        }

        protected renderItem(item: T, index: number) {
            if (this._datas && index > -1 && index < this.dataLen) {
                item.visible = true;
                if (this.hasListener(Laya.Event.RENDER)) this.event(Laya.Event.RENDER, [item, index]);
                if (this.renderHandler) this.renderHandler.runWith([item, index]);
            } else {
                item.visible = false;
            }
        }

        private _renderHandler(item: T, index: number) {
            item.setData(this._datas[index]);
        }

        private onItemClick(index: number) {
            this.selectedIndex = index;
        }

        set selectedIndex(value: number) {
            if (this.selectedIndex == value) return;
            this.setSelect(this._selectedIndex, false);
            this._selectedIndex = value;
            this.setSelect(value, true);
            this.event(Laya.Event.CHANGE);
            this.selectHandler && this.selectHandler.runWith(this._selectedIndex);
        }
        get selectedIndex() {
            return this._selectedIndex;
        }
        protected setSelect(index: number, selected: boolean) {
            let item = this.getItem(index);
            item && (item.selected = selected);
        }

        set selectedData(data: D) {
            this.selectedIndex = this._datas.indexOf(data);
        }
        get selectedData() {
            return this._datas[this._selectedIndex];
        }

        refreshItem(data: D, key: string) {
            let index = _.findIndex(this._datas, dat => dat[key] == data[key]);
            let item = this.getItem(index);
            item && item.refreshData();
        }

        getItem(index: number) {
            if (this._items && index > -1 && index < this._items.length) return this._items[index];
            return null;
        }

        getData(index: number) {
            return this._datas[index];
        }

        get dataLen() {
            return this._datas.length;
        }

        dispose() {
            this._items.forEach(item => {
                item.offAll();
            })
            this._items.length = 0;
            this._datas = null;
            if (this.renderHandler) {
                this.renderHandler.clear();
                this.renderHandler = null;
            }
            if (this.selectHandler) {
                this.selectHandler.clear();
                this.selectHandler = null;
            }
            this.offAll();
        }
    }
}
