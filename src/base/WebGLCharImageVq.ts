namespace app.ui {
    export class WebGLCharImageVq extends Laya.Bitmap implements Laya.IMergeAtlasBitmap {

        private CborderSize:number;
		private _ctx:any;
		/***是否创建私有Source*/
		private _allowMerageInAtlas:boolean;
		/**是否允许加入大图合集*/
		private _enableMerageInAtlas:boolean;
		/**HTML Canvas，绘制字符载体,非私有数据载体*/
		public canvas:any;
		/**********************************************************************************/
		public cw:number;
		public ch:number;
        public xs:number;
        public ys:number;
		public char:string;
		public fillColor:string;
		public borderColor:string;
		public borderSize:number;
		public font:string;
		public fontSize:number;
		public texture:Laya.Texture;
		public lineWidth:number;
		public UV:Array<any>;
		public isSpace:boolean;
		public underLine:number;

  /**
		 * WebGLCharImage依赖于外部canvas,自身并无私有数据载体
		 * @param	canvas
		 * @param	char
		 */
		constructor(content:string, drawValue:any) {
            super();
            this.CborderSize = 0;
            this.char = content;
            this.isSpace = content === ' ';
            this.xs = drawValue.scaleX;
            this.ys = drawValue.scaleY;
            this.font = drawValue.font.toString();
            this.fontSize = drawValue.font.size;
            this.fillColor = drawValue.fillColor;
            this.borderColor = drawValue.borderColor;
            this.lineWidth = drawValue.lineWidth;
            this.underLine = drawValue.underLine;
            var bIsConchApp = Laya.Render.isConchApp;
            var pCanvas;
            if (bIsConchApp) {
            // /*__JS__ */pCanvas = ConchTextCanvas;
            // /*__JS__ */pCanvas._source = ConchTextCanvas;
            // /*__JS__ */pCanvas._source.canvas = ConchTextCanvas;
            } else {
                pCanvas = Laya.Browser.canvas.source;
            }
            this.canvas = pCanvas;
            this._enableMerageInAtlas = true;
            if (bIsConchApp) {
            /*__JS__ */this._ctx = pCanvas;
            } else {
                this._ctx = this.canvas.getContext('2d', undefined);
            };
            var t = Laya.Utils.measureText(this.char, this.font);
            this.cw = t.width * this.xs;
            this.ch = (t.height || this.fontSize) * this.ys;
            this.onresize(this.cw + this.CborderSize * 2, this.ch + this.CborderSize * 2);
            this.texture = new Laya.Texture(this);
        }
        
        public active():void{
			this.texture.active();
		}
		
		
		public get atlasSource():any {
			return this.canvas;
		}
		
		/**
		 * 是否创建私有Source
		 * @return 是否创建
		 */
		public get allowMerageInAtlas():boolean {
			return this._allowMerageInAtlas;
		}
		
		/**
		 * 是否创建私有Source
		 * @return 是否创建
		 */
		public get enableMerageInAtlas():boolean {
			return this._enableMerageInAtlas;
		}
		
		/**
		 * 是否创建私有Source,通常禁止修改
		 * @param value 是否创建
		 */
		public set enableMerageInAtlas(value:boolean) {
			this._enableMerageInAtlas = value;
        }
        
        protected recreateResource(){
            var bIsConchApp = Laya.Render.isConchApp;
			this.onresize(this.cw + this.CborderSize * 2, this.ch + this.CborderSize * 2);
			this.canvas && (this.canvas.height = this._h, this.canvas.width = this._w);
			if (bIsConchApp) {
				var nFontSize = this.fontSize;
				if (this.xs != 1 || this.ys != 1) {
					nFontSize = parseInt(nFontSize * ((this.xs > this.ys) ? this.xs : this.ys) + "");
				};
				var sFont = "normal 100 " + nFontSize + "px Arial";
				if (this.borderColor) {
					sFont += " 1 " + this.borderColor;
				}
				this._ctx.font = sFont;
				this._ctx.textBaseline = "top";
				this._ctx.fillStyle = this.fillColor;
				this._ctx.fillText(this.char, this.CborderSize, this.CborderSize, null, null, null);
			} else {
				this._ctx.save();
				(this._ctx).clearRect(0, 0, this.cw + this.CborderSize * 2, this.ch + this.CborderSize * 2);
				this._ctx.font = this.font;
				if (Laya.Text.RightToLeft) {
					this._ctx.textAlign = "end";
				}
				this._ctx.textBaseline = "top";
				this._ctx.translate(this.CborderSize, this.CborderSize);
				if (this.xs != 1 || this.ys != 1) {
					this._ctx.scale(this.xs, this.ys);
				}
				if (this.fillColor && this.borderColor) {
					this._ctx.strokeStyle = this.borderColor;
					this._ctx.lineWidth = this.lineWidth;
					this._ctx.strokeText(this.char, 0, 0, null, null, 0, null);
					this._ctx.fillStyle = this.fillColor;
					this._ctx.fillText(this.char, 0, 0, null, null, null);
				} else {
					if (this.lineWidth === -1) {
						this._ctx.fillStyle = this.fillColor ? this.fillColor : "white";
						this._ctx.fillText(this.char, 0, 0, null, null, null);
					} else {
						this._ctx.strokeStyle = this.borderColor ? this.borderColor : 'white';
						this._ctx.lineWidth = this.lineWidth;
						this._ctx.strokeText(this.char, 0, 0, null, null, 0, null);
					}
				}
				if (this.underLine) {
					this._ctx.lineWidth = 1;
					this._ctx.strokeStyle = this.fillColor;
					this._ctx.beginPath();
					this._ctx.moveTo(0, this.fontSize + 1);
					var nW = this._ctx.measureText(this.char).width + 1;
					this._ctx.lineTo(nW, this.fontSize + 1);
					this._ctx.stroke();
				}
				this._ctx.restore();
			}
			this.borderSize = this.CborderSize;
			this.completeCreate();
        }

        private onresize(w:number, h:number){
            this._w = w;
            this._h = h;
            this._allowMerageInAtlas = true;
        }

        public clearAtlasSource(){}

      
    }
}
