'use strict';

var async = require('async');
var assert = require('assert');
var merge = require('lodash.merge');

var resolveValue = require('../lib/resolve-value');
var resolveFragment = require('../lib/resolve-fragment');
var shapeResponse = require('../lib/shape-response');
var mockFetchData = require('./mock/fetch-data');
var mockError = require('./mock/error');

describe('Response fragment resolver', function() {
    var personData = { id: 1, firstName: 'Fred', companyId: 2 };
    var companyData = { id: 2, name: 'VG' };

    var companyShape = {
        collectionName: 'companies',
        shape: {
            id: 'id',
            name: 'name'
        }
    };

    var fragment = {
        reference: 'companyId',
        shape: companyShape
    };

    var defaultOptions = {
        fetchData: mockFetchData(companyData),
        resolveValue: resolveValue,
        resolveFragment: resolveFragment,
        shapeResponse: shapeResponse
    };

    it('resolves and returns data for shape fragment', function(done) {
        resolveFragment(
            personData,
            fragment,
            defaultOptions,
            function(err, res) {
                assert(!err);

                // The response shaper expects the fragment data to be returned
                // in the data object with a key on the format [collectionName]::[id]
                assert(res.data['companies::2']);

                done();
            }
        );
    });

    var errorText = 'Some error';
    var error = mockError(errorText);

    it('returns errors through callback', function(done) {
        var optionsArr = [
            merge({}, defaultOptions, { resolveValue: error }),
            merge({}, defaultOptions, { fetchData: error }),
            merge({}, defaultOptions, { shapeResponse: error })
        ];

        async.parallel(optionsArr.map(function(options) {
            return function(cb) {
                resolveFragment(
                    personData,
                    fragment,
                    options,
                    function(err) {
                        assert.equal(err, errorText);
                        cb();
                    }
                );
            };
        }), done);
    });
});
