const fs = require('fs-extra');
const path = require('path');
const config = require('./index');

function getGameVersion() {
    let versionFile = path.join(config.projectPath, 'src/version.ts');
    if (fs.existsSync(versionFile)) {
        let fileContent = fs.readFileSync(versionFile, 'utf-8');
        let matches = fileContent.match(/version\s=\s['"](.*)['"]/);
        if (matches && matches.length >= 2) {
            return matches[1];
        }
    }
    return '0';
}

function getResVersion() {
    let versionFile = path.join(config.projectPath, 'src/version.ts');
    if (fs.existsSync(versionFile)) {
        let fileContent = fs.readFileSync(versionFile, 'utf-8');
        let matches = fileContent.match(/resVersion\s=\s['"](.*)['"]/);
        if (matches && matches.length >= 2) {
            return matches[1];
        }
    }
    return '0';
}

function ProjectConfig() {
    let configFile = path.join(config.projectPath, 'mctool.laya');
    let configObj = JSON.parse(fs.readFileSync(configFile));

    this.engineVersion = configObj.version || '0';
    this.gameVersion = getGameVersion();
    this.resVersion = getResVersion();
    this.modules = {};
    configObj.modules.forEach(module => {
        var moduleType = module.type || 'engine';
        var moduleFiles = this.modules[moduleType] || (this.modules[moduleType] = [])
        moduleFiles.push(module);
    })
}

ProjectConfig.prototype.getMinifyFiles = function(type) {
    var files = [];
    var modules = this.modules[type];
    modules.forEach(module => {
        if (!module.minify)
            return;
        files = files.concat(module.files ? module.files : [`${module.name}/${module.name}.js`]);
    })
    return files.map(file => 'libs/' + file);
}

ProjectConfig.prototype.getModuleFilesByType = function(type, isMinify) {
    var modules = this.modules[type] || [];
    var files = [];
    modules.forEach(module => {
        if (type === 'engine') {
            if (isMinify)
                files.push(`laya/min/laya.${module.name}.min.js`);
            else
                files.push(`laya/laya.${module.name}.js`);
            return;
        }
        if (isMinify && module.miniFiles) {
            module.miniFiles.forEach(file => file.indexOf('/') > 0 ? files.push(file) : files.push(`${module.name}/${file}`));
            return;
        }
        if (module.files) {
            module.files.forEach(file => {
                file = isMinify ? file.replace(/(.min)?.js$/, '.min.js') : file;
                file.indexOf('/') > 0 ? files.push(file) : files.push(`${module.name}/${file}`)
            });
        } else {
            var file = `${module.name}/${module.name}.js`;
            file = isMinify ? file.replace(/(.min)?.js$/, '.min.js') : file;
            files.push(file);
        }
    })
    return files.map(file => 'libs/' + file);
}

ProjectConfig.prototype.getEngineVersion = function() {
    return this.engineVersion;
}

ProjectConfig.prototype.getGameVersion = function() {
    // return this.gameVersion;
    return getGameVersion();
}

ProjectConfig.prototype.getResVersion = function() {
    // return this.resVersion;
    return getResVersion();
}


module.exports = ProjectConfig;