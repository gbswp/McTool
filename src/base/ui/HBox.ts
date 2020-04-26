namespace app.ui {
	export class HBox extends Laya.HBox {
		sortHandler: Laya.Handler;
		filterHandler: Laya.Handler;
		filterVisible = false;//筛选visible
		enable = true;

		constructor() {
			super();
			this.filterHandler = new Laya.Handler(this, this._defaultFilter);
		}

		sortItem(items: any[]): void {
			this.sortHandler && this.sortHandler.runWith([items]);
		}

		private _defaultFilter(item: Laya.Component) {
			if (!item) return false;
			if (!item.layoutEnabled) return false;
			if (this.filterVisible && !item.visible) return false;
			return true;
		}

		changeItems(): void {
			if (!this.enable) return;
			this._itemChanged = false;
			let items: Laya.Component[] = [];
			let maxHeight = 0;
			for (let i = 0, n = this.numChildren; i < n; i++) {
				let item: Laya.Component = this.getChildAt(i) as any;
				if (this.filterHandler.runWith(item)) {
					items.push(item);
					maxHeight = this._height ? this._height : Math.max(maxHeight, item.height * item.scaleY);
				}
			}
			this.sortItem(items);
			let left = 0;
			for (let i = 0, n = items.length; i < n; i++) {
				let item = items[i];
				item.x = left;
				left += item.width * item.scaleX + this._space;
				if (this._align == HBox.TOP) {
					item.y = 0;
				} else if (this._align == HBox.MIDDLE) {
					item.y = (maxHeight - item.height * item.scaleY) * 0.5;
				} else if (this._align == HBox.BOTTOM) {
					item.y = maxHeight - item.height * item.scaleY;
				}
			}
			this.changeSize();
		}

		/*内容宽**/
		get contentWidth() {
			return this.measureWidth;
		}

		/*内容高**/
		get contentHeight() {
			return this.measureHeight;
		}

		protected commitMeasure() {
			super.commitMeasure();
			this.runCallLater(this.changeItems);
		}
	}
}
