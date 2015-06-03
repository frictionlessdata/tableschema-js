var _ = require('underscore');
var assert = require('chai').assert;
var should = require('chai').should();
var types = require('../').types;

var BASE_FIELD;


beforeEach(function(done) {
  BASE_FIELD = {
    'constraints': {'required': true},
    'format'     : 'default',
    'name'       : 'Name',
    'type'       : 'string'
  };

  done();
});

describe('StringType', function() {
  it('cast string', function(done, err) {
    assert((new types.StringType(BASE_FIELD)).cast('string'));
    done();
  });

  it('cast empty string if no constraints', function(done, err) {
    BASE_FIELD.constraints.required = false;
    assert((new types.StringType(BASE_FIELD)).cast(''));
    done();
  });

  it('don\'t cast digits', function(done, err) {
    assert.notOk((new types.StringType(BASE_FIELD)).cast(1));
    done();
  });

  it('don\'t cast empty string by default', function(done, err) {
    assert.notOk((new types.StringType(BASE_FIELD)).cast(''));
    done();
  });
});

describe('IntegerType', function() {
  beforeEach(function(done) {
    BASE_FIELD.type = 'integer';
    done();
  });

  it('cast integer', function(done, err) {
    assert((new types.IntegerType(BASE_FIELD)).cast(1));
    done();
  });

  it('don\'t cast string', function(done, err) {
    assert.notOk((new types.IntegerType(BASE_FIELD)).cast('string'));
    done();
  });
});

describe('NumberType', function() {
  it('cast float', function(done, err) { assert(false); });
  it('don\'t cast string', function(done, err) { assert(false); });
  it('cast currency', function(done, err) { assert(false); });
  it('don\'t cast wrong format currency', function(done, err) { assert(false); });
});

describe('DateType', function() {
  it('cast simple date', function(done, err) { assert(false); });
  it('cast any date', function(done, err) { assert(false); });
  it('cast date with format specified', function(done, err) { assert(false); });
  it('don\'t cast wrong simple date', function(done, err) { assert(false); });
  it('don\'t cast wrong date string', function(done, err) { assert(false); });
  it('don\'t cast date if it do not correspond specified format', function(done, err) { assert(false); });
});

describe('TimeType', function() {
  it('cast simple time', function(done, err) { assert(false); });
  it('don\'t cast wrong simple time', function(done, err) { assert(false); });
});

describe('DateTimeType', function() {
  it('cast simple datetime', function(done, err) { assert(false); });
  it('cast any datetime', function(done, err) { assert(false); });
  it('don\'t cast wrong simple date', function(done, err) { assert(false); });
});

describe('BooleanType', function() {
  it('cast simple string as True boolean', function(done, err) { assert(false); });
  it('cast simple string as False boolean', function(done, err) { assert(false); });
});

describe('NullType', function() {
  it('cast simple string as Null', function(done, err) { assert(false); });
  it('don\'t cast random string as Null', function(done, err) { assert(false); });
});

describe('ArrayType', function() {
  it('cast array', function(done, err) { assert(false); });
  it('don\'t cast random string as array', function(done, err) { assert(false); });
});

describe('ObjectType', function() {
  it('cast object', function(done, err) { assert(false); });
  it('don\'t cast random array as object', function(done, err) { assert(false); });
});

describe('GeoPointType', function() {
  it('cast geo point', function(done, err) { assert(false); });
  it('don\'t cast random string as Geopoint', function(done, err) { assert(false); });
});

describe('GeoJSONType', function() {
  it('cast geo json', function(done, err) { assert(false); });
  it('don\'t cast random string as GeoJSON', function(done, err) { assert(false); });
});


