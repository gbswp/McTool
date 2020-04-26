declare class KVData {
    key: string;
    value: string;
}
declare class FileObject {
    filePath: string;
    encoding: string;
    success: (data: string | ArrayBuffer) => void;
    fail: (data: { errMsg: string }) => void
}
declare class FileSystemManager {
    readFile(obj: FileObject): void;
}

declare class UserGameData {
    avatarUrl: string;
    nickName: string;
    openId: string;
    KVList: Array<KVData>;
}

declare class OpenDataContext {
    canvas: any;
    postMessage(message: Object): void;
}

declare class UpdateManager {
    onCheckForUpdate(callBack: (res: { hasUpdate: boolean }) => void): void;
    onUpdateReady(callback: () => void): void;
    applyUpdate(): void;
    onUpdateFailed(callback: () => void): void;
}

declare class Style {
    left: number;
    top: number;
    width: number;
    height: number;
}

declare class GameClubButton {
    style?: Style;
    onTap?(callback: (res: Object) => void): void;
    show(): void;
    hide(): void;
}

declare class CustomerServiceObject {
    sessionFrom?: string;
    showMessageCard?: boolean;
    sendMessageTitle?: string;
    sendMessagePath?: string;
    sendMessageImg?: string;
    success?: () => void;
    fail?: () => void;
    complete?: () => void;
}
declare class UserInfoButton {
    text: string;
    image: string;
    style: InfoButtonStyle;

    show(): void;
    hide(): void;
    destroy(): void;
    onTap(callback: (userInfo: UserInfo, rawData: string, signature: string, encryptedData: string, iv: string) => void): void;
    offTap(callback: () => void): void;
}


declare class UserInfo {
    language: string;
    nickName: string;
    avatarUrl: string;
    gender: number;
    country: string;
    province: string;
    city: string;
}

interface InfoButtonStyle {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    textAlign?: string;
    fontSize?: number;
    lineHeight?: number;
    color?: string;
}

interface LaunchOpt {
    scene: number;
    query: Object;
    isSticky: boolean;
    shareTicket: string
}

declare class wx {
    static getFileSystemManager(): FileSystemManager;
    static getFriendCloudStorage(obj: { keyList: Array<string>, success?: (data: Array<UserGameData>) => void, fail?: () => void, complete?: () => void }): void;//^1.9.92
    static getGroupCloudStorage(obj: { shareTicket: string, keyList: Array<string> }, success?: (data: Array<UserGameData>) => void, fail?: () => void, complete?: () => void): void;//^1.9.92
    static getUserCloudStorage(obj: { keyList: Array<string>, success?: (data: Array<UserGameData>) => void, fail?: () => void, complete?: () => void }): void;//^1.9.92
    static setUserCloudStorage(obj: { KVDataList: Array<KVData>, success?: () => void, fail?: () => void, complete?: () => void }): void;//^1.9.92
    static removeUserCloudStorage(obj: { keyList: Array<string>, success?: () => void, fail?: () => void, complete?: () => void }): void;//^1.9.92
    static onShow(callBack: (res: { scene: string, query: Object, shareTicket: string }) => void): void;
    static onHide(callback: () => void): void
    static getOpenDataContext(): OpenDataContext;//^1.9.92
    static showShareMenu(obj: { withShareTicket?: boolean, success?: () => void, fail?: () => void, complete?: () => void }): void;//^1.1.0
    static onShareAppMessage(callback: () => void): void;
    static triggerGC(): void;
    static getUpdateManager(): UpdateManager;
    static showLoading(obj: { title: string, mask?: boolean, success?: () => void, fail?: () => void, complete?: () => void }): void;//^1.1.0
    static hideLoading(): void;//^1.1.0
    static getLaunchOptionsSync(): LaunchOpt;
    static createGameClubButton(obj: { icon: string, style: Style }): GameClubButton;//^2.0.3
    static downloadFile(obj: { url?: string, header?: any, filePath?: string, success?: (res: { tempFilePath: string, statusCode: number }) => void, fail?: (err: any) => void, complete?: () => void }): void;
    static createWorker(path: string): Worker;//^1.9.90
    static openCustomerServiceConversation(obj: CustomerServiceObject): void;//^2.0.3
    static exitMiniProgram(obj?: any): void;
    static showToast(obj: { title: string, icon: string, image: string }): void;
    static showModal(obj: any): void;
    static getSystemInfoSync(): { model: string };
    static previewImage(parm: any): void;
    static getSystemInfo(): any;
    static createUserInfoButton(obj: { type: string, text?: string, image?: string, style?: InfoButtonStyle }): UserInfoButton;
    static vibrateLong(opts: { success: Function, fail: Function, complete: Function }): void;
    static vibrateShort(opts: { success: Function, fail: Function, complete: Function }): void;
    static setClipboardData(opt: { data: string, success: Function, fail: Function, complete: Function }): void;
}

