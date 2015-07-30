'use strict';

var async = require('async');
var merge = require('lodash.merge');

var hashFetchDataCall = require('./lib/helpers').hashFetchDataCall;
var resolveValue = require('./lib/resolve-value');
var resolveFragment = require('./lib/resolve-fragment');
var shapeData = require('./lib/shape-data');

/**
 * Restructures data by creating entity collection arrays for each
 * collection.
 *
 * The property names in the raw data is split by :: which separates
 * the collection name and object id.
 *
 * @param {object} raw Raw data to restructure
 * @return {object} Restructured data
 */
function unserializeCollections(raw) {
    var res = {};

    for (var key in raw) {
        var keyData = key.split('::');
        var collection = keyData[0];
        var id = keyData[1];

        if (typeof res[collection] === 'undefined') {
            res[collection] = {};
        }

        res[collection][id] = raw[key];
    }

    return res;
}

/**
 * Shape an array of data object to a given shape
 *
 * @param {array} data Array of data objects
 * @param {object} shape Object describing the shape
 * @param {object} options Options object with functions to use in the shaping
 * @param {object} callback
 */
function dataShaper(data, shape, options, callback) {
    var shaperOptions = merge({
        shapeData: shapeData,
        resolveValue: resolveValue,
        resolveFragment: resolveFragment,
        memoize: true
    }, options);

    // Check that a data resolver was passed
    if (!shaperOptions.fetchData) {
        throw new Error('Missing fetchData function in options object');
    }

    // Memoize data fetching to speed things up
    if (shaperOptions.memoize) {
        shaperOptions.fetchData = async.memoize(shaperOptions.fetchData, hashFetchDataCall);
    }

    if (!Array.isArray(data)) {
        data = [data];
    }

    var result = {};

    async.each(data, function(item, cb) {
        shaperOptions.shapeData(item, shape, shaperOptions, function(err, res) {
            merge(result, res);
            cb(err);
        });
    }, function(err) {
        if (err) {
            callback(err);
            return;
        }

        callback(err, unserializeCollections(result));
    });
}

module.exports = dataShaper;
