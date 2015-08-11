'use strict';

var merge = require('lodash.merge');

/**
 * Split reference into an array
 *
 * @param {string} reference
 * @return {array}
 */
function splitReference(reference) {
    if (reference === '') {
        return [];
    }

    return reference.match(/([^\(]+\([^\)]+\)|[^\.]+)/g);
}

/**
 * Get the n-th part of the reference
 *
 * For instance 2nd part of "foo.bar.baz" is "baz"
 *
 * @param {string} reference Reference using dot notation
 * @param {int} n Part to get
 * @return {string}
 */
function getPartOfReference(reference, n) {
    var parts = splitReference(reference);

    return parts[n];
}

/**
 * Hash a fetchData function call for memoization. This approach is
 * extremely naïve and depends on the id and reference combination
 * to always resolve to the same item. This however should always
 * be the case for fetchData functions passed to the data shaper.
 *
 * @param {object|int} value
 * @param {string} reference
 * @return {string} hash of function call
 */
function hashFetchDataCall(value, reference) {
    if (typeof value !== 'object') {
        return reference + '::' + value;
    }

    return reference + '::' + JSON.stringify(value);
}

/*eslint-disable */
// Regex used for validating the format of the reference
// Match: someCollection(property=value,...)
var refRegex = /^([A-z0-9-_]+)\(((?:[A-z0-9-_]+={1,2}[A-z0-9-._]+|"[^"]+")(?:(?:,\s*(?:[A-z0-9-_]+=(?:[A-z0-9-._]+|"[^"]+")))*))\)$/;
/*eslint-enable */

/**
 * Get reverse reference data. Reverse references are denoted by
 * parentheses containing the field to use when looking up and the
 * field from the current object to get the value for.
 *
 * Multiple field=value filters is supported, but only the first one can
 * use a ==. Three types of values are supported; quoted string (a value)
 * string without quotes (reference to a field in data) and a number (integer
 * or float value with dot as decimal separator).
 *
 * Example: employeeDetails(employeeId=id,otherField=123)
 *         a^              b^        c^ ^d
 *
 * a) collection that has the data we want
 * b) field in the collection to query on
 * c) either a single or a double equation sign:
 *    =  meaning it's a one-to-many reference (will return array of ids)
 *    == meaning it's a direct reverse reference (will return single id)
 * d) field in the current object being referred from the collection
 *
 * @param {string} reference
 * @return {object} Reference data
 */
function getReverseReferenceData(reference) {
    var match = reference.match(refRegex);

    // Return null if the reference is malformed in some way
    if (match === null) {
        return match;
    }

    var response = {
        collection: match[1],
        references: {},
        filters: {},
        oneToMany: reference.indexOf('==') < 0
    };

    // We have a match, split the filter into the different parts
    // var collection = match[1];
    var refs = /([A-z0-9-_]+)(={1,2})([A-z0-9-_]+|"[^"]+")/g;

    // Iterate over the matched parts of the reference to find the properties
    var ref;
    while ((ref = refs.exec(match[2]))) {
        var value = ref[3];
        var property = ref[1];

        // Numeric value, add to filter
        if (value.match(/^\d+(?:\.\d+)?$/)) {
            response.filters[property] = parseFloat(value);
            continue;
        }

        // String value, add to filter
        if (value.match(/^".*"$/)) {
            response.filters[property] = value.substr(1, value.length - 2);
            continue;
        }

        // Reference to a data property value, add to references
        response.references[property] = value;
    }

    return response;
}

/**
 * Returns whether the given reference is a one-to-many relation or not
 *
 * @param  {object|string} reference
 * @return {boolean}
 */
function isOneToMany(reference) {
    if (reference.reference) {
        reference = reference.reference;
    }

    var refData = getReverseReferenceData(reference);
    return refData !== null && refData.oneToMany;
}

/**
 * Given a substring, will return a function that when called with a string determines
 * if that string starts with the substring.
 *
 * @param  {string} substr Substring to match
 * @return {function}
 */
function startsWith(substr) {
    return function(str) {
        return str.indexOf(substr) === 0;
    };
}

/**
 * Merge data+references and filters to build a query for fetchData
 *
 * @param {object} data
 * @param {object} references
 * @param {object} filters
 * @return {object}
 */
function buildQuery(data, references, filters) {
    var query = {};

    for (var field in references) {
        query[field] = data[references[field]];
    }

    return merge(query, filters);
}

module.exports = {
    getPartOfReference: getPartOfReference,
    getReverseReferenceData: getReverseReferenceData,
    hashFetchDataCall: hashFetchDataCall,
    isOneToMany: isOneToMany,
    buildQuery: buildQuery,
    splitReference: splitReference,
    startsWith: startsWith
};
