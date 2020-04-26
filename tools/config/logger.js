var colors = require('colors');

console.error = (function() {
    var error = console.error;
    return function(exception) {
        if (typeof exception.stack !== 'undefined') {
            error.call(console, colors.red.call(this, exception.stack));
        } else {
            error.call(console, colors.red.apply(this, arguments));
        }
    }
})();

console.warn = (function() {
    var warn = console.warn;
    return function() {
        warn.call(console, colors.yellow.apply(this, arguments));
    }
})();
