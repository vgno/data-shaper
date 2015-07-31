'use strict';

var assert = require('assert');

var merge = require('lodash.merge');

var resolveValue = require('../lib/resolve-value');
var mockError = require('./mock/error');
var mockFetchData = require('./mock/fetch-data');

var defaultOptions = {
    resolveValue: resolveValue
};

var mockData = {
    companies: {
        '2': { id: 2, name: 'VG', municipalId: 1 },
        '3': { id: 3, name: 'VaffelNinja', municipalId: 1 }
    },
    municipals: {
        '1': { id: 1, name: 'Oslo', countryId: 4 },
        '2': { id: 2, name: 'Lørenskog', countryId: 4 }
    },
    countries: {
        '4': { id: 4, name: 'Norway' }
    },
    phoneNumbers: {
        '1': { id: 1, employeeId: 1, phoneTypeId: 1, number: 98765432 },
        '2': { id: 2, employeeId: 1, phoneTypeId: 2, number: 23456789 },
        '3': { id: 3, employeeId: 2, phoneTypeId: 1, number: 99999999 },
        '4': { id: 4, employeeId: 1, phoneTypeId: 1, number: 98989898 }
    },
    phoneTypes: {
        '1': { id: 1, name: 'Mobile' },
        '2': { id: 2, name: 'Landline' }
    }
};

var fetchData = mockFetchData(mockData);

describe('Resolve value', function() {
    var data = { id: 1, lastName: 'Flintstone', companyId: 2};

    it('takes local values off the data object', function(done) {
        resolveValue(data, 'lastName', defaultOptions, function(err, res) {
            assert(!err);
            assert.equal(res, data.lastName);
            done();
        });
    });

    it('resolves dot notated references', function(done) {
        resolveValue(
            data,
            'companyId.municipalId.countryId.name',
            merge({}, defaultOptions, { fetchData: fetchData }),
            function(err, value) {
                assert(!err);
                assert.equal(value, mockData.countries['4'].name);
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
            { id: 1, name: 'Fred' },
            'phoneNumbers(employeeId=id).phoneTypeId.name',
            merge({}, defaultOptions, { fetchData: fetchData }),
            function(err, res) {
                assert(!err);
                assert.deepEqual(res, ['Mobile', 'Landline']);
                done();
            }
        );
    });
});
