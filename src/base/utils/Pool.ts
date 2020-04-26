namespace app {
    export class Pool {
        static MovieClip = "MovieClip";
        static HttpRequest = "HttpRequest";
        static Frame = "Frame";
        static PendingReqItem = "PendingReqItem";

        static IdiomGameCellView = "IdiomGameCellView";
        static IdiomData = "IdiomData";
        static WordData = "WordData";

        static FlyPoint = "FlyPoint";
        static FlyEffectItem = "FlyEffectItem";

        static get<T>(sign: string, cls: { new(): T }) {
            return Laya.Pool.getItemByClass(sign, cls) as T
        }

        /**
         * 有继承关系的 池回收会有问题  要格外注意
         * @static
         * @param {string} sign
         * @param {*} item
         * @memberof Pool
         */
        static put(sign: string, item: any) {
            if (!item) return;
            let inPoolSign = Laya.Pool["InPoolSign"];
            if (!item[inPoolSign])
                item["reset"] && item["reset"]();
            Laya.Pool.recover(sign, item)
        }
    }

}
