namespace app.ui {
    export class ComboBox extends Laya.ComboBox {
        private _listBg: ImageView;
        renderHandler: Laya.Handler;
        onRollHandler: Laya.Handler;
        constructor() {
            super();
            this.renderHandler = new Laya.Handler(this, this._defaultRenderHandler);
            this.onRollHandler = new Laya.Handler(this, this._defaultRollHandler);

            this["changeSelected"] = this.changeSelected;
        }

        protected createChildren() {
            super.createChildren();
            this._listBg = new ImageView();
        }

        set listSkin(skin: string) {
            let listBg = this._listBg;
            listBg.left = listBg.right = listBg.top = listBg.bottom = 0;
            listBg.skin = skin;
            this.list.addChildAt(listBg, 0);
        }

        get listSkin() {
            return this._listBg.skin;
        }

        set listSkinSizeGrid(value: string) {
            this._listBg && (this._listBg.sizeGrid = value);
        }

        get listSkinSizeGridF() {
            return this._listBg ? this._listBg.sizeGrid : null;
        }

        protected onlistItemMouse(e: Laya.Event, index: number) {
            var type: String = e.type;
            if (type === Laya.Event.MOUSE_OVER || type === Laya.Event.MOUSE_OUT) {
                this.onRollHandler && this.onRollHandler.runWith([index, type == Laya.Event.ROLL_OVER]);
            } else if (type === Laya.Event.CLICK) {
                this.selectedIndex = index;
                this.isOpen = false;
            }
        }

        protected changeList() {
            super.changeList();
            if (this.itemRender) {
                this._itemHeight = this._itemSize;
            }
        }

        protected changeItem() {
            this._itemChanged = false;
            //显示边框
            this._listHeight = this._labels.length > 0 ? Math.min(this._visibleNum, this._labels.length) * this._itemHeight : this._itemHeight;
            //填充数据
            var a: any[] = this._list.array || [];
            a.length = 0;
            for (var i: number = 0, n: number = this._labels.length; i < n; i++) {
                a.push({ label: this._labels[i] });
            }

            let list = this._list;
            list.width = this.width;
            list.height = this._listHeight;
            list.renderHandler = this.renderHandler;
            list.array = a;
        }

        protected _defaultRenderHandler(cell: Laya.Box, index: number) {
            if (index < 0 && index >= this._labels.length) return;
            let label = cell.getChildByName("label") as Laya.Label;
            label && (label.value = this._labels[index]);
            this.onRollHandler.runWith([index, false]);
        }

        protected _defaultRollHandler(index: number, visible: boolean) {
            if (index < 0 && index >= this._labels.length) return;
            let cell = this._list.getCell(index);
            if (!cell) return;
            let rollBox = cell.getChildByName("rollBox") as Laya.Component;
            rollBox && (rollBox.visible = visible);
        }

        protected changeSelected() {
            let label = this.getChildByName("label") as Laya.Label;
            if (label) label.value = this.selectedLabel || "";
            else this._button.label = this.selectedLabel || "";
        }

        getLabel(): Laya.Label {
            return this.getChildByName("label") as Laya.Label;
        }

        get selectedItem() {
            return this._selectedIndex != -1 ? this._labels[this._selectedIndex] : null;
        }
        set selectedItem(value: any) {
            this.selectedIndex = this._labels.indexOf(value);
        }

        setScrollBarSkin(skin: string) {
            this.scrollBarSkin = skin;
            this.list.vScrollBarSkin = this._scrollBarSkin;
        }

        get selectedIndex() {
            return this._selectedIndex;
        }

        set selectedIndex(value: number) {
            if (this._selectedIndex != value) {
                this._selectedIndex = value;

                this.event(Laya.Event.CHANGE, [Laya.Event.EMPTY.setTo(Laya.Event.CHANGE, this, this)]);
                this._selectHandler && this._selectHandler.runWith(this._selectedIndex);
            }

            if (this._labels.length > 0) this.changeSelected();
            else this.callLater(this.changeSelected);
        }


        destroy(destroyChild?: boolean) {
            if (this.renderHandler) {
                this.renderHandler.clear();
                this.renderHandler = null;
            }
            if (this.onRollHandler) {
                this.onRollHandler.clear();
                this.onRollHandler = null;
            }
            this._listBg.skin = undefined;
            super.destroy(destroyChild);
        }

    }
}
