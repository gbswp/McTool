namespace app {
    interface QueueItem<T> {
        item: T;
        cb: (item: T) => void;
    }

    interface QueueItemConstructor<T> {
        new(): T;
    }
    export class TimerQueue<T> {
        static _queues: TimerQueue<any>[] = [];
        static create<Q>(delay: number) {
            let queue = new TimerQueue<Q>(delay);
            this._queues.pushOnce(queue);
            return queue;
        }

        private _delay: number = 0;
        private _queue: QueueItem<T>[] = [];
        private _timerEnabled = false;

        private constructor(delay: number = 0) {
            this._delay = delay;
        }

        add(item: T, cb: (item: T) => void) {
            this._queue.push({ item: item, cb: cb });

            if (!this._timerEnabled) {
                Laya.timer.loop(this._delay, this, this.onTimer);
                this._timerEnabled = true;
            }
        }

        private onTimer() {
            let queue = this._queue;
            if (queue.length > 0) {
                let item = queue.shift();
                item.cb(item.item);
            }
            if (queue.length == 0) {
                Laya.timer.clear(this, this.onTimer);
                this._timerEnabled = false;
            }
        }

        remove(item: T) {
            let index = _.findIndex(this._queue, value => value.item == item);
            index != -1 && this._queue.splice(index, 1);
        }

        clear() {
            Laya.timer.clear(this, this.onTimer);
            TimerQueue._queues.remove(this);
            this._queue = [];

        }
    }
}
