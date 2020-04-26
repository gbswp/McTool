namespace app {
    interface IParam {
        webgl?: string,
        nowebgl?: string,
        openid?: string,
        [index: string]: string;
    }
    export class UrlParam {
        params: IParam = {};
        constructor() {
            if (config.isUseUrl) return;
            let params = window.location.search.substr(1);
            let paramsArr = params.split('&');
            for (let i = 0; i < paramsArr.length; i++) {
                let paramInfo = paramsArr[i].split('=');
                if (paramInfo.length == 1 && paramInfo[0].length > 0) {
                    this.params[paramInfo[0]] = '1';
                    continue;
                }

                if (paramInfo.length != 2)
                    continue;

                this.params[paramInfo[0]] = paramInfo[1];
            }
        }

        has(name: string): boolean {
            return this.params[name] != null;
        }

        get(name: string) {
            return this.params[name];
        }

        count(): number {
            return _.size(this.params);
        }

        get webglEnabled(): boolean {
            let params = this.params;
            if (params.nowebgl == '1')
                return false;
            if (params.webgl == '0')
                return false;
            return true;
        }

    }

    export let urlParam = new UrlParam();
}
