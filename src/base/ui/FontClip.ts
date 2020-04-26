namespace app.ui {
    export class FontClip extends Laya.FontClip {
        set skin(value: string) {
            if (this._skin != value) {
                this._removeAsset(this._skin);
                this._skin = value;
                this._addAsset(value);
                if (value) {
                    this._setClipChanged();
                } else {
                    this._bitmap.source = null;
                }
            }
        }

        get skin() {
            return this._skin;
        }

        private _addAsset(url: string) {
            if (url && url.indexOf(".d") > 0) { //只对带d的图片处理
                let assetCollector = AssetCollector.globalAsset;
                if (assetCollector) {
                    assetCollector.addAsset(url);
                }
            }
        }

        private _removeAsset(url: string) {
            if (url && url.indexOf(".d") > 0) { //只对带d的图片处理
                let assetCollector = AssetCollector.globalAsset;
                if (assetCollector) {
                    assetCollector.decResourceRef(url);
                }
            }
        }
    }
}
