var fs = require('fs-extra');
var path = require('path');
var glob = require('glob');
var config = require('../config');
var dust = require('dustjs-helpers');
var _ = require('lodash');
require('./templates');

var datas = fs.readJsonSync(path.join(config.resourcePath, "data.json"));

function getMsgData() {
    let msgs = datas.soundCommons;
    let keyIndex = 1;
    let valueIndex = 0;
    let descIndex = 2;
    return _.transform(msgs, (results, values, index) => {
        let key = values[keyIndex];
        if (key) {
            key = key.toLocaleUpperCase();

            let value = values[valueIndex];
            let desc = values[keyIndex];
            results.push({ key: key, value: value, desc: desc })
        }
    }, []);
}

function generateMSg() {
    let data = { datas: getMsgData() };
    dust.render('soundcode', data, function (err, out) {
        if (err) return console.log(err);
        out = formatStr(out);
        fs.outputFileSync(path.join(config.codeGenPath, 'SoundId.ts'), out);
    });
    return Promise.resolve();
}

function formatStr(out) {
    out = out.replace(/\&lt\;/g, "<");
    out = out.replace(/\&gt\;/g, '>');
    out = out.replace(/\&quot\;/g, '"');
    return out;
}

module.exports = generateMSg;
if (require.main == module) {
    generateMSg();
}
