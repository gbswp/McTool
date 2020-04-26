namespace app.ui {

    interface ITabStackView extends View {
        awaken?: () => void;
        sleep?: () => void;
    }

    interface TabStackViewConstructor<T> {
        create?(container: Laya.Component): Promise<T>;
        uiResMap?: any;
        new(): T;
    }

    interface TabStackItem<T> {
        creator: TabStackViewConstructor<T>
        instance: T;            // 视图的实例，可能是异步创建的，这时创建函数会返回promise
        defer: Promise<T>;      // 创建instance过程中产生的promise，fulfill之后设置为空，同时赋值instance
    }

    export class TabStack extends Laya.Component {
        private _items: TabStackItem<ITabStackView>[] = [];
        private _selectedIndex: number = -1;

        setItem<T extends ITabStackView>(itemConstructor: TabStackViewConstructor<T>) {
            let item: TabStackItem<T> = { creator: itemConstructor, instance: null, defer: null };
            this._items.push(item);
        }

        setItems(itemConstructors: TabStackViewConstructor<ITabStackView>[]) {
            for (let i = 0, len = itemConstructors.length; i < len; i++) {
                this.setItem(itemConstructors[i]);
            }
        }

        get selectedIndex() {
            return this._selectedIndex;
        }

        set selectedIndex(value: number) {
            if (this._selectedIndex == value || value < 0 || value >= this._items.length)
                return;
            this.setSelected(this._selectedIndex, false);
            this._selectedIndex = value;
            this.setSelected(this._selectedIndex, true);
        }

        protected setSelected(index: number, selected: boolean) {
            if (index < 0 || index >= this._items.length || !this._items[index]) return;
            let item = this._items[index];
            this.waitDefer(item).then(instance => {
                if (this.destroyed) return;
                instance.visible = selected;
                selected ? instance.awaken && instance.awaken() : instance.sleep && instance.sleep();
            })
        }

        get selection(): TabStackItem<ITabStackView> {
            return this._selectedIndex != null ? this._items[this._selectedIndex] : null;
        }

        set selection(value: TabStackItem<ITabStackView>) {
            let index = _.findIndex(this._items, item => item === value);
            this.selectedIndex = index;
        }

        setSelection(value: ITabStackView) {
            let index = _.findIndex(this._items, item => item.instance === value);
            this.selectedIndex = index;
        }

        promisedSelection() {
            return this.waitDefer(this.selection)
        }

        getItem(index: number) {
            return this._items[index];
        }

        getView(index: number) {
            return this.waitDefer(this._items[index]);
        }

        protected waitDefer(item: TabStackItem<ITabStackView>): Promise<ITabStackView> {
            if (!item) Promise.reject(void 0);
            if (item.instance) return Promise.resolve(item.instance);
            else {
                if (!item.defer) item.defer = this.createInstance(item.creator);
                return item.defer.then(instance => {
                    item.instance = instance
                    item.defer = null;
                    return instance;
                });
            }
        }

        protected createInstance(creator: TabStackViewConstructor<ITabStackView>) {
            if (creator.create) return creator.create(this);
            else {
                let uiResMap = creator.uiResMap;
                if (!uiResMap || !uiResMap.length) {//无资源加载时 直接创建实例
                    return create.call(this);
                } else {
                    return ui.getParentDialog(this).loadP(uiResMap).then(() => {
                        return create.call(this);
                    })
                }
            }

            function create(this: TabStack) {
                let instance = new creator();
                this.addChild(instance);
                return instance.waitCreated().then(() => instance)
            }
        }

        destroy(destroyChild: boolean = true) {
            this._items.forEach(item => {
                item.instance && item.instance.destroy(destroyChild);
                item.defer && item.defer.then(instance => instance.destroy(destroyChild));
            })
            this._items.length = 0;
            super.destroy(destroyChild);
        }
    }
}
