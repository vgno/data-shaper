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

module.exports = {
    splitReference: splitReference,
    getPartOfReference: getPartOfReference
};
