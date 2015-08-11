'use strict';

var assert = require('assert');
var merge = require('lodash.merge');
var dataShaper = require('../');
var data = require('./mock/data');
var mockError = require('./mock/error');
var fetchData = require('./mock/fetch-data')(data);
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

var defaultOptions = { fetchData: fetchData };

describe('Data shaper', function() {
    var duplicateShape = {
        collectionName: 'people',
        shape: {
            id: 'id',
            name: 'firstName',
            zip: 'zipId',
            postal: 'zipId.postal',
            postalDupe: 'zipId.postal'
        }
    };

    it('can shape array of data objects', function(done) {
        var shapeData = [data.persons['1'], data.persons['2']];

        dataShaper(shapeData, simpleShape, defaultOptions, function(err, res) {
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

    it('can shape object with reverse reference', function(done) {
        var shape = {
            collectionName: 'persons',
            shape: {
                id: 'id',
                name: 'firstName',
                addresses: {
                    reference: 'addresses(personId=id)',
                    shape: {
                        collectionName: 'addresses',
                        shape: {
                            id: 'id',
                            address: 'address',
                            zip: 'zipId',
                            country: 'zipId.countryId.name'
                        }
                    }
                }
            }
        };

        dataShaper(
            data.persons['1'],
            shape,
            defaultOptions,
            function(err, res) {
                assert(!err);

                assert.deepEqual(res, {
                    addresses: {
                        '1': {
                            id: 1,
                            address: 'Alphabet st. 1',
                            zip: 1234,
                            country: 'Norway'
                        },
                        '2': {
                            id: 2,
                            address: 'Number rd. 2',
                            zip: 1234,
                            country: 'Norway'
                        }
                    },
                    persons: {
                        '1': {
                            id: 1,
                            name: 'Fred',
                            addresses: { addresses: [1, 2] }
                        }
                    }
                });

                done();
            }
        );
    });

    it('can shape object with one-to-one reverse reference fragment', function(done) {
        var shape = {
            collectionName: 'persons',
            shape: {
                id: 'id',
                name: 'firstName',
                address: {
                    reference: 'addresses(personId==id)',
                    shape: {
                        collectionName: 'addresses',
                        shape: {
                            id: 'id'
                        }
                    }
                }
            }
        };

        dataShaper(
            data.persons['1'],
            shape,
            defaultOptions,
            function(err, res) {
                assert(!err);
                assert.deepEqual(res, {
                    addresses: {
                        '1': {
                            id: 1
                        }
                    },
                    persons: {
                        '1': {
                            id: 1,
                            name: 'Fred',
                            address: { addresses: 1 }
                        }
                    }
                });

                done();
            }
        );
    });

    it('can shape object with reverse reference and filter', function(done) {
        var shape = {
            collectionName: 'persons',
            shape: {
                id: 'id',
                name: 'firstName',
                addressId: 'addresses(personId==id, address="Alphabet st. 1").id'
            }
        };

        dataShaper(
            data.persons['1'],
            shape,
            defaultOptions,
            function(err, res) {
                assert(!err);
                assert.deepEqual(res, {
                    persons: {
                        '1': {
                            id: 1,
                            name: 'Fred',
                            addressId: 1
                        }
                    }
                });

                done();
            }
        );
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
            [{ id: 1, name: 'Fred', zipId: 1234 }],
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
            data.persons['1'],
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

        var resolveFailure = mockError(errorText);

        dataShaper(
            [{ firstName: 'Kristoffer' }],
            simpleShape,
            merge({}, defaultOptions, { resolveValue: resolveFailure }),
            function(err) {
                assert.equal(err, errorText);
                done();
            }
        );
    });
});
