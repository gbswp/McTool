var fs = require('fs');
var path = require('path');
var parseString = require('xml2js').parseString;
var config = require('../config');
var _ = require('lodash');

var specialFiles = [
    '$down.png',
    '$bar.png',
    '$up.png',
    '$select.png', // Button中的select
];

// 目前PageStyle与ResStyle复用
function ResStyles(resType, styleFile) {
    this.resType = resType;
    this.styleItems = {};
    this.parseStyleFile(styleFile);
}

ResStyles.TypeRes = 'res';
ResStyles.TypePage = 'page';

ResStyles.prototype.parseStyleFile = function(styleFile) {
    if (!path.isAbsolute(styleFile))
        styleFile = path.join(config.projectPath, styleFile);
    if (!fs.existsSync(styleFile))
        return;
    var resBaseName = (this.resType == ResStyles.TypeRes) ? config.assetsPath : config.pagesPath;
    var resPath = path.join(config.projectPath, resBaseName);
    var content = fs.readFileSync(styleFile, 'utf-8');
    parseString(content, {explicitArray: false}, (err, result) => {
        if (err) throw err;
        var root = result ? result[this.resType] : null;
        if (!root || !root.item) return;
        _.each(root.item, item => {
            var attrs = item.$ ? item.$ : item;
            var name = attrs.name;
            attrs.name = path.join(resBaseName, name);
            this.styleItems[name] = attrs;
            var attrProps = attrs.props;
            attrs.props = {};
            if (!attrProps)
                return;
            var props = attrProps.split('@@!@@');
            _.each(props, prop => {
                var keyValue = prop.split('=');
                var value = keyValue[1];
                if (parseFloat(value) == value)
                    value = parseFloat(value);
                attrs.props[keyValue[0]] = value;
            });
        })
    });
}

ResStyles.prototype.getWhiteList = function() {
    return this.getList(item => item.pack == 1);
}

ResStyles.prototype.getBlackList = function() {
    return this.getList(item => item.pack == 2);
}

ResStyles.prototype.getRepeatList = function() {
    return this.getList(item => item.picType == 1);
}

ResStyles.prototype.getProps = function(skin) {
    var item = this.styleItems[skin];
    if (item && item.props)
        return item.props;
    return {};
}

// 仅用于TypeRes类型
ResStyles.prototype.getList = function(predicate) {
    var files = [];
    _(this.styleItems).filter(predicate).each(item => {
        if (fs.existsSync(path.join(config.projectPath, item.name)))
            files.push(item.name);
        _.each(specialFiles, fileTag => {
            var file = item.name.replace(/\.png$/, fileTag);
            if (fs.existsSync(path.join(config.projectPath, file)))
                files.push(file);
        });
    });
    return files.join(',');
}

module.exports = ResStyles;
