'use strict';

var async = require('async');
var unique = require('lodash.uniq');

var helpers = require('./helpers');

var splitReference = helpers.splitReference;
var getPartOfReference = helpers.getPartOfReference;
var getReverseReferenceData = helpers.getReverseReferenceData;
var buildQuery = helpers.buildQuery;
var isOneToMany = helpers.isOneToMany;

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

    // We got a null reference, meaning that the resolving of a reverse
    // reference is done
    if (reference === null) {
        process.nextTick(function() {
            callback(null, sourceData);
        });
        return;
    }

    // Get position of first dot in the reference
    var refParts = splitReference(reference);
    var refPartsLength = refParts.length;

    // We got null as data, not possible to continue resolving
    if (sourceData === null) {
        process.nextTick(function() {
            callback(null, null);
        });
        return;
    }

    // Check if we're dealing with a reverse reference here
    var property = getPartOfReference(reference, 0);
    var reverseRefData = getReverseReferenceData(property);

    // We're looking for a value we have in the sourceData object
    if (refPartsLength === 1 && !reverseRefData) {
        process.nextTick(function() {
            callback(null, sourceData[reference]);
        });
        return;
    }

    var value = sourceData[property];

    // Reverse reference – prepare fetchData query
    if (reverseRefData) {
        value = buildQuery(sourceData, reverseRefData.references, reverseRefData.filters);
        property = reverseRefData.collection;
    }

    fetchData(value, property, function(err, data) {
        if (err) {
            callback(err);
            return;
        }

        var keys = Object.keys(data);
        var childRef = (refPartsLength === 1 ? null : refParts.slice(1).join('.'));

        // Check if the first object in data is an object, if it is we
        // got a list of objects back..
        if (typeof data[keys[0]] === 'object') {
            // This is a one-to-one relation, we'll change the data structure
            if (isOneToMany(refParts[0])) {
                async.map(Object.keys(data), function(id, cb) {
                    options.resolveValue(data[id], childRef, options, cb);
                }, function(childResolveErr, childValues) {
                    if (childResolveErr) {
                        return callback(childResolveErr);
                    }

                    // Filter out duplicates
                    callback(null, unique(childValues));
                });
                return;
            }

            // We have a one-to-one reference
            data = data[keys[0]];
        }

        // Resolve next level
        options.resolveValue(
            data,
            childRef,
            options,
            callback
        );
    });
}

module.exports = resolveValue;
