'use strict';

var pluralize = require('pluralize');

module.exports = function(data) {
    data = (typeof data === 'undefined') ? {} : data;

    return function fetchData(value, reference, callback) {
        var splitRef = reference.split('::');
        var collectionKey = splitRef[0];
        var filterProperty = splitRef[1];

        // If data is null, return null. For testing purposes
        if (data === null) {
            process.nextTick(function() {
                callback(null, null);
            });
            return;
        }

        // Regular foreign key reference
        if (!filterProperty) {
            var collection = pluralize(collectionKey.replace(/Id$/, ''));

            process.nextTick(function() {
                callback(null, data[collection][value]);
            });
            return;
        }

        // Slightly more magic reverse reference
        var response = {};
        for (var key in data[collectionKey]) {
            if (data[collectionKey][key][filterProperty] === value) {
                response[key] = data[collectionKey][key];
            }
        }

        process.nextTick(function() {
            callback(null, response);
        });
    };
};
