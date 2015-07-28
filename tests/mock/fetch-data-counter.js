'use strict';

module.exports = function(data) {
    var counter = 0;

    function fetchData(id, reference, callback) {
        counter++;

        process.nextTick(function() {
            callback(null, data || {});
        });
    }

    fetchData.getCallCount = function() {
        return counter;
    };

    return fetchData;
};
