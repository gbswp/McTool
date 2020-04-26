namespace app {
    interface ICacheItem {
        url: string;
        memorySize: number;
    }

    export class LRUCache {
        private static _max = 20;
        private static _caches: ICacheItem[] = [];
        private static _cacheMap: { [url: string]: boolean } = {};
        private static _cacheChanged = false;

        static add(url: string) {
            if (!!this._cacheMap[url]) return;
            let memorySize = this._caculateMemorySize(url);
            if (memorySize == 0) {
                Laya.loader.clearRes(url, true);
                // Laya.loader.clearTextureRes(url);
                return;
            }
            this._caches.push({ url, memorySize })
            this._cacheMap[url] = true;
            this._runCacheChanged();
        }

        static remove(url: string) {
            delete this._cacheMap[url];
            _.remove(this._caches, value => value.url == url);
        }

        private static _caculateMemorySize(url: string) {
            let res = Laya.Loader.getRes(url);
            if (!res) return 0;
            if (!(res instanceof Laya.Texture)) return 0;
            if (!res.bitmap) return 0;
            if (res.bitmap instanceof Laya.AtlasWebGLCanvas) return 0;
            return res.bitmap.memorySize;
        }

        private static _runCacheChanged() {
            if (!this._cacheChanged) {
                this._cacheChanged = true;
                Laya.timer.callLater(this, () => {
                    let sum = this.getSumMemorySize();
                    let max = this._max * 1024 * 1024;
                    while (sum > max) {
                        let cache = this._caches.shift();
                        if (!cache) break;
                        this.clearCache(cache.url);
                        sum -= cache.memorySize;
                    }
                    this._cacheChanged = false;
                })
            }
        }

        static getSumMemorySize() {
            let sum = 0;
            this._caches.forEach(value => sum += value.memorySize);
            return sum;
        }

        static getSumMemorySizeStr() {
            return utils.getMenoryNumber(this.getSumMemorySize());
        }

        static clearCache(url: string) {
            Laya.Loader.clearRes(url, true);
            // Laya.loader.clearTextureRes(url);
            delete this._cacheMap[url];
        }

        static clearAll() {
            this._caches.forEach(cache => this.clearCache(cache.url));
            this._caches.length = 0;
            this._cacheMap = {};
            this._cacheChanged = false;
            Laya.timer.clearAll(this);
        }

    }

}
