// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.


const fs = require('fs-extra');
const path = require('path');
const { ipcRenderer, remote, clipboard } = require('electron');

// 向服务端发送消息
function sendIpc(msg) {
    ipcRenderer.send('CLIENT-MESSAGE', msg);
}
// 复制字符串
function copy(str) {
    clipboard.writeText(str);
}

window.onload = () => {
    let layaDiv = document.querySelector('#layaContainer');
    layaDiv.addEventListener("drop", event => {
        //阻止e的默认行为
        event.preventDefault(); 
        const files = event.dataTransfer.files;
        filesDraged(files);
    })
    //这个事件也需要屏蔽
    layaDiv.addEventListener("dragover",event => {
        event.preventDefault();
    })

    refreshConfig();
}

// 处理服务端发送过来的消息
ipcRenderer.on('SERVER-MESSAGE', (event, msg) => {
    let splitIndex = msg.indexOf(':');
    let cmd = splitIndex < 0 ? msg : msg.substr(0, splitIndex);
    let content = splitIndex < 0 ? '' : msg.substr(splitIndex + 1);
    console.log(`received cmd -> ${cmd}:${content}`);
    
    if (cmd === 'openImage') {
        // 这里只处理这个数据
        openImage(content);
    } else if (cmd === 'refreshConfig') {
        // 刷新配置
        refreshConfig();
    }
    // 这些在ts项目中看逻辑
    ipcReceived(cmd, content);
})

let curMapPath;
function openImage(imgPath) {
    let imgName = path.basename(imgPath).replace(/\.png|\.jpg/, '');
    curMapPath = path.join(config.out_path, imgName);
    console.log(`地图输出目录：${curMapPath}`);
    if (fs.existsSync(curMapPath)) {
        const options = {
            type: 'info',
            title: '覆盖警告',
            message: `目录${curMapPath}非空，是否覆盖该目录？`,
            buttons: ['确定', '取消']
        };
        remote.dialog.showMessageBox(options, index => {
            if (0 === index) {
                console.log('删除原目录中...');
                rmDir(curMapPath);
                console.log('开始图片分割');
                cropMapImages(imgPath);
            } else {
                console.log('取消图片分割.');
            }
        });
    } else {
        console.log('开始图片分割');
        cropMapImages(imgPath);
    }
}

function cropMapImages(imgPath) {
    let img = document.createElement('img');
    img.src = imgPath;
    console.log(config.tileHeight, config.tileWidth);
    app.common.showInfo('图片切割中...');
    img.onload = function() {
        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d");
        let width = img.width;
        let height = img.height;
        let hNum = Math.ceil(width / config.tileWidth);
        let vNum = Math.ceil(height / config.tileHeight);
        console.log(width, height, hNum, vNum);

        // 输出radar图片
        let radarWidth = 512;
        let radarHeight = Math.round(radarWidth / width * height);
        saveImage(img, canvas, ctx, 'radar.jpg',
            0, 0, width, height, 0, 0, radarWidth, radarHeight, 
            function(err) {
            if (!err) {
                console.log('输出radar.jpg成功');
            } else {
                console.error('输出图片radar.jpg失败');
                console.error(err);
            }
        });

        // 输出small图片
        let smallHeight = 256;
        let smallWidth = Math.round(smallHeight / height * width);
        saveImage(img, canvas, ctx, 'small.jpg',
            0, 0, width, height, 0, 0, smallWidth, smallHeight, 
            function(err) {
            if (!err) {
                console.log('输出small.jpg成功');
            } else {
                console.error('输出图片small.jpg失败');
                console.error(err);
            }
        });

        // 输出map.json
        let mapJson = {};
        let mapJsonPath = path.join(curMapPath, 'map.json');
        mapJson.width = width;
        mapJson.height = height;
        mapJson.cellSize = config.cellSize;
        mapJson.tileWidth = config.tileWidth;
        mapJson.tileHeight = config.tileHeight;
        mapJson.roadFlags = {}
        fs.outputFile(mapJsonPath, JSON.stringify(mapJson, null, '\t'), err => {
            if (!err) {
                console.log('生成文件map.json成功');
            } else {
                console.err('生成map.json失败');
                console.err(err);
            }
        });

        let successNum = 0;
        let total = hNum * vNum;
        for (let i = 0; i < hNum; ++i) {
            for (let j = 0; j < vNum; ++j) {
                let w = (i + 1) * config.tileWidth > width ? width - i * config.tileWidth : config.tileWidth;
                let h = (j + 1) * config.tileHeight > height ? height - j * config.tileHeight : config.tileHeight;
                saveImage(img, canvas, ctx, `${i}_${j}.jpg`,
                    i * config.tileWidth, j * config.tileHeight, w, h, 0, 0, w, h, 
                    function(err) {
                    if (!err) {
                        ++successNum;

                        app.common.showInfo(`图片切割中 ( ${successNum} / ${total} )`);
                        if (successNum >= total) {
                            console.log('输出成功');
                            app.common.openMapFolder(curMapPath);
                        }
                    } else {
                        console.error(err);
                        console.error('图片失败: ' + outTilePath);
                    }
                });
            }
        }
    } 

    function saveImage(img, canvas, ctx, saveName, sx, sy, sw, sh, dx, dy, dw, dh, cb) {
        canvas.width = dw;
        canvas.height = dh;
    
        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
        let imageString = canvas.toDataURL().split(',')[1];
        imgBuffer = Buffer.from(imageString, 'base64');
    
        let outTilePath = path.join(curMapPath, saveName);
        fs.outputFile(outTilePath, imgBuffer, cb);
    }
}

function refreshConfig() {
    // 开始读取全局配置
    // console.log(path.)
    config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'))
    fs.readFile('./config.json', 'utf-8', (err, jsonStr) => {
        if (!err) {
            config = JSON.parse(jsonStr);
            console.log('全局配置信息：', config);
            
            config.assets_path = app.common.slashSuffix(config.assets_path);
            config.effect_folder = app.common.slashSuffix(config.effect_folder);
            Laya.URL.basePath = config.assets_path;
        } else {
            console.error(err);
        }
    });
}

function rmDir(folder) {
    let { readdirSync, existsSync, unlinkSync, statSync, rmdirSync } = fs;
    if (existsSync(folder)) {
        readdirSync(folder).forEach(file => {
            let curPath = path.join(folder, file);
            if(statSync(curPath).isDirectory()) {
                rmDir(curPath);
            } else {
                unlinkSync(curPath);
            }
        });
        rmdirSync(folder);
    }
}

/// 下面逻辑是修改地图数据map.json
let editingMapPath; /// 会在ts项目中赋值
let editingMapInfo; /// 会在ts项目中赋值

function saveMapInfo() {
    console.log('调用了saveMapInfo');
    let mapJsonPath = path.join(editingMapPath, 'map.json');
    fs.outputFile(mapJsonPath, JSON.stringify(editingMapInfo, null, '\t'));
}
