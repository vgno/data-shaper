'use strict';

var assert = require('assert');
var merge = require('lodash.merge');
var shapeResponse = require('../lib/shape-response');
var resolveValue = require('../lib/resolve-value');
var resolveFragment = require('../lib/resolve-fragment');

var options = {
    fetchData: function(id, ref, callback) {
        process.nextTick(function() {
            callback(null, {
                id: 2,
                name: 'VG'
            });
        });
    },
    resolveValue: resolveValue,
    resolveFragment: resolveFragment,
    shapeResponse: shapeResponse
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

describe('Shape response', function() {
    it('can shape object using a shape with fragments', function(done) {
        shapeResponse(
            { id: 1, firstName: 'Fred', companyId: 2 },
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
        shapeResponse(
            { id: 1, firstName: 'Fred', companyId: 2 },
            shape,
            merge({}, options, {
                resolveFragment: function(data, ref, opts, callback) {
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
        shapeResponse([], {
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
