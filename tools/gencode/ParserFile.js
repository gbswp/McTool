var helper = require('../genui/helper');
var fs = require('fs-extra');
var config = require('../config')
var _ = require('lodash');
var dust = require('dustjs-helpers');
require('./templates');
var appExtendViewPostfix = ['View', 'Dlg'];
function ParserFile() {
    this.moduleName = "";
    this.className = "";
    this.parentName = "";
    this.hasEvents = false;
    this.eventStr = "";
    this.isDlg = false;
}

ParserFile.prototype.parse = function (fileName) {
    this.moduleName = helper.getModuleName(fileName);
    this.className = helper.getFileName(fileName);
    this.isDlg = this.className.endsWith("Dlg");
    var needGen = _.some(appExtendViewPostfix, name => this.className.endsWith(name));
    if (!needGen) return false;
    this.parentName = this.className + "UI";
    var content = fs.readFileSync(config.uiCodeFile, 'utf8');
    let reg = new RegExp(`export interface I${this.parentName} \\{([^{}]*)\\}`);
    let arr = [];
    this.hasEvents = reg.test(content);
    if (this.hasEvents) {
        var result = content.match(reg);
        let eventStr = result[1].replace(/\?/g, "");
        arr = eventStr.split(";");
        let index = _.findIndex(arr, str => str.indexOf("onBtnCloseClick") != -1);
        if (index > -1) arr.splice(index, 1);
        index = _.findIndex(arr, str => str.indexOf("onBtnBackClick") != -1);
        if (index > -1) arr.splice(index, 1);
        index = _.findIndex(arr, str => str.indexOf("onBtnHelpClick") != -1);
        if (index > -1) arr.splice(index, 1);
    }
    let eventStrArr = [];
    arr.forEach(eventStr => {
        let reg = /\S/g;
        if (reg.test(eventStr)) {
            eventStrArr.push(eventStr + " { }");
        }
    })

    var outpath = `src/${this.moduleName}/${this.className}.ts`;
    if (!fs.existsSync(outpath)) {
        this.eventStr = eventStrArr.join("\n");
        dust.render('class', this, function (err, out) {
            if (err) return console.log(err);
            fs.outputFileSync(outpath, out);
        })
    } else {
        let classStr = fs.readFileSync(outpath, 'utf8');
        eventStrArr.forEach(str => {
            let funcName = str.substr(0, str.indexOf("("));
            funcName = _.trim(funcName);
            let nothas = classStr.indexOf(funcName) == -1;
            if (nothas && ["onBtnCloseClick", "onBtnBackClick", "onBtnHelpClick"].indexOf(funcName) == -1) {
                let match = /(\sonCreate\(\)\s\{[\s\S]*?\})\s/g;
                str = str.replace(/(\r\n)*/g, "");
                classStr = classStr.replace(match, `$1\n\n${str}\n`);
            }
        })
        fs.writeFileSync(outpath, classStr);
    }

    return true;
}

module.exports = ParserFile;
