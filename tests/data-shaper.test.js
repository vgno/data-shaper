'use strict';

var assert = require('assert');
var merge = require('lodash.merge');
var dataShaper = require('../');
var fetchData = require('./mock/fetch-data');
var fetchDataCounter = require('./mock/fetch-data-counter');

var simpleShape = {
    collectionName: 'persons',
    shape: {
        id: 'id',
        firstName: 'firstName',
        lastName: 'lastName',
        age: 'age'
    }
};

var defaultOptions = { fetchData: fetchData() };

describe('Data shaper', function() {
    var duplicateShape = {
        collectionName: 'people',
        shape: {
            id: 'id',
            name: 'name',
            zip: 'zipId',
            postal: 'zipId.postal',
            postalDupe: 'zipId.postal'
        }
    };

    it('can shape array of data objects', function(done) {
        var data = [
            { id: 1, firstName: 'Fred', lastName: 'Flintstone', age: 36 },
            { id: 2, firstName: 'Barney', lastName: 'Rubble', age: 32 }
        ];

        dataShaper(data, simpleShape, defaultOptions, function(err, res) {
            assert(!err);
            assert.deepEqual(res, {
                persons: {
                    '1': { id: 1, firstName: 'Fred', lastName: 'Flintstone', age: 36 },
                    '2': { id: 2, firstName: 'Barney', lastName: 'Rubble', age: 32 }
                }
            });

            done();
        });
    });

    it('returns an empty object if no data is given', function(done) {
        dataShaper([], {}, defaultOptions, function(err, res) {
            assert(!err);
            assert.deepEqual(res, {});
            done();
        });
    });

    it('memoizes fetchData function by default', function(done) {
        var fetchCompanyData = fetchDataCounter({ postal: 'Oslo' });

        dataShaper(
            [{id: 1, name: 'Fred', zipId: 1234}],
            duplicateShape,
            { fetchData: fetchCompanyData },
            function() {
                // By default we expect fetchData to be memoized and because
                // of this it should be called just once
                assert.equal(fetchCompanyData.getCallCount(), 1);
                done();
            }
        );
    });

    it('allows turning off memoization', function(done) {
        var fetchCompanyData = fetchDataCounter({ postal: 'Oslo' });

        dataShaper(
            [{ id: 1, name: 'Fred', zipId: 1234 }],
            duplicateShape,
            { fetchData: fetchCompanyData, memoize: false },
            function() {
                // Memoization is explicitly disabled setting memoize: false
                // in the options array, so the fetchData function should be
                // called twice for the duplicateShape
                assert.equal(fetchCompanyData.getCallCount(), 2);
                done();
            }
        );
    });

    it('wraps non-array in array if necessary', function(done) {
        dataShaper(
            { id: 1, firstName: 'Fred', lastName: 'Flintstone', age: 36 },
            simpleShape,
            defaultOptions,
            function(err, res) {
                assert(!err);

                // An object with key '1' should exist in the response
                assert(res.persons['1']);

                done();
            }
        );
    });

    it('shaping error is returned through callback', function(done) {
        var errorText = 'Something bad happened';

        function resolveValue(data, reference, options, callback) {
            process.nextTick(function() {
                callback(errorText);
            });
        }

        dataShaper(
            [{ firstName: 'Kristoffer' }],
            simpleShape,
            merge({}, defaultOptions, { resolveValue: resolveValue }),
            function(err) {
                assert.equal(err, errorText);
                done();
            }
        );
    });
});
