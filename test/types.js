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
  beforeEach(function(done) {
    BASE_FIELD.type = 'number';
    done();
  });

  it('cast float', function(done, err) {
    assert((new types.NumberType(BASE_FIELD)).cast(1.1));
    done();
  });

  it('don\'t cast string', function(done, err) {
    assert.notOk((new types.NumberType(BASE_FIELD)).cast('string'));
    done();
  });

  it('cast currency', function(done, err) {
    BASE_FIELD.format = 'currency';

    ['10,000.00', '10;000.00', '$10000.00'].forEach(function(V) {
      assert((new types.NumberType(BASE_FIELD)).cast(V));
    });

    done();
  });

  it('don\'t cast wrong format currency', function(done, err) {
    BASE_FIELD.format = 'currency';

    ['10,000a.00', '10+000.00', '$10:000.00'].forEach(function(V) {
      assert.notOk((new types.NumberType(BASE_FIELD)).cast(V));
    });

    done();
  });
});

describe('DateType', function() {
  beforeEach(function(done) {
    BASE_FIELD.format = 'default';
    BASE_FIELD.type = 'date';
    done();
  });

  it('cast simple date', function(done, err) {
    assert((new types.DateType(BASE_FIELD)).cast('2019-01-01'));
    done();
  });

  it('cast any date', function(done, err) {
    BASE_FIELD.format = 'any';
    assert((new types.DateType(BASE_FIELD)).cast('10 Jan 1969'));
    done();
  });

  it('cast date with format specified', function(done, err) {
    BASE_FIELD.format = 'fmt:DD/MM/YYYY';
    assert((new types.DateType(BASE_FIELD)).cast('10/06/2014'));
    done();
  });

  it('don\'t cast wrong simple date', function(done, err) {
    assert.notOk((new types.DateType(BASE_FIELD)).cast('01-01-2019'));
    done();
  });

  it('don\'t cast wrong date string', function(done, err) {
    assert.notOk((new types.DateType(BASE_FIELD)).cast('10th Jan nineteen sixty nine'));
    done();
  });

  it('don\'t cast date if it do not correspond specified format', function(done, err) {
    BASE_FIELD.format = 'fmt:DD/MM/YYYY';
    assert.notOk((new types.DateType(BASE_FIELD)).cast('2014/12/19'));
    done();
  });
});

describe('TimeType', function() {
  beforeEach(function(done) {
    BASE_FIELD.format = 'default';
    BASE_FIELD.type = 'time';
    done();
  });

  it('cast simple time', function(done, err) {
    assert((new types.TimeType(BASE_FIELD)).cast('06:00:00'));
    done();
  });

  it('don\'t cast wrong simple time', function(done, err) {
    assert.notOk((new types.TimeType(BASE_FIELD)).cast('3 am'));
    done();
  });
});

describe('DateTimeType', function() {
  beforeEach(function(done) {
    BASE_FIELD.format = 'default';
    BASE_FIELD.type = 'datetime';
    done();
  });

  it('cast simple datetime', function(done, err) {
    assert((new types.DateTimeType(BASE_FIELD)).cast('2014-01-01T06:00:00Z'));
    done();
  });

  it('cast any datetime', function(done, err) {
    BASE_FIELD.format = 'any';
    assert((new types.DateTimeType(BASE_FIELD)).cast('10 Jan 1969 9:00'));
    done();
  });

  it('don\'t cast wrong simple date', function(done, err) {
    assert.notOk((new types.DateTimeType(BASE_FIELD)).cast('10 Jan 1969 9'));
    done();
  });
});

describe('BooleanType', function() {
  beforeEach(function(done) {
    BASE_FIELD.type = 'boolean';
    done();
  });

  it('cast simple string as True boolean', function(done, err) {
    assert((new types.BooleanType(BASE_FIELD)).cast('y'));
    done();
  });

  it('cast simple string as False boolean', function(done, err) {
    assert((new types.BooleanType(BASE_FIELD)).cast('n'));
    done();
  });
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


