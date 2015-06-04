var _ = require('underscore');
var assert = require('chai').assert;
var csv = require('csv');
var CSVData = require('./CSV');
var infer = require('../').infer;
var types = require('../').types;


// WARN Use Model in test cases instead of validating schema directly
describe('Infer', function() {
  it('produce schema from a generic .csv', function(done, err) {
    csv.parse(CSVData.dataInfer, function(E, D) {
      var schema = infer(D[0], _.rest(D));


      assert.equal(_.findWhere(schema.fields, {name: 'id'}).type, 'integer');
      assert.equal(_.findWhere(schema.fields, {name: 'age'}).type, 'integer');
      assert.equal(_.findWhere(schema.fields, {name: 'name'}).type, 'string');
      done();
    });
  });

  it('respect rowLimit param', function(done, err) {
    csv.parse(CSVData.dataInferRowLimit, function(E, D) {
      var schema = infer(D[0], _.rest(D), {rowLimit: 4});


      assert.equal(_.findWhere(schema.fields, {name: 'id'}).type, 'integer');
      assert.equal(_.findWhere(schema.fields, {name: 'age'}).type, 'integer');
      assert.equal(_.findWhere(schema.fields, {name: 'name'}).type, 'string');
      done();
    });
  });

  it('respect primaryKey param', function(done, err) {
    csv.parse(CSVData.dataInferRowLimit, function(E, D) {
      var primaryKey = 'id';
      var schema = infer(D[0], _.rest(D), {primaryKey: primaryKey});

      assert.equal(schema.primaryKey, primaryKey);
      done();
    });
  });

  it('respect primaryKey param passed as list of fields', function(done, err) {
    csv.parse(CSVData.dataInfer, function(E, D) {
      var primaryKey = ['id', 'age'];
      var schema = infer(D[0], _.rest(D), {primaryKey: primaryKey});

      assert.equal(schema.primaryKey, primaryKey);
      done();
    });
  });

  it('do not create constraints if explicit param passed as False', function(done, err) {
    csv.parse(CSVData.dataInfer, function(E, D) {
      var schema = infer(D[0], _.rest(D), {explicit: false});


      assert.notOk(schema.fields[0].constraints);
      done();
    });
  });

  it('create constraints if explicit param passed as True', function(done, err) {
    csv.parse(CSVData.dataInfer, function(E, D) {
      var schema = infer(D[0], _.rest(D), {explicit: true});


      assert.ok(schema.fields[0].constraints);
      done();
    });
  });
});