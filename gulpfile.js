var fs = require('fs-extra');
var path = require('path');
var gulp = require('gulp');
var ts = require('gulp-typescript');
var gulpif = require('gulp-if');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var gulputil = require('gulp-util');
var gulpconnect = require('gulp-connect');
var sequence = require('run-sequence');
var config = require('./tools/config');
var genhtml = require('./tools/genhtml');
var execSync = require('child_process').execSync;

var _ = require('lodash');
// var excel2json = require('gulp-excel2json');

const argv = require('yargs')
    .help('h')
    .option('minify', { describe: '编译时minify目标js文件', type: "boolean", default: false })
    .option('minify_drop_console', { describe: 'minify时删除console.x', type: "boolean", default: false })
    .option('noVersionTag', { describe: '资源url不加version后缀', type: "boolean", default: false })
    .option('dpath', { type: 'string', describe: '指定发布目录' })
    .option('target', { describe: '指定发布的目标平台', choices: ['web', 'native', 'wx', 'wxdev', 'bd', 'bddev', 'vq', 'vqdev', 'tt', 'ttdev'], default: 'web' })
    .option('uipack', { describe: '要生成代码的目标ui包' })
    .option('dynview', { describe: '是否生成动态加载的界面描述文件', type: "boolean", default: true })
    .option('noRes', { describe: '不需要发布res目录', type: "boolean", default: false })
    .option('pb', { describe: '要生成协议的proto文件' })
    .option('path', { alias: 'p', describe: '指定本次全量版本的路径' })
    .option('patchbase', { alias: 'b', describe: '指定补丁制作的基准版本的发布日期或基准版本的git标签' })
    .option('subpath', { describe: '指定res/assets下需要压缩的子路径：如：item.d' })
    .option('zip', { alias: 'z', describe: '压缩发布文件' })
    .option('error_break', { alias: 'eb', describe: 'ts->js时要不要break.', type: 'boolean', default: false })
    .option('head', { describe: '根据head同步svn资源', type: 'number' })
    .option('md5', { type: 'boolean', describe: "启用md5进行资源版本管理", default: false })
    .option('repack', { type: 'boolean', describe: "是否全部重新打包", default: false })
    .option('file', { type: 'string', describe: "文件路径" })
    .option('vconsole', { type: 'boolean', describe: "vconsole调试控制台", default: false })
    .argv;

var tsProject = ts.createProject('tsconfig.json');

gulp.task('init', function() {
    return require('./tools/initer')();
})

gulp.task("compile", function() {
    return tsProject.src()
        .pipe(tsProject())
        .on('error', function() {
            if (argv.error_break) {
                console.error("gulp TypeScript->Javascript error:")
                process.exit(1);
            }
        })
        .js
        .pipe(gulpif(argv.minify, uglify({ compress: { drop_console: argv.minify_drop_console } })))
        .pipe(gulpif(argv.minify, rename({ extname: '.min.js' })))
        .pipe(gulp.dest('.')) // 输出路径根据tsconfig.json
        .pipe(genhtml.genIndex({ argv: argv }))
        .pipe(gulp.dest(''))
});


gulp.task('genui', function() {
    return require('./tools/genui')(argv);
});

gulp.task('makepatch', function() {
    return require('./tools/makepatch')(argv.path, argv.patchbase, argv.target, argv.zip, argv.md5);
});

gulp.task('makezip', function() {
    return require('./tools/makezip')(argv.path, argv.subpath);
});

gulp.task('gensheets', function() {
    return require('./tools/gensheets')();
})

gulp.task('packres', function() {
    return require('./tools/packres')(argv.md5);
})

// 增量打包， 增快速度
gulp.task('pack', function() {
    argv.md5 = true;
    return require('./tools/pack')(argv.md5, argv.repack);
});

gulp.task('watch', function() {
    return gulp.watch('src/**/*.ts', ['compile']);
})

gulp.task('run', function() {
    var listeningPort = 3000;
    require('browser-sync')({
        port: listeningPort,
        files: ['index.html', 'index.js', 'bin/js/**/*.js', 'app.js'],
        injectChanges: false,
        logFileChanges: false,
        logLevel: 'silent',
        logPrefix: '',
        notify: true,
        reloadDelay: 0,
        server: {
            baseDir: '.',
        },
        open: true
    });
    gulputil.log('Open http://localhost:' + String(listeningPort) + " in your browser manually,please.");
});

gulp.task('serve', function(cb) {
    sequence('genui', 'compile', 'watch', 'run', cb);
});

gulp.task('webserver', function() {
    gulpconnect.server({ host: '0.0.0.0', port: 3000 });
})

gulp.task('build', function(cb) {
    sequence('genui', 'compile', cb);
});

gulp.task('genmodel', cb => {
    return require('./tools/genmodel')();
});

gulp.task('gensound', cb => {
    return require('./tools/soundduration')();
});

