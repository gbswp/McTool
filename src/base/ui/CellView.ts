/// <reference path="./View.ts" />
namespace app.ui {
    export class CellView extends View {
        static EVENT_CHILD_VIEW_CLICK = '__cell_child_view_click__';
        _index: number;

        updateData<T>(data: T, index?:number) {
        }

        // 把所有子控件的事件路由给ListView
        // registerEvents(eventsInfo: {[compName: string]: string[]}) {
        //     for (let compName in eventsInfo) {
        //         let comp = (this as any)[compName] as Laya.Node;
        //         let events = eventsInfo[compName];
        //         events.forEach(event => {
        //             if (event === "click") {
        //                 comp.on(Laya.Event.CLICK, this, (e: Laya.Event) => {
        //                     let parent = this.getList();
        //                     if (parent) {
        //                         parent.event(CellView.EVENT_CHILD_VIEW_CLICK, [e, this._index, compName]);
        //                     }
        //                 });
        //             }
        //         });
        //     }
        // }

        protected registerEvent(compInfo: {name: string, comp: any}, event: string) {
            let comp = compInfo.comp;
            if (event === "click") {
                comp.on(Laya.Event.CLICK, this, (e: Laya.Event) => {
                    let parent = this.getList();
                    if (parent) {
                        parent.event(CellView.EVENT_CHILD_VIEW_CLICK, [e, this._index, compInfo.name]);
                    }
                });
            }
            super.registerEvent(compInfo, event);
        }

        getList(): List {
            let parent = this.parent;
            while(!(parent instanceof List) && parent != null)
                parent = parent.parent;
            return parent as any;
        }
    }
}
