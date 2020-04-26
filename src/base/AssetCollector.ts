namespace app {
    var DEBUG: boolean = true;

    export interface IListItem {
        initItems(): void;
    }

    export interface AssetCollectItem {
        refCount: number;
        loaded: boolean;
        owners?: string[];
    }

    export interface IAssetCollector {
        addAsset(resource: string): any;
    }

    export class AssetCollector {
        /**用于收集.d图片资源 以及aniView资源 */
        static globalAsset = new AssetCollector("global");
        private static resources = {};
        private _resources = {};
        private _owner: string;

        //指定保留的资源组
        static reserveGroups(groups: string[]) {
            let resources = AssetCollector.resources;
            groups.forEach(group => {
                resources[group] = { refCount: 1 }
            });
        }

        decResourceRef(resource: string) {
            let thisCount = this._resources[resource];
            if (thisCount) {
                AssetCollector.doDecResourceRef(resource);
                if (thisCount > 1)
                    this._resources[resource] = thisCount - 1;
                else
                    delete this._resources[resource];
            }
        }

        static doDecResourceRef(resource: string) {
            let resources = AssetCollector.resources;
            let ref = resources[resource];

            if (ref) {
                ref.refCount -= 1
                if (ref.refCount <= 0) {
                    delete resources[resource];
                    if (ref.loaded) //加载中的图片需要offAll回调函数
                        Laya.loader.cancelLoadByUrl(resource);
                    // Laya.Loader.clearTextureRes(resource);
                    // let texture = Laya.Loader.getRes(resource);
                    // if (texture && texture.bitmap && texture.bitmap.enableMerageInAtlas) return;
                    Laya.Loader.clearRes(resource);
                }
            }
        }

        static getParentAssetCollector(view: Laya.Component) {
            let parent = view.parent;
            while (parent != null) {
                if (parent instanceof ui.View) {
                    if (parent.assetCollector)
                        return parent.assetCollector;
                }
                parent = parent.parent;
            }
            return null;
        }

        constructor(owner: string) {
            this._owner = owner;
        }

        init(resRef: any[]) {
            if (!resRef)
                return;

            resRef.forEach((tmp: any) => {
                let resource = tmp.url;
                if (resource.indexOf("ani.d") == -1 && resource.indexOf(".d") == -1) {
                    let cacheItem = AssetCollector.resources[resource];

                    if (cacheItem) {
                        cacheItem.refCount += tmp.refCount;
                    } else {
                        cacheItem = { refCount: tmp.refCount, loaded: true };
                        AssetCollector.resources[resource] = cacheItem;
                    }
                    if (DEBUG) {
                        if (!cacheItem.owners) cacheItem.owners = [];
                        if (cacheItem.owners.indexOf(this._owner) < 0)
                            cacheItem.owners.push(this._owner);
                    }
                    let thisCount = this._resources[resource] || 0;
                    this._resources[resource] = thisCount + tmp.refCount;
                }
            })
        }

        loadP(url: any, type?: string, priority?: number, cache?: boolean, group?: string): Promise<void> {
            if (url instanceof Array) {
                url.forEach(obj => {
                    let url = typeof obj == "string" ? obj : obj.url;
                    url && this.addAsset(url);
                })
            } else {
                this.addAsset(url);
            }

            return new Promise<void>((resolve: any, reject: any) => {
                Laya.loader.loadP(url, type, priority, null, cache, group).then(() => {
                    let cacheItem = AssetCollector.resources[url];
                    if (cacheItem)
                        cacheItem.loaded = true;

                    resolve(void (0));
                }).catch((err: any) => {
                    reject(err);
                })
            })
        }

        addAsset(resource: string) {
            let cacheItem = AssetCollector.resources[resource];
            if (cacheItem) {
                cacheItem.refCount++;
            } else {
                cacheItem = { refCount: 1, loaded: false };
                AssetCollector.resources[resource] = cacheItem;
            }
            if (DEBUG) {
                if (!cacheItem.owners) cacheItem.owners = [];
                if (cacheItem.owners.indexOf(this._owner) < 0)
                    cacheItem.owners.push(this._owner);
            }
            let thisCount = this._resources[resource] || 0;
            this._resources[resource] = thisCount + 1;

        }

        destroy() {
            let resources = AssetCollector.resources;
            let myResources = this._resources;
            for (let res in myResources) {
                let cacheItem = resources[res];
                if (cacheItem) {
                    cacheItem.refCount -= myResources[res];
                    if (cacheItem.refCount <= 0) {
                        delete resources[res];
                        if (cacheItem.loaded) //加载中的图片需要offAll回调函数
                            Laya.loader.cancelLoadByUrl(res);
                        // Laya.Loader.clearTextureRes(res);
                        // let texture = Laya.Loader.getRes(res);
                        // if(texture && texture.bitmap && texture.bitmap.enableMerageInAtlas) return;
                        Laya.Loader.clearRes(res)
                    } else {
                        if (DEBUG) {
                            let index = cacheItem.owners.indexOf(this._owner);
                            if (index >= 0)
                                cacheItem.owners.splice(index, 1);
                        }
                    }
                }
            }
        }
    }

    export let diagnoseUI: any;
    if (DEBUG) {
        diagnoseUI = function (resource?: string) {
            let resources = (AssetCollector as any).resources;
            if (resource) {
                let cacheItem = resources[resource];
                //console.log(`${resource} is used by:`, cacheItem ? cacheItem.owners : '[]');
                let resItem = Laya.Loader.loadedMap[resource];
                if (resItem && resItem.name == resource && resItem.subkeys) {
                    let subkeys = resItem.subkeys;
                    for (let i = 0; i < subkeys.length; i++) {
                        cacheItem = resources[subkeys[i]];
                        // if (cacheItem && cacheItem.owners)
                        //console.log(subkeys[i], cacheItem.owners)
                    }
                }
            } else {
                let dialogs: any = [];
                for (let res in resources) {
                    let cacheItem = resources[res];
                    cacheItem.owners && cacheItem.owners.forEach((owner: any) => {
                        if (dialogs.indexOf(owner) < 0)
                            dialogs.push(owner);
                    })
                }
                //console.log('opened dialogs:', dialogs);
                //console.log('sheets used:', Laya.Loader["atlasMap"]);
            }
        };
    }
}