declare var __wxConfig: {
    platform: string;
    debug: boolean;
}

declare var __devtoolsConfig: {
    urlCheck: boolean
}

declare class canvas {
    static toTempFilePathSync(obj: { x?: number, y?: number, width?: number, height?: number, destWidth?: number, destHeight?: number, fileType?: string, quality?: number }): string;
}

declare class swan {
    static exit(): any;
    static setEnableDebug(opts: any): void;
    static vibrateLong(opts: { success: Function, fail: Function, complete: Function }): void;
    static vibrateShort(opts: { success: Function, fail: Function, complete: Function }): void;
    static onShow(callback: Function): void;
    static setClipboardData(opt: { data: string, success: Function, fail: Function, complete: Function }): void;

}

//vivo快游戏 小游戏
declare class qg {
    static readFile(obj: any): void;
    static setEnableDebug(data: any): void;
}

//头条录屏
declare class GameRecorderManager {
    start(obj: any): void;
    stop(): void;
    pause(): void;
    resume(): void;
    onStart(callback: (path: any) => void): Promise<any>;
    onStop(callback: (path: any) => void): Promise<any>;
    onPause(callback: (path: any) => void): Promise<any>;
    onResume(callback: (path: any) => void): Promise<any>;
    onError(callback: (error: string) => void): void;
}

declare class hGame {
    constructor(configs: any);
    protected init(): void;
    ready(r: any): void;
    protected doReady(): void;
    protected hdParametersHandle(): void;
    login(callback: any, data: any): void;
    pay(payData: any, payName: string, callback: any): void;
    protected requestPay(payData: any, callback: any): void;
    share(shareData: any, callback: any): void;
    setShareData(shareData: any, callback: any): void;
    protected handleShareTicket(shareTicket: any, callback: any): void;
    loadingProgress(p: number): void;
    getPlatform(callback: any): void;
    callPsdk(funcName: string, argArr: any[]): void;
    gameReport(action: string, baseData: any, extendData: any, callback: any): void;
    checkUic(data: any, callback: any): void;
    getQrcode(data: any, callback: any): void;
    decodeScene(str: string): string;
    customerServiceStart(reqData: any, pushChat: any, callback: any): void;
    customerServiceStop(callback: any): void;
    customerServicePost(reqData: any): void;
    customerServiceCheck(callback: any): void;
    wxCustomerServiceStart(reqData: any, callback: any): void;
    queryExtraStatus(data: any, callback: any): void;
    doExtraAction(action: string, data: any, callback: any): void;
    checkProxyOrder(orderno: any, callback: any, options: any): void;
    proxyOrderShare(orderno: any, callback: any): string;
    createRewardedVideoAd(data: any): any;
    navigateUserToMiniProgram(params: any, callback: any): void;
    setGameFunc(funcName: string, func: Function): void;
    // 腾讯取消了
    // topBarText(text: string, callback: any): void;
    // setUserSnsData(data: any, callback: any): void

}

declare class VConsole{

}




