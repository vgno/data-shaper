'use strict';

module.exports = function(data) {
    data = (typeof data === 'undefined') ? {} : data;

    return function fetchData(id, reference, callback) {
        process.nextTick(function() {
            callback(null, data);
        });
    };
};
