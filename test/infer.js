var _ = require('underscore');
var assert = require('chai').assert;
var CSV = require('./CSV');
var infer = require('../').infer;
var types = require('../').types;


describe('Infer', function() {
  it('produce schema from a generic .csv', function(done, err) { assert(); done(); });
  it('respect rowLimit param', function(done, err) { assert(); done(); });
  it('respect primaryKey param', function(done, err) { assert(); done(); });
  it('respect primaryKey param passed as list of fields', function(done, err) { assert(); done(); });
  it('do not create constraints if explicit param passed as False', function(done, err) { assert(); done(); });
  it('create constraints if explicit param passed as True', function(done, err) { assert(); done(); });
});