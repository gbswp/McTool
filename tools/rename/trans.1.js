var path = require('path');
var fs = require('fs-extra');
var glob = require('glob');
var sharp = require('sharp');
var PromisePool = require('es6-promise-pool');
var ProgressBar = require('progress');

const ratio = 0.7
function convertImage(sourceFile, destFile) {
    var sourcePath = path.dirname(sourceFile);
    var destPath = path.dirname(destFile);
    var data = JSON.parse(fs.readFileSync(sourceFile));
    var baseFileName = path.basename(sourceFile);
    convertJson(data);
    fs.outputFileSync(destFile, JSON.stringify(data, null, 4));
    return Promise.resolve();
}

function convertJson(data) {
    var res = data.res;
    for (var key in res) {
        var value = res[key];
        value.x = +value.x ;
        value.y = +value.y;
        value.w = +value.w;
        value.h = +value.h;
    }
    var mc = data.mc;
    for (var key in mc) {
        var motion = mc[key];
        var frames = motion.frames;
        for (var k in frames) {
            var value = frames[k];
            value.x = +value.x;
            value.y = +value.y;
        }
        if (motion.scale == null) {
            motion.scale = 1;
        }
        motion.scale = +motion.scale;
    }

}

function convert(sourcePath, destPath) {
    var files = glob.sync('**/*.json', {cwd: sourcePath})
    var totalCount = files.length;
    var bar = new ProgressBar(':bar', { total: totalCount, width: 50 });
    return new PromisePool(() => {
        if (files.length == 0)
            return null;
        var file = files.shift();
        return convertImage(path.join(sourcePath, file), path.join(destPath, file)).then(() => bar.tick());
    }, 3).start();
}

if (require.main == module) {
    var argv = require('yargs')
        .option('fightPath', { describe: 'fight.d的目录地址' })
        .option('module', { describe: 'module名字' })
        .argv;

    var fightPath = argv.fightPath;
    var moduleName = argv.module;
    var fightPath2 = path.join(path.dirname(fightPath), 'fight2');
    var sourcePath = path.join(fightPath, moduleName);
    var destPath = path.join(fightPath2, moduleName);
    if (!fs.existsSync(sourcePath)) {
        console.error(`${sourcePath} not exists`);
        return;
    }
    convert(sourcePath, destPath);
}
