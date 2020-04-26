namespace app {
    export class PromiseQueue {
        static _queues: PromiseQueue[] = [];
        static create(autoPlay = true) {
            let queue = new PromiseQueue();
            queue.autoPlay = autoPlay;
            this._queues.pushOnce(queue);
            return queue;
        }

        private items: Array<() => Promise<any>> = [];
        private isWait = false;//在等待上一个完成
        private _autoPlay = true;//自动播放
        private _isStop: boolean = false;
        private constructor() {

        }
        set autoPlay(value: boolean) {
            if (this._autoPlay == value) return;
            this._autoPlay = value;
            !this.isWait && value && this.tryDoExecute();
        }
        get autoPlay() {
            return this._autoPlay;
        }

        stop() {
            this._isStop = true;
        }

        resume() {
            this._isStop = false;
            this.tryDoExecute();
        }

        /**callback 使用箭头函数 避免作用域的问题 */
        addItem(callback: () => Promise<any>) {
            this.items.push(callback);
            // if (this.items.length > 100) {
            //console.trace("PromiseQueue队列超过100")
            // }
            this._autoPlay && this.tryDoExecute();
        }

        tryDoExecute() {
            if (!this.isWait) {
                this.isWait = true;
                !this._isStop && this.doExecute();
            }
        }

        private doExecute() {
            if (!this.items.length) {
                this.isWait = false;
                return;
            }
            let callback = this.items.shift();
            callback().then(() => {
                this.isWait = false;
                this.tryDoExecute();
            });
        }

        clear() {
            this.isWait = false;
            this.items.length = 0;
            this._autoPlay = true;
            PromiseQueue._queues.pushOnce(this);
        }
    }
}
