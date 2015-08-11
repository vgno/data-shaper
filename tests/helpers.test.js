'use strict';

var assert = require('assert');
var helpers = require('../lib/helpers');

describe('Helpers', function() {
    describe('#splitReference', function() {
        it('splits dot notated reference into parts', function(done) {
            var parts = helpers.splitReference('addresses(personId==id,address="Alphabet st. 1").zip.name');

            assert.deepEqual(parts, [
                'addresses(personId==id,address="Alphabet st. 1")',
                'zip',
                'name'
            ]);

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
                {
                    collection: 'foo',
                    references: { bar: 'id' },
                    filters: {},
                    oneToMany: true
                }
            );

            assert.deepEqual(
                helpers.getReverseReferenceData('fooCollection(myField=someOtherField)'),
                {
                    collection: 'fooCollection',
                    references: { myField: 'someOtherField' },
                    filters: {},
                    oneToMany: true
                }
            );

            assert.deepEqual(
                helpers.getReverseReferenceData('foo-collection(my-field=some-field)'),
                {
                    collection: 'foo-collection',
                    references: { 'my-field': 'some-field' },
                    filters: {},
                    oneToMany: true
                }
            );

            assert.deepEqual(
                helpers.getReverseReferenceData('foo-collection(my-field==some-field)'),
                {
                    collection: 'foo-collection',
                    references: { 'my-field': 'some-field' },
                    filters: {},
                    oneToMany: false
                }
            );

            assert.deepEqual(
                helpers.getReverseReferenceData('foo_collection(my_field=some_field)'),
                {
                    collection: 'foo_collection',
                    references: { 'my_field': 'some_field' },
                    filters: {},
                    oneToMany: true
                }
            );

            assert.deepEqual(
                helpers.getReverseReferenceData('foo_collection(my_field=1st-player, something="value", foo=123.435)'),
                {
                    collection: 'foo_collection',
                    references: { 'my_field': '1st-player' },
                    filters: { foo: 123, something: 'value' },
                    oneToMany: true
                }
            );

            done();
        });

        it('returns null if reverse reference is not valid', function(done) {
            var invalidRefs = [
                '.foo(bar=id).', '.foo(bar=id)', 'foo(bar=id).',
                'sfd(bar)', 'sfd(bar:id)', 'sfd(bar=id',
                'sfd(bar)', 'sfd(bar))', 'sfd', 'sfd()',
                'sfd(foo=bar, bar==foo)'
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

    describe('#buildQuery', function() {
        it('builds query from data, references and filter', function() {
            var data = { id: 1, firstName: 'Kristoffer', age: 26 };
            var references = { personId: 'id' };
            var filters = { firstName: 'Kristoffer', age: 26 };

            var query = helpers.buildQuery(data, references, filters);
            assert.deepEqual(query, { age: 26, firstName: 'Kristoffer', personId: 1 });
        });
    });
});
