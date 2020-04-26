namespace app.ui {
    export class CheckBox extends Laya.CheckBox {
        preinitialize() {
            super.preinitialize();
            this.toggle = true;
            this._autoSize = false;
        }

        initialize() {
            super.initialize();
            this.createText();
            this._text.align = "left";
            this._text.valign = "top";
            this._text.width = 0;
            // this.enableAnimating = false;
        }

        protected onMouse(e: Laya.Event) {
            super.onMouse(e);
            if (e.type === Laya.Event.CLICK) {
                // sound.playButtonSound();
            }
        }
    }
}
