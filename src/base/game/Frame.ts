namespace app.game {
    export class Frame extends Laya.Graphics {
        start: number = 0;//开始帧
        end: number = 0;//结束帧
        count: number = 1;//总次数
        curNum: number = 0;//当前次数

        get completed() {
            return this.curNum >= this.count;
        }

        reset(){
            this.start = 0;
            this.end = 0;
            this.count = 1;
            this.curNum = 0;
        }

    }
}
