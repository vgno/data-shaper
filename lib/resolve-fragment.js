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
    var shapeData = options.shapeData;

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
        fetchData(id, propertyName, function(fetchErr, fragmentData) {
            if (fetchErr) {
                return callback(fetchErr);
            }

            // We got null back from fetchData. Create data for fragment
            // with null value and pass it to the callback
            if (fragmentData === null) {
                var nullFragmentData = {};
                nullFragmentData[shape.collectionName + '::' + id] = null;

                return callback(null, {
                    data: nullFragmentData,
                    shape: shape,
                    id: id
                });
            }

            // Shape the data for the fragment
            shapeData(fragmentData, shape, options, function(err, shapedFragmentData) {
                if (err) {
                    return callback(err);
                }

                callback(err, {
                    data: shapedFragmentData,
                    shape: shape,
                    id: id
                });
            });
        });
    });
}

module.exports = resolveFragment;
