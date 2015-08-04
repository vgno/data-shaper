'use strict';

var async = require('async');
var merge = require('lodash.merge');

var helpers = require('./helpers');
var splitReference = helpers.splitReference;

function createFragmentHandler(options, shape, id, cb) {
    return function handleFragment(fetchErr, fragmentData) {
        if (fetchErr) {
            return cb(fetchErr);
        }

        // We got null back from fetchData. Create data for fragment
        // with null value and pass it to the callback
        if (fragmentData === null) {
            var nullFragmentData = {};
            nullFragmentData[shape.collectionName + '::' + id] = null;

            return cb(null, {
                data: nullFragmentData,
                shape: shape,
                id: id
            });
        }

        // Shape the data for the fragment
        options.shapeData(fragmentData, shape, options, function(err, shapedFragmentData) {
            if (err) {
                return cb(err);
            }

            cb(err, {
                data: shapedFragmentData,
                shape: shape,
                id: id
            });
        });
    };
}

/**
 * Resolves a property specified using a shape fragment
 *
 * The options object must contain the following functions;
 * resolveValue, resolveFragment and fetchData.
 *
 * @param {object} data Object to get property data from
 * @param {object} fragment Fragment definition
 * @param {object} options Options object with functions to use in the shaping
 * @param {function} callback
 */
function resolveFragment(data, fragment, options, callback) {
    var resolveValue = options.resolveValue;
    var fetchData = options.fetchData;

    var reference = fragment.reference;
    var shape = fragment.shape;

    // Split the reference and get the last part
    var referenceParts = splitReference(reference);
    var propertyName = referenceParts[referenceParts.length - 1];

    // Resolve the value for the reference
    resolveValue(data, reference, options, function(resolveErr, value) {
        if (resolveErr) {
            callback(resolveErr);
            return;
        }

        if (typeof value === 'object') {
            async.map(Object.keys(value), function(id, cb) {
                createFragmentHandler(options, shape, id, cb)(null, value[id]);
            }, function(err, res) {
                if (err) {
                    return callback(err);
                }

                var fragmentData = merge.apply(null, res.map(function(item) {
                    return item.data;
                }));

                callback(null, {
                    data: fragmentData,
                    shape: shape,
                    id: Object.keys(fragmentData).map(function(key) {
                        return fragmentData[key].id;
                    })
                });
            });
            return;
        }

        // Fetch the data for the shape
        fetchData(value, propertyName, createFragmentHandler(options, shape, value, callback));
    });
}

module.exports = resolveFragment;
