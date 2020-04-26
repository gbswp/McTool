namespace app.ui {
    export class Toast extends Laya.Component {
        private _imgBg: Laya.Image;
        private _descDiv: Laya.HTMLDivElement;
        bindTimeLine: Laya.TimeLine;

        static create(labelStyle: LabelStyle, imgStyle: ImageStyle, text: string, layout: LayoutStyle): Toast {
            let view = new Toast();
            let style = view._descDiv.style;
            let image = view._imgBg;
            for (let key in labelStyle) {
                style[key] = labelStyle[key];
            }
            for (let key in imgStyle) {
                (image as any)[key] = imgStyle[key];
            }
            view.text = text;
            view.initSize(layout);
            return view;
        }

        constructor() {
            super();
            this.centerX = this.centerY = 0;
            this._descDiv = new Laya.HTMLDivElement();
            this._imgBg = new ImageView();
            this._imgBg.skin = "wgt/img_comp_bg.png";
            this._imgBg.sizeGrid = '20,20,20,20';
            this._imgBg.left = this._imgBg.right = 0;
            this._imgBg.top = this._imgBg.bottom = 0;
            this.addChild(this._imgBg);
            this.addChild(this._descDiv);
            let style = this._descDiv.style;
            style.color = '#ffffff';
            style.alpha = 0.8;
            style.fontSize = 22;
            style.stroke = 2;
            style.wordWrap = false;
            this.width = 500;
            this.height = 40;
        }

        private initSize(layout: LayoutStyle) {
            let stage = Laya.stage;
            this.pivotX = this.width / 2;
            this.pivotY = this.height / 2;
            this.x = (stage.width) / 2;
            this.y = (stage.height) / 2;
            if (layout) {
                this.x += (layout.horizontalLayoutDiff || 0) + (layout.horizontalLayout || 0) * (this._descDiv.width + 20);
                this.y += (layout.verticalLayoutDiff || 0) + (layout.verticalLayout || 0) * (this._descDiv.height + 20);
            }
        }

        set text(value: string) {
            value += "";
            let reg = /\<span .*\>.*\<\/span\>/g;
            if (!reg.test(value)) {
                value = `<span style = 'color:#ffffff'>${value}</span>`
            }
            this._descDiv.innerHTML = value;
            this._descDiv.x = this.width - this._descDiv.contextWidth >> 1;
            this._descDiv.y = this.height - this._descDiv.style.fontSize >> 1;
        }

        destroy(destroyChild = true) {
            if (this.bindTimeLine) {
                this.bindTimeLine.destroy();
                this.bindTimeLine = null;
            }
            super.destroy(destroyChild);
        }
    }
}
