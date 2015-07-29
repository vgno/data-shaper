'use strict';

var getPartOfReference = require('./helpers').getPartOfReference;

/**
 * Resolves property values based on a relation reference
 *
 * The reference is on the format "id", "name" or a reference
 * that includes a relation; "countryId.name". With references
 * like the last one, the resolver will fetch the related object
 * and get the desired value. The depth is not limited but using
 * very deep references may have performance implications.
 *
 * The options object must contain the following functions;
 * resolveValue, resolveFragment and fetchData.
 *
 * @param {object} sourceData Object to get property data from
 * @param {string} reference Reference given with dot notation
 * @param {object} options Options object with functions to use in the shaping
 * @param {function} callback
 **/
function resolveValue(sourceData, reference, options, callback) {
    var fetchData = options.fetchData;

    // Get position of first dot in the reference
    var dotPosition = reference.indexOf('.');

    // We got null as data, not possible to continue resolving
    if (sourceData === null) {
        process.nextTick(function() {
            callback(null, null);
        });
        return;
    }

    // We're looking for a value we have in the sourceData object
    if (dotPosition < 0) {
        process.nextTick(function() {
            callback(null, sourceData[reference]);
        });
        return;
    }

    var property = getPartOfReference(reference, 0);

    fetchData(sourceData[property], property, function(err, data) {
        if (err) {
            callback(err);
            return;
        }

        // Resolve next level
        resolveValue(
            data,
            getPartOfReference(reference, 1),
            options,
            callback
        );
    });
}

module.exports = resolveValue;
