'use strict';

var assert = require('assert');

var merge = require('lodash.merge');

var resolveValue = require('../lib/resolve-value');
var mockError = require('./mock/error');
var data = require('./mock/data');
var fetchData = require('./mock/fetch-data')(data);

var defaultOptions = {
    resolveValue: resolveValue,
    fetchData: fetchData
};

describe('Resolve value', function() {
    var personData = data.persons['1'];

    it('takes local values off the data object', function(done) {
        resolveValue(personData, 'lastName', defaultOptions, function(err, res) {
            assert(!err);
            assert.equal(res, personData.lastName);
            done();
        });
    });

    it('resolves dot notated references', function(done) {
        resolveValue(
            data.persons['1'],
            'companyId.municipalId.countryId.name',
            defaultOptions,
            function(err, value) {
                assert(!err);
                assert.equal(value, data.countries['1'].name);
                done();
            }
        );
    });

    it('returns fetching errors through callback', function(done) {
        var errorText = 'Some error';

        resolveValue(
            data,
            'companyId.name',
            merge({}, defaultOptions, { fetchData: mockError(errorText) }),
            function(err) {
                assert.equal(err, errorText);
                done();
            }
        );
    });

    it('returns null if null is passed as data', function(done) {
        resolveValue(null, 'foobar', defaultOptions, function(err, res) {
            assert(!err);
            assert.equal(res, null);
            done();
        });
    });

    it('can resolve a one-to-many-relation', function(done) {
        resolveValue(
            data.persons['1'],
            'phoneNumbers(employeeId=id).phoneTypeId.name',
            defaultOptions,
            function(err, res) {
                assert(!err);
                assert.deepEqual(res, ['Mobile', 'Landline']);
                done();
            }
        );
    });
});
