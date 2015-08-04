'use strict';

var async = require('async');
var merge = require('lodash.merge');
var isOneToMany = require('./helpers').isOneToMany;

/**
 * Shape a data object to a given shape
 *
 * The options object must contain the following functions;
 * resolveValue, resolveFragment and fetchData.
 *
 * @param {array} data Data object
 * @param {object} shape Object describing the shape
 * @param {object} options Options object with functions to use in the shaping
 * @param {object} callback
 */
function shapeData(data, shape, options, callback) {
    var resolveValue = options.resolveValue;
    var resolveFragment = options.resolveFragment;

    var responseData = {};
    var shapedObject = {};
    var tasks = [];

    // Check that the shape defines an id field. It's needed in order to
    // structure the response and reference the items it contains
    if (!shape.shape.id) {
        process.nextTick(function() {
            callback(new Error('Shape [' + shape.collectionName + '] must contain an id'));
        });
        return;
    }

    function createResolveTask(property, reference) {
        return function(cb) {
            if (typeof reference === 'object') {
                // Resolve the shape fragment
                resolveFragment(data, reference, options, function(err, res) {
                    if (err) {
                        cb(err);
                        return;
                    }

                    merge(responseData, res.data);
                    shapedObject[property] = {};

                    var refId = res.id;
                    if (Array.isArray(refId) && !isOneToMany(reference)) {
                        refId = res.id[0];
                    }

                    shapedObject[property][res.shape.collectionName] = refId;

                    cb();
                });
                return;
            }

            resolveValue(data, reference, options, function(err, value) {
                shapedObject[property] = value;
                cb(err);
            });
        };
    }

    // Iterate over the properties described in the shape
    for (var shapeProperty in shape.shape) {
        var shapeReference = shape.shape[shapeProperty];

        // Create resolve task function and push to task list
        tasks.push(createResolveTask(shapeProperty, shapeReference));
    }

    // Resolve all properties in parallel
    async.parallel(tasks, function(err) {
        if (err) {
            callback(err);
            return;
        }

        // Add the response to the response data object
        responseData[shape.collectionName + '::' + shapedObject.id] = shapedObject;

        // Call the callback with the response data
        callback(err, responseData);
    });
}

module.exports = shapeData;
