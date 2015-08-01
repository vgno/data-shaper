'use strict';

var assert = require('assert');

var merge = require('lodash.merge');

var shapeData = require('../lib/shape-data');
var resolveValue = require('../lib/resolve-value');
var resolveFragment = require('../lib/resolve-fragment');
var data = require('./mock/data');
var fetchData = require('./mock/fetch-data')(data);

var options = {
    fetchData: fetchData,
    resolveValue: resolveValue,
    resolveFragment: resolveFragment,
    shapeData: shapeData
};

var shape = {
    collectionName: 'persons',
    shape: {
        id: 'id',
        firstName: 'firstName',
        company: {
            reference: 'companyId',
            shape: {
                collectionName: 'companies',
                shape: {
                    id: 'id',
                    name: 'name'
                }
            }
        }
    }
};

describe('Shape data', function() {
    it('can shape object using a shape with fragments', function(done) {
        shapeData(
            data.persons['1'],
            shape,
            options,
            function(err, res) {
                assert(!err);
                assert.deepEqual(res, {
                    'companies::2': { id: 2, name: 'VG' },
                    'persons::1': { id: 1, firstName: 'Fred', company: { companies: 2 } }
                });
                done();
            }
        );
    });

    it('returns fragment resolving error through callback', function(done) {
        shapeData(
            { id: 1, firstName: 'Fred', companyId: 2 },
            shape,
            merge({}, options, {
                resolveFragment: function(sourceData, ref, opts, callback) {
                    process.nextTick(function() {
                        callback('Strange error');
                    });
                }
            }),
            function(err) {
                assert.equal(err, 'Strange error');
                done();
            }
        );
    });

    it('returns error if id field is missing in shape', function(done) {
        shapeData([], {
            collectionName: 'friends',
            shape: {
                name: 'name'
            }
        }, {}, function(err) {
            assert.equal(err.message, 'Shape [friends] must contain an id');
            done();
        });
    });
});
