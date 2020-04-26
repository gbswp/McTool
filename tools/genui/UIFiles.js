var glob = require('glob');
var fs = require('fs-extra');
var path = require('path');
var config = require('../config');
var UIFile = require('./UIFile');
var _ = require('lodash');

function UIFiles() {
    this.parsedFiles = {};
    this.parsedFilesByClass = {};
}

UIFiles.prototype.parse = function () {
    var files = glob.sync('**/*.ui', { cwd: config.pagesPath });
    _.each(files, file => {
        if (this.parsedFiles[file])
            return;
        var uifile = new UIFile();
        if (uifile.parse(file))
            this.parsedFiles[file] = uifile;
    });
    _.each(this.parsedFiles, uifile => {
        uifile.postProcess(this);
    });
}

UIFiles.prototype.getUIFile = function (path) {
    return this.parsedFiles[path];
}

UIFiles.prototype.getUIFileByClass = function (className) {
    return this.parsedFilesByClass[className];
}

// 返回根据依赖关系排序好的uifile
UIFiles.prototype.getSortedFiles = function () {
    var result = [];
    for (var name in this.parsedFiles) {
        var uifile = this.parsedFiles[name];
        result = result.concat(getDependencies(uifile));
        result.push(name);
    }
    return _.uniq(result).map(name => this.parsedFiles[name]);


    function getDependencies(uifile) {
        var result = [];
        for (var name in uifile.dependencies) {
            var childfile = uifile.dependencies[name];
            result = result.concat(getDependencies(childfile));
            result.push(name);
        }
        return result;
    }
}

module.exports = UIFiles;
