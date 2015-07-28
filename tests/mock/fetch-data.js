'use strict';

module.exports = function(data) {
    return function fetchData(id, reference, callback) {
        process.nextTick(function() {
            callback(null, data || {});
        });
    };
};
