var glob = require('glob');
var path = require('path');
var fs = require('fs-extra');
var parseString = require('xml2js').parseString;
var config = require('../config');
var ResStyles = require('./ResStyles');

var fileTypes = {
    '.ani': 'Animation',
    '.part': 'Particle',
    '.scene': 'Scene',
    '.temp': 'UITemplate',
    '.ui': 'Page'
};

var resLoaderTypes = {
    '.st': 'st',
    '.mc': 'mc',
    '.atlas': 'atlas',
    '.fnt': 'font',
    '.json': 'atlas',
    '.xml': 'xml',
    '.png': 'image',
    '.jpg': 'image',
    '.mp3': 'sound',
    '.wav': 'sound'
}

var compConfigs = {};
function loadCompConfig(configPath) {
    var files = ['', 'custom'].map(dir => path.join(configPath, dir, 'laya.editorUI.xml'));
    files.forEach((file) => {
        var content = fs.readFileSync(file, 'utf8');
        parseString(content, {explicitArray: false}, (err, result) => {
            if (err) throw err;
            var uiComp = result.uiComp;
            for (key in uiComp) {
                compConfigs[key] = uiComp[key];
            }
        });
    });
}(config.uiCompConfigPath);

exports.pageStyles = new ResStyles(ResStyles.TypePage, config.pageStyleFile);
exports.resStyles = new ResStyles(ResStyles.TypeRes, config.resStyleFile);

exports.getCompProp = function(compName, attrName, defaultValue) {
    var comp = compConfigs[compName];
    if (!comp) return defaultValue;
    var attrs = comp.$;
    if (!attrs) return defaultValue;
    var attrValue = attrs[attrName];
    if (!attrValue) {
        var inherit = attrs.inherit;
        if (inherit)
            return exports.getCompProp(inherit, attrName, defaultValue);
        return defaultValue;
    }
    return attrValue;
}

exports.getResLoaderType = function(extName) {
    return resLoaderTypes[extName] || 'binary';
}

exports.getFileType = function(fileName) {
    var extName = path.extname(fileName)
    return fileTypes[extName] || 'unknown';
}

exports.getFileName = function(fileName) {
    var fileName = path.basename(fileName);
    var ext = path.extname(fileName);
    return fileName.substr(0, fileName.length - ext.length);
}

exports.getModuleName = function(source) {
    if (path.isAbsolute(source))
        source = path.relative(config.pagesPath, source);
    return path.dirname(source).replace(/\//g, '.');
}
