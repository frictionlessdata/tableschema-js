var _ = require('underscore');
var assert = require('chai').assert;
var SchemaModel = require('../models');

var SCHEMA = {fields: [
  {
    name: 'id',
    type: 'string',
    constraints: {required: true}
  },

  {
    name: 'height',
    type: 'number',
    constraints: {required: false}
  },

  {
    name: 'age',
    type: 'integer',
    constraints: {required: false}
  },

  {
    name: 'name',
    type: 'string',
    constraints: {required: true}
  },

  {
    name: 'occupation',
    type: 'string',
    constraints: {required: false}
  }
]};


describe('Models', function() {
  it('have a correct number of header columns', function(done, err) {
    assert.equal((new SchemaModel(SCHEMA)).headers().length, 5);
    done();
  });

  it('have a correct number of header required columns', function(done, err) { assert(); done(); });
  it('have one of a field from passed schema', function(done, err) { assert(); done(); });
  it('do not have fields not specified in passed schema', function(done, err) { assert(); done(); });
  it('respect caseInsensitiveHeaders option', function(done, err) { assert(); done(); });
  it('raise exception when invalid json passed as schema', function(done, err) { assert(); done(); });
  it('raise exception when invalid format schema passed', function(done, err) { assert(); done(); });
});
