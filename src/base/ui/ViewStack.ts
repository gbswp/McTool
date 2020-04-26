namespace app.ui {

    export interface IViewStack {
        awaken?: () => void;
        sleep?: () => void;
    }

    export class ViewStack extends Laya.ViewStack {

        initItems() {
            super.initItems();
            this.doSelect(this._selectedIndex, true);
        }

        protected setSelect(index: number, selected: boolean) {
            super.setSelect(index, selected);
            this.doSelect(index, selected);
        }

        protected doSelect(index: number, selected: boolean) {
            if (!this._items || !this._items.length) return;
            let item = this._items[index] as IViewStack;
            item && (selected ? item.awaken && item.awaken() : item.sleep && item.sleep());
        }

    }
}
