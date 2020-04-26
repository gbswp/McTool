var fs = require('fs');
var dust = require('dustjs-helpers');

dust.config.whitespace = true;

dust.helpers.iter = function (chunk, context, bodies, params) {
    var obj = dust.helpers.tap(params.obj, chunk, context);
    var type = params.type;
    var iterable = [];
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            var value = obj[key];
            if (type === 'keys') {
                iterable.push(key);
            } else if (type === 'values') {
                iterable.push(value)
            } else {
                iterable.push({
                    '$key': key,
                    '$value': value,
                });
            }
        }
    }
    return chunk.section(iterable, context, bodies);
};

dust.helpers.eventsDecl = function (chunk, context, bodies, params) {
    var obj = dust.helpers.tap(params.obj, chunk, context);
    var iterable = [];
    var methodMap = {};
    for (var key in obj) {
        var values = obj[key];
        for (var i = 0; i < values.length; i++) {
            var value = values[i];
            var methodName = 'on' + dust.filters.firstUp(dust.filters.simpleCompName(key)) + dust.filters.firstUp(value);
            if (methodMap[methodName])
                continue;
            methodMap[methodName] = 1;
            var eventArgs = dust.filters.eventArgs(value);
            iterable.push(`${methodName}?(${eventArgs}): void;`)
        }
    }
    return chunk.section(iterable, context, bodies);
};

dust.filters.firstUp = function (value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
};

dust.filters.simpleCompName = function (value) {
    var pos = value.lastIndexOf('.');
    var name = pos >= 0 ? value.substr(pos + 1) : value;
    return name.replace(/[0-9]+$/, '');
}

dust.filters.eventArgs = function (value) {
    if (value === 'click')
        return 'e: Laya.Event';
    else if (value === 'select')
        return 'index: number';
    else if (value === 'cellClick')
        return 'e: Laya.Event, index: number';
    else if (value === 'cellChildClick')
        return 'e: Laya.Event, index: number, childVarName: string';
    else if (value === 'render')
        return 'cell: ui.CellView, index: number';
    else if (value === 'inputChange')
        return 'oldValue: string, newValue: string';
    else if (value === 'link')
        return 'data: string';
    else if (value === 'mousedown')
        return 'e: Laya.Event';
    return '';
}

function loadDustTemplate(name) {
    var template = fs.readFileSync(__dirname + '/templates/' + name + '.dust', 'UTF8').toString();
    var compiledTemplate = dust.compile(template, name);
    dust.loadSource(compiledTemplate);
}

loadDustTemplate('uifile');
loadDustTemplate('all');
loadDustTemplate('msgcode');
loadDustTemplate('soundcode');
