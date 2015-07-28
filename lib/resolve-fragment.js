'use strict';

var helpers = require('./helpers');
var splitReference = helpers.splitReference;

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
    var shapeResponse = options.shapeResponse;

    var reference = fragment.reference;
    var shape = fragment.shape;

    // Split the reference and get the last part
    var referenceParts = splitReference(reference);
    var propertyName = referenceParts[referenceParts.length - 1];

    // Resolve the value for the reference
    resolveValue(data, reference, options, function(resolveErr, id) {
        if (resolveErr) {
            return callback(resolveErr);
        }

        // Fetch the data for the shape
        fetchData(id, propertyName, function(fetchErr, shapeData) {
            if (fetchErr) {
                return callback(fetchErr);
            }

            // Shape the data for the fragment
            shapeResponse(shapeData, shape, options, function(err, responseData) {
                if (err) {
                    return callback(err);
                }

                callback(err, {
                    data: responseData,
                    shape: shape,
                    id: id
                });
            });
        });
    });
}

module.exports = resolveFragment;
