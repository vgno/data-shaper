'use strict';

var assert = require('assert');

var merge = require('lodash.merge');

var resolveValue = require('../lib/resolve-value');
var mockError = require('./mock/error');
var fetchData = require('./mock/fetch-data');

var defaultOptions = {
    resolveValue: resolveValue,
};

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
        var customData = {
            companyId: { '2': { id: 2, name: 'VG', municipalId: 1 } },
            municipalId: { '1' : { id: 1, name: 'Oslo', countryId: 4 }},
            countryId: { '4' : { id: 4, name: 'Norway' }}
        };

        // Data fetcher that responds to id and reference params and returns
        // mock data for a few different collections
        var customFetchData = function(id, reference, callback) {
            process.nextTick(function() {
                callback(null, customData[reference][String(id)]);
            });
        }

        resolveValue(
            data,
            'companyId.municipalId.countryId.name',
            merge({}, defaultOptions, { fetchData: customFetchData }),
            function(err, value) {
                assert(!err);
                assert.equal(value, customData.countryId['4'].name);
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
});
