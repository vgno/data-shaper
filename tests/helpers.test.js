'use strict';

var assert = require('assert');
var helpers = require('../lib/helpers');

describe('Helpers', function() {
    describe('#splitReference', function() {
        it('splits dot notated reference into parts', function(done) {
            var parts = helpers.splitReference('some.related.property');

            assert.deepEqual(parts, ['some', 'related', 'property']);
            done();
        });

        it('returns an empty array if given an empty string', function(done) {
            assert.deepEqual(helpers.splitReference(''), []);
            done();
        });
    });

    describe('#getPartOfReference', function() {
        var reference = 'some.related.property';

        it('gives me the correct part for a reference', function(done) {
            assert.equal(helpers.getPartOfReference(reference, 0), 'some');
            assert.equal(helpers.getPartOfReference(reference, 2), 'property');
            done();
        });

        it('returns undefined for out of bounds index', function(done) {
            assert(typeof helpers.getPartOfReference(reference, -1) === 'undefined');
            assert(typeof helpers.getPartOfReference(reference, 4) === 'undefined');
            done();
        });
    });
});
