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
        var companyData = { id: 2, name: 'VG' };

        resolveValue(
            data,
            'companyId.name',
            { fetchData: fetchData(companyData) },
            function(err, res) {
                assert(!err);
                assert.equal(res, companyData.name);
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
