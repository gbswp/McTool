namespace app.ui {
    export class Tab extends Laya.UIGroup {
        beforeChangeHandler: Laya.Handler = Laya.Handler.create(this, this.beforeChageCheck, [], false);
        static soundString = "";
        selectSp: Laya.Component;
        tween: TweenWrapper;
        needTween = false;

        protected createItem(skin: string, label: string): Laya.Sprite {
            let btn = new Button(skin, label);
            btn.enableAnimating = false;
            return btn;
        }

        initItems(): void {
            super.initItems();
            this._items.forEach(item => {
                (item instanceof ui.Button) && (item.enableAnimating = false);
                if (item instanceof Laya.Button) {
                    item.toggle = false;
                    item.soundId = "switchUi";
                }
            });
            this.selectSp = this.getChildByName("select") as Laya.Component;
            this.updateSelectSp();
        }

        get selectedIndex() {
            return this._selectedIndex;
        }
        set selectedIndex(value: number) {
            if (this.beforeChangeHandler && this.beforeChangeHandler.runWith(value)) {
                // this.selectedIndex = 0;
                return;
            }
            this["_$set_selectedIndex"](value);
            this.updateSelectSp();
        }

        protected setSelect(index: number, selected: boolean): void {
            super.setSelect(index, selected);
            if (this._items && index > -1 && index < this._items.length) {
                let item = this._items[index] as Laya.Component;
                item.badgeEnable = !selected;
            }
        }

        protected updateSelectSp() {
            if (!this.selectSp) return;
            this.selectSp.visible = this._selectedIndex != -1;
            let selectItem = this.selection as Laya.Component;
            if (selectItem) {
                let pos = selectItem.x + selectItem.displayWidth / 2;
                if (this.needTween) {
                    if (this.tween) this.tween.clear();
                    this.tween = Laya.Tween.to(this.selectSp, { x: pos }, 100, Laya.Ease.cubicIn);
                } else {
                    this.selectSp.x = pos;
                }
            }
        }

        beforeChageCheck(index: number) {
            if (!this._items) return false;
            let item = this._items[index] as Laya.Component;
            return item && item.openKey && ui.checkModuleOpenByTargetImpl && !ui.checkModuleOpenByTargetImpl(item.openKey, true, true);
        }

        destroy(destroyChild = true) {
            if (this.tween) {
                this.tween.clear();
                this.tween = null;
            }
            super.destroy(destroyChild)
        }
    }
}
