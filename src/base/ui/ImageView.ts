namespace app.ui {
    export class ImageView extends Laya.Image {

        setSource(url: string, img: any) {
            if (url === this._skin && img) {
                this.source = img;
                this.onCompResize();
            }
        }

        set skin(value: string) {
            if (this._skin != value) {
                this._removeAsset(this._skin);
                this._skin = value;
                this._addAsset(value);

                this.source = null;
                if (value) {
                    let source = Laya.Loader.getRes(value);
                    if (source) {
                        this.setSource(value, source); //patch
                    }
                    else
                        Laya.loader.load(this._skin, Laya.Handler.create(this, this.setSource, [this._skin]), null, "image", 1, true, this._group);
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

        destroy(destroyChild = true): void {
            super.destroy(destroyChild);
            let assetCollector = AssetCollector.globalAsset;
            if (assetCollector)
                assetCollector.decResourceRef(this._skin);
        }
    }
}
