var fs = require('fs');
var path = require('path');
var config = require('../config');

var patches = [
    {
        fileName: 'libs/LayaAir.d.ts',
        changes: [
            {
                'match': /(class BitmapFont {)/,
                'append': [
                    'static registerFontRes(font: string, res: string): void;',
                ]
            },
            {
                'match': /(underlineColor: string;)/g,
                'append': [
                    'format: string;',
                    'value: string | any[];',
                    'setFont(font: string): void;'
                ]
            },
            {
                'match': /(class LoaderManager extends EventDispatcher {)/,
                'append': [
                    'loadP(url: any, type?: string, priority?: number, progress?: Handler, cache?: boolean, group?: string, ignoreCache?: boolean): Promise<void>;'
                ]
            },

            {
                'match': /(class Component extends Sprite implements IComponent {)/,
                'append': [
                    'badge: boolean;',
                    'badgeStyle:IBadgeStyle;',
                    'badgeEnable: boolean;',
                    'updateBadge():void;',
                    'openKey:string'
                ]
            },
            {
                'match': /(class Loader extends EventDispatcher {)/,
                'append': [
                    'static clearTextureResByGroup(group:string): void;'
                ]
            },
            {
                'match': /[/]*(to\(target: any, props: any, duration: number, ease\?: Function, complete\?: Handler, delay\?: number, coverBefore\?: boolean\): Tween;)/,
                'replace': [
                    `to(target: any, props: any, duration: number, ease?: Function, complete?: Handler, delay?: number, coverBefore?: boolean): TweenWrapper;`
                ]
            },
            {
                'match': /[/]*(from\(target: any, props: any, duration: number, ease\?: Function, complete\?: Handler, delay\?: number, coverBefore\?: boolean\): Tween;)/,
                'replace': [
                    `from(target: any, props: any, duration: number, ease?: Function, complete?: Handler, delay?: number, coverBefore?: boolean): TweenWrapper;`
                ]
            },
            {
                'match': /[/]*(static to\(target: any, props: any, duration: number, ease\?: Function, complete\?: Handler, delay\?: number, coverBefore\?: boolean, autoRecover\?: boolean\): Tween;)/,
                'replace': [
                    `static to(target: any, props: any, duration: number, ease?: Function, complete?: Handler, delay?: number, coverBefore?: boolean, autoRecover?: boolean): TweenWrapper;`
                ]
            },
            {
                'match': /[/]*(static from\(target: any, props: any, duration: number, ease\?: Function, complete\?: Handler, delay\?: number, coverBefore\?: boolean, autoRecover\?: boolean\): Tween;)/,
                'replace': [
                    `static from(target: any, props: any, duration: number, ease?: Function, complete?: Handler, delay?: number, coverBefore?: boolean, autoRecover?: boolean): TweenWrapper;`
                ]
            },
            {
                'match': /(class Button extends Component implements ISelect {)/,
                'append': [
                    'soundId:string'
                ]
            },
            {
                'match': /(class Browser {)/,
                'append': [
                    'static onIPhoneX: boolean;'
                ]
            },

        ]
    }
]

// 这里只更新*.d.ts中的内容
function patchEngine() {
    patches.forEach(patch => {
        var targetFileName = path.join(config.projectPath, patch.fileName);
        var content = fs.readFileSync(targetFileName, 'utf-8');
        content = content.replace(/\s\/\* patch start \*\/[\s\S]*?\/\* patch end \*\//g, '');
        patch.changes.forEach(change => {
            // 加在匹配的目标项后面
            if (change.append) content = content.replace(change.match, '$1\n/* patch start */\n' + change.append.join('\n') + '\n/* patch end */');
            if (change.replace) content = content.replace(change.match, '//$1\n/* patch start */\n' + change.replace.join('\n') + '\n/* patch end */');
        })
        fs.writeFileSync(targetFileName, content);
    });
    return Promise.resolve();
}

module.exports = patchEngine;
