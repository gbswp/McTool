namespace app.ui {
    export class TextInput extends Laya.TextInput {
        static inputItem: TextInput;
        protected createChildren(): void {
            super.createChildren();
            this._clear();
            if (Laya.Render.isConchApp && Laya.Browser.onAndroid) {
                this.on(Laya.Event.CLICK, this, this._showNative);
                this._tf.mouseEnabled = false;
            }
        }

        updateText(text: string) {
            this.text = text;
            TextInput.inputItem = null;
            Laya.stage.off(Laya.Event.MOUSE_DOWN, this, this._closeShowNative);
        }

        private _showNative() {
            if (!TextInput.inputItem) {
                TextInput.inputItem = this;
                // JSProxy.showNativeEditTextView(this.text);
                Laya.stage.on(Laya.Event.MOUSE_DOWN, this, this._closeShowNative);
            }
        }

        private _closeShowNative() {
            if (TextInput.inputItem) {
                //TextInput.inputItem = null;
                // JSProxy.hideNativeEditTextView();
                Laya.stage.off(Laya.Event.MOUSE_DOWN, this, this._closeShowNative);
            }
        }

        private _clear() {
            TextInput.inputItem = null;
            this.off(Laya.Event.CLICK, this, this._showNative);
            Laya.stage.off(Laya.Event.MOUSE_DOWN, this, this._closeShowNative)
        }

        destroy(destroyChild: boolean = true) {
            this._clear();
            super.destroy(destroyChild);
        }
    }
}
