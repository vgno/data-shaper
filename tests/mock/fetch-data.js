'use strict';

var pluralize = require('pluralize');

module.exports = function(data) {
    data = (typeof data === 'undefined') ? {} : data;

    function fetchReverse(refData, collection, callback) {
        var response = {};

        for (var id in data[collection]) {
            var item = data[collection][id];

            var match = true;
            for (var property in refData) {
                if (item[property] !== refData[property]) {
                    match = false;
                    break;
                }
            }

            if (match) {
                response[id] = item;
            }
        }

        process.nextTick(function() {
            callback(null, response);
        });
    }

    function fetch(value, reference, callback) {
        var collection = pluralize(reference.replace(/Id$/, ''));

        process.nextTick(function() {
            callback(null, data[collection][value]);
        });
    }

    return function fetchData(value, reference, callback) {
        // If data is null, return null. For testing purposes
        if (data === null) {
            process.nextTick(function() {
                callback(null, null);
            });
            return;
        }

        // Referese reference
        if (typeof value === 'object') {
            fetchReverse(value, reference, callback);
            return;
        }

        // Regular reference
        fetch(value, reference, callback);
    };
};
