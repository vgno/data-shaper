'use strict';

module.exports = function(error) {
    return function() {
        // We expect the last argument to be the callback
        var callback = arguments[arguments.length - 1];

        process.nextTick(function() {
            callback(error);
        });
    };
};
