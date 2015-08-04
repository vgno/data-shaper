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

    describe('#hashFetchDataCall', function() {
        it('disregards the callback parameter when hashing', function(done) {
            var hash1 = helpers.hashFetchDataCall(1337, 'foobarId', function foo() {});
            var hash2 = helpers.hashFetchDataCall(1337, 'foobarId', function bar() {});

            assert.strictEqual(hash1, hash2);
            done();
        });
    });

    describe('#getReverseReferenceData', function() {
        it('extracts information from reverse references', function(done) {
            assert.deepEqual(
                helpers.getReverseReferenceData('foo(bar=id)'),
                { collection: 'foo', referring: 'bar', referred: 'id', oneToMany: true }
            );

            assert.deepEqual(
                helpers.getReverseReferenceData('fooCollection(myField=someOtherField)'),
                { collection: 'fooCollection', referring: 'myField', referred: 'someOtherField', oneToMany: true }
            );

            assert.deepEqual(
                helpers.getReverseReferenceData('foo-collection(my-field=some-field)'),
                { collection: 'foo-collection', referring: 'my-field', referred: 'some-field', oneToMany: true }
            );

            assert.deepEqual(
                helpers.getReverseReferenceData('foo-collection(my-field==some-field)'),
                { collection: 'foo-collection', referring: 'my-field', referred: 'some-field', oneToMany: false }
            );

            assert.deepEqual(
                helpers.getReverseReferenceData('foo_collection(my_field=some_field)'),
                { collection: 'foo_collection', referring: 'my_field', referred: 'some_field', oneToMany: true }
            );

            done();
        });

        it('returns null if reverse reference is not valid', function(done) {
            var invalidRefs = [
                '.foo(bar=id).', '.foo(bar=id)', 'foo(bar=id).',
                'sfd(bar)', 'sfd(bar:id)', 'sfd(bar=id',
                'sfd(bar)', 'sfd(bar))', 'sfd'
            ];

            for (var i in invalidRefs) {
                var ref = invalidRefs[i];

                assert.equal(helpers.getReverseReferenceData(ref), null);
            }

            done();
        });
    });

    describe('#isOneToMany', function() {
        it('returns correct value for reference definitions', function() {
            assert.equal(helpers.isOneToMany('foo(bar=id)'), true);
            assert.equal(helpers.isOneToMany('fooCollection(myField=someOtherField)'), true);
            assert.equal(helpers.isOneToMany('foo-collection(my-field=some-field)'), true);
            assert.equal(helpers.isOneToMany('foo-collection(my-field==some-field)'), false);
            assert.equal(helpers.isOneToMany('foo_collection(my_field=some_field)'), true);
        });

        it('supports nested object reference', function() {
            assert.equal(helpers.isOneToMany({
                reference: 'foo-collection(my-field=some-field)'
            }), true);

            assert.equal(helpers.isOneToMany({
                reference: 'foo-collection(my-field==some-field)'
            }), false);
        });
    });
});
