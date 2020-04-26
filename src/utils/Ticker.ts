namespace app {
    export class Ticker {
        static create(endTime: number, interval: number = 1000, label?: { value: string | any[] }, format: string = "HH:MM:ss") {
            return new Ticker(endTime, interval, label, format);
        }

        onEnd: () => void;
        /**
         * value 秒
         * @memberof Ticker
         */
        onTick: (value: number) => void;

        private _timeLabel: { value: string | any[] };
        private _interval: number;
        private _format: string;
        private _endTime: number;
        disposed = false;

        private constructor(endTime: number, interval: number, label: { value: string | any[] }, format: string) {
            this._endTime = endTime;
            this._interval = interval;
            this._timeLabel = label;
            this._format = format;
        }

        bindLabel(label: Laya.Label) {
            this._timeLabel = label;
        }

        set endTime(value: number) {
            if (this._endTime == value) return;
            this._endTime = value;
        }
        get endTime() {
            return this._endTime;
        }

        start() {
            Laya.timer.loop(this._interval, this, this.onTimerLoop);
            this.onTimerLoop();
        }

        protected onTimerLoop() {
            let now = Date.serverTime();
            let time = this._endTime - now;
            if (time <= 0) {
                Laya.timer.clear(this, this.onTimerLoop);
                time = 0;
            }
            time = Math.round(time / 1000);
            let timeStr: string = "";
            if (this._format == undefined) {
                timeStr = formatTick(time);
            } else {
                timeStr = formatTick(time, this._format);
            }

            if (this._timeLabel) {
                if (this._timeLabel["destroyed"]) {
                    this.dispose();
                    return;
                } else {
                    this._timeLabel.value = timeStr;
                }
            }

            this.onTick && this.onTick(time);

            if (time <= 0) {
                Laya.timer.once(1000, this, () => {
                    this.onEnd && this.onEnd();
                    this.dispose();
                })
            }
        }

        dispose() {
            Laya.timer.clear(this, this.onTimerLoop);
            this._endTime = undefined;
            this._format = undefined;
            this._interval = undefined;
            this._timeLabel = null;
            if (this.onTick) {
                this.onTick = null;
            }
            if (this.onEnd) {
                this.onEnd = null;
            }

            this.disposed = true;

        }

    }
}
