namespace app.ui {
	export class VBox extends Laya.VBox {
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
			let maxWidth = 0;

			for (let i = 0, n = this.numChildren; i < n; i++) {
				let item: Laya.Component = this.getChildAt(i) as any;
				if (this.filterHandler.runWith(item)) {
					items.push(item);
					maxWidth = this._width ? this._width : Math.max(maxWidth, item.width * item.scaleX);
				}
			}

			this.sortItem(items);
			var top = 0;
			for (let i = 0, n = items.length; i < n; i++) {
				let item = items[i];
				item.y = top;
				top += item.height * item.scaleY + this._space;
				if (this._align == VBox.LEFT) {
					item.x = 0;
				} else if (this._align == VBox.CENTER) {
					item.x = (maxWidth - item.width * item.scaleX) * 0.5;
				} else if (this._align == VBox.RIGHT) {
					item.x = maxWidth - item.width * item.scaleX;
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
