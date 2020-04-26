var glob = require('glob');
var fs = require('fs-extra');
var _ = require('lodash');
var path = require('path');
var ProtoItem = require('./ProtoItem');
var dust = require('dustjs-helpers');

function generate(fileName) {
    let protodir = require('./config.js').protodir;
    if (!protodir) {
        console.warn("请配置proto文件路径！");
        return;
    }
    let filePath = path.join(protodir, fileName + ".proto");
    var content = fs.readFileSync(filePath, "utf8");

    let protoMap = {};
    let reg = /message ([a-zA-Z]+)(Req|Ack|Ntf|Rpt)\s*\{([^{}]*)\}/g;
    let arr = reg.exec(content);
    while (arr) {
        let name = arr[1];
        let tag = arr[2];
        let item = protoMap[name];
        console.log(name);
        if (tag != "Ack") {
            if (!item) {
                item = new ProtoItem();
            }
            item.protoName = name;
            item.protoTag = tag;
            item.decodeParam(arr[3]);
            if (tag == "Ntf") item.isNtf = true;
        } else {
            item && (item.hasAck = true);
        }
        if (item) {
            item.initFunctionName();
            protoMap[item.protoName] = item;
        }
        arr = reg.exec(content);
    }

    let className = fileName.charAt(0).toLocaleUpperCase() + fileName.substr(1) + "Manager";
    let data = {
        className: className,
        name:fileName,
        protoItems: _.transform(protoMap, (result, value, key) => result.push(value), [])
    }

    var outpath = `src/manager/${className}.ts`;
    if (!fs.existsSync(outpath)) {
        dust.render('manager', data, function (err, out) {
            if (err) return console.log(err);
            fs.outputFileSync(outpath, out);
        })
    } else {
        let classStr = fs.readFileSync(outpath, 'utf8');
        data.protoItems.forEach(item => {
            let funcName = item.functionName;
            let nothas = classStr.indexOf(funcName) == -1;
            if (nothas) {
                dust.render('func', item, function (err, out) {
                    if (err) return console.log(err);
                    let match = /(\sconstructor\(\)\s\{[\s\S]*?\})\s/g;
                    classStr = classStr.replace(match, `$1\n${out}`);
                })
            }
        })
        fs.writeFileSync(outpath, classStr);
    }

    console.warn(`生成${className} success!`)
}

module.exports = generate;