gulp.task('release', function(cb) {
    if (argv.minify == undefined) {
        argv.minify = true;
    }
    argv.dynview = true;
    argv.md5 = true;
    sequence('gensheets', ['genui'], ['compile', 'pack'], cb);
});

gulp.task('dist', function(cb) {
    var publishPath = path.join(config.publishPath, argv.target, argv.dpath || "");
    switch (argv.target) {
        default: var files = ['index.html', 'index.js', 'favicon.ico', "img_load_logo.jpg"];
        //copy js
        var content = fs.readFileSync('index.js', 'utf8');
        var matches = content.match(/loadLib\("(libs|bin).*\.js/g)
        files = files.concat(matches.map(file => file.substr(file.indexOf('"') + 1)));
        let vconsoleFile = "libs/vconsole/vconsole.min.js";
        if (!files.includes(vconsoleFile)) files.push(vconsoleFile);
        files.forEach(file => fs.copySync(file, path.join(publishPath, file)));

        // copy res
        if (!argv.noRes) {
            fs.copySync(config.packedResPath, path.join(publishPath, config.packedResPath));
        } else {
            var others = settings.metaResources.concat() || [];
            others.forEach(file => {
                var srcFile = path.join(config.projectPath, config.resourcePath, file);
                var destFile = path.join(publishPath, config.packedResPath, file);
                fs.exists(srcFile).then(() => {
                    fs.copy(srcFile, destFile);
                })
            });
        }
        cb();
        break;
    }
})

gulp.task('publish', function(cb) {
    //publish 时如果ts->js 时出错,break.
    argv.error_break = true;
    argv.minify = true;
    argv.minify_drop_console = false;
    if (!argv.noRes)
        sequence('release', 'dist', cb);
    else
        sequence('build', 'dist', cb);
})

gulp.task('pubios', function(cb) {
    argv.target = 'ios';
    argv.minify = true;
    sequence('release', 'dist', 'layadcc', cb)
})

gulp.task('pubweb', function(cb) {
    argv.target = 'web';
    argv.minify = true;
    sequence('release', 'dist', cb);
})

gulp.task('default', ['build']);

gulp.task('gencode', ["genui"], function() {
    return require('./tools/gencode')(argv.uipack, argv.pb);
});

gulp.task('reBuild', function(cb) {
    sequence('gensheets', 'build', cb);
})

gulp.task('reBuild', function(cb) {
    sequence('gensheets', 'build', cb);
})

gulp.task('copysvn', function(cb) {
    require('./tools/copysvn')(argv.head);
    cb();
})

gulp.task('addTag', function(cb) {
    var projectConfig = config.projectConfig;
    var version = projectConfig.getGameVersion();
    var execSync = require('child_process').execSync;
    var cmd = `git tag v${version} -f`
    execSync(cmd, { cwd: config.projectPath, encoding: 'utf8' });
    cmd = `git push origin --tags`
    execSync(cmd, { cwd: config.projectPath, encoding: 'utf8' });
    cb();
})

gulp.task("minify", function(cb) {
    if (!argv.file) return;
    let file = path.join(config.projectPath, "libs", argv.file);
    return gulp.src(file)
        .pipe(uglify({ compress: { drop_console: argv.minify_drop_console } }))
        .pipe(rename({ extname: '.min.js' }))
        .pipe(gulp.dest(path.dirname(file)));
})

gulp.task("native", function(cb) {
    argv.target = "native";
    sequence("compile", cb);
})

gulp.task("layadcc", function(cb) {
    argv.target = "ios";
    var publishPath = path.join(config.publishPath, argv.target);
    let cmd = 'layadcc ' + publishPath;

    execSync(cmd);

})

//提升版本号
gulp.task("upversion", function(cb) {
    let versionFile = path.join(config.projectPath, 'src/version.ts');
    if (fs.existsSync(versionFile)) {
        let fileContent = fs.readFileSync(versionFile, 'utf-8');
        fileContent = replaceVersion("version", fileContent);
        fileContent = replaceVersion("resVersion", fileContent);

        fs.writeFileSync(versionFile, fileContent);

        let cmd = `git commit -o src/version.ts -m '版本号提升'`;
        output = execSync(cmd, { cwd: config.projectPath, encoding: 'utf8' });
        console.log(output)
        cmd = `git push`;
        output = execSync(cmd, { cwd: config.projectPath, encoding: 'utf8' });
    }
    cb()
})

function replaceVersion(math, fileContent) {
    let reg = new RegExp(`${math} = ['"](.*)['"]`);
    let matches = fileContent.match(reg);
    if (matches && matches.length >= 2) {
        let value = (matches[1].replace(/\./g, ""));
        value++;
        let versionStr = value.toString().split("").join(".");
        fileContent = fileContent.replace(reg, `${math} = '${versionStr}'`);
    }
    return fileContent;
}