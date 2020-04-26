// TypeScript file
namespace app {
    export function loadScripts(source: string | string[], cb?: () => void) {
        let scripts = typeof source === 'string' ? [source] : source;
        let head = document.getElementsByTagName('head')[0];
        let count = scripts.length;
        for (let i = 0; i < scripts.length; i++) {
            let script = document.createElement('script');
            script.type = 'text/javascript';
            script.onload = () => {
                count--;
                if (count == 0 && cb) {
                    cb();
                }
            }
            script.onerror = e => {
                //console.log(e);
            }
            script.src = scripts[i];
            head.appendChild(script);
        }
    }
}


