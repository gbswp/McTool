namespace app {
    export interface CacheOptions {
        capacity?: number; // 容量大小
    }

    interface EntryItem {
        key: string;
        p: EntryItem;
        n: EntryItem;
    }
    /*
    为了控制MovieClip的总个数，采用LRU算法根据类别分别控制，最大容量第一次创建时设置，如{capacity: 100}
    LRU是Least Recently Used的缩写，即最近最少使用页面置换算法，是为虚拟页式存储管理服务的，
    是根据页面调入内存后的使用情况进行决策了。由于无法预测各页面将来的使用情况，
    只能利用“最近的过去”作为“最近的将来”的近似，因此，LRU算法就是将最近最久未使用的页面予以淘汰
    */
    export class ClipCache {
        static caches = {};
        cacheId = '';
        size: number = 0;
        stats: CacheOptions;
        data: any;
        capacity: number;
        lruHash = {};
        freshEnd: EntryItem = null;//最近使用的元素
        staleEnd: EntryItem = null;//未使用时间最长的元素

        static create(cacheId: string, option?: CacheOptions): ClipCache {
            if(ClipCache.caches[cacheId])
                return ClipCache.caches[cacheId];

            ClipCache.caches[cacheId] = new ClipCache(cacheId, option);
            return ClipCache.caches[cacheId];
        }

        static removeAll() {
            for(let cacheId in ClipCache.caches) {
                ClipCache.caches[cacheId].removeAll();
            };
        }

        static info() {
            let sizeTotal = 0;
            for(let cachedId in ClipCache.caches) {
                let cache = ClipCache.caches[cachedId];
                sizeTotal += cache.size;
                //console.log(`${cachedId} size:${cache.size} capacity: ${cache.capacity}`);
            }
            //console.log(`Total size = ${sizeTotal}`);
        }

        constructor(cachedId: string, options?: CacheOptions) {
            this.stats = options || {};
            this.data = {};
            this.capacity = (options && options.capacity) || Number.MAX_VALUE;
            this.lruHash = {};
        }

        /**
         * 往缓存中添加一个元素
         * 将最近使用的元素置为新增元素
         * @param key
         * @param value
         * @returns {*}
         */
        put(key: string, value: game.MovieClip) {
            if(!key || key == '')
                return value;

            let lruEntry = this.lruHash[key] || (this.lruHash[key] = { key: key });
            this.refresh(lruEntry);

            if (!(key in this.data)) {
                this.size++;
            }
            this.data[key] = value;
            if (this.size > this.capacity) {
                this.remove(this.staleEnd.key);
            }
            return value;
        }

        /**
         * 获取key指定值的value
         * 将最近使用的置置为该值
         * @param key
         * @returns {*}
         */
        get(key: string): game.MovieClip {
            let lruEntry = this.lruHash[key];
            if (!lruEntry) {
                return null;
            }
            this.refresh(lruEntry);
            return this.data[key];
        }

        remove(key: string) {
            let lruEntry = this.lruHash[key];
            if (!lruEntry) {
                return;
            }
            if (lruEntry == this.freshEnd) {
                this.freshEnd = lruEntry.p;
            }

            if (lruEntry == this.staleEnd) {
                this.staleEnd = this.staleEnd.n;
            }
            (this.data[key] as game.MovieClip).clearAtlas();

            this.link(lruEntry.n, lruEntry.p);
            delete this.lruHash[key];
            delete this.data[key];
            this.size--;
        }

        removeAll() {
            this.data = {};
            this.size = 0;

            for(let key in this.data) {
                (this.data[key] as game.MovieClip).clearAtlas();
            }

            this.lruHash = {};
            this.freshEnd = this.staleEnd = null;
        }

        destroy() {
            this.removeAll();
            delete ClipCache.caches[this.cacheId];
        }

        refresh(entry: EntryItem) {
            if (entry != this.freshEnd) {
                if (!this.staleEnd) {
                    this.staleEnd = entry;
                } else if (this.staleEnd == entry) {
                    this.staleEnd = entry.n;
                }
                this.link(entry.n, entry.p);
                this.link(entry, this.freshEnd);
                this.freshEnd = entry;
                this.freshEnd.n = null;
            }
        }

        link(nextEntry: EntryItem, prevEntry: EntryItem) {
            if (nextEntry != prevEntry) {
                if (nextEntry) {
                    nextEntry.p = prevEntry;
                }
                if (prevEntry) {
                    prevEntry.n = nextEntry;
                }
            }
        }
    }
}
