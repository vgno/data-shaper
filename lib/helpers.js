'use strict';

/**
 * Split reference into an array
 *
 * @param {string} reference
 * @return {array}
 */
function splitReference(reference) {
    return reference.split('.').filter(function(element) {
        return element.length > 0;
    });
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
 * @param {int} id
 * @param {string} reference
 * @return {string} hash of function call
 */
function hashFetchDataCall(id, reference) {
    return reference + '::' + id;
}

module.exports = {
    splitReference: splitReference,
    getPartOfReference: getPartOfReference,
    hashFetchDataCall: hashFetchDataCall
};
