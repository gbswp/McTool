namespace app {
    export class FPSer {
        static _count: number = 0;
        static _timer: number = 0;
        static FPS: number = 0;

        static loop(): boolean {
            FPSer._count++;
            var timer: number = Laya.Browser.now();
            if (timer - FPSer._timer < 1000) return false;

            var count: number = FPSer._count;
            //计算更精确的FPS值
            FPSer.FPS = Math.round((count * 1000) / (timer - FPSer._timer));
            FPSer._count = 0;
            FPSer._timer = timer;
            return true;
        }
    }
}