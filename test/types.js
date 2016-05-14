/* global describe, beforeEach, it, require */
var assert = require('chai').assert
  , types = require('../lib/').types
  , BASE_FIELD

describe('Types', function() {
  beforeEach(function(done) {
    BASE_FIELD = {
      constraints: { required: true }
      , format: 'default'
      , name: 'Name'
      , type: 'string'
    }
    done()
  })

  describe('StringType', function() {
    var newType = base => new types.StringType(base)

    it('cast string', function(done) {
      assert(newType(BASE_FIELD).cast('string'))
      done()
    })

    it('cast empty string if no constraints', function(done) {
      BASE_FIELD.constraints.required = false
      assert(newType(BASE_FIELD).cast(''))
      done()
    })

    it('don\'t cast digits', function(done) {
      assert.notOk(newType(BASE_FIELD).cast(1))
      done()
    })

    it('don\'t cast empty string by default', function(done) {
      assert.notOk(newType(BASE_FIELD).cast(''))
      done()
    })

    it('cast email', function(done) {
      BASE_FIELD.format = 'email'
      assert(newType(BASE_FIELD).cast('example@example.com'))
      done()
    })

    it('don\'t cast email with wrong email format', function(done) {
      BASE_FIELD.format = 'email'
      assert.notOk(newType(BASE_FIELD).cast('example.com'))
      done()
    })

    it('don\'t cast email with non-string value', function(done) {
      BASE_FIELD.format = 'email'
      assert.notOk(newType(BASE_FIELD).cast(1))
      done()
    })

    it('cast uri', function(done) {
      BASE_FIELD.format = 'uri'
      assert(newType(BASE_FIELD).cast('http://www.example.com/'))
      done()
    })

    it('don\'t cast uri with wrong uri format', function(done) {
      BASE_FIELD.format = 'uri'
      assert.notOk(
        newType(BASE_FIELD).cast('http//www.example.com/'))
      done()
    })

    it('don\'t cast uri with non-string value', function(done) {
      BASE_FIELD.format = 'uri'
      assert.notOk(newType(BASE_FIELD).cast(1))
      done()
    })

    it('cast binary', function(done) {
      BASE_FIELD.format = 'binary'
      assert.ok(newType(BASE_FIELD).cast(
        Buffer.from('test').toString('base64')))
      done()
    })

    it('don\'t cast binary with non-string value', function(done) {
      BASE_FIELD.format = 'binary'
      assert.notOk(newType(BASE_FIELD).cast(1))
      done()
    })
  })

  describe('IntegerType', function() {
    var newType = base => new types.IntegerType(base)

    beforeEach(function(done) {
      BASE_FIELD.type = 'integer'
      done()
    })

    it('cast integer', function(done) {
      assert(newType(BASE_FIELD).cast(1))
      done()
    })

    it('cast string "0"', function(done) {
      assert.ok(newType(BASE_FIELD).cast('0'))
      done()
    })

    it('don\'t cast string', function(done) {
      assert.notOk(newType(BASE_FIELD).cast('string'))
      done()
    })
  })

  describe('NumberType', function() {
    var newType = base => new types.NumberType(base)

    beforeEach(function(done) {
      BASE_FIELD.type = 'number'
      done()
    })

    it('don\'t cast float .00', function(done) {
      assert.notOk(newType(BASE_FIELD).cast(1.00))
      done()
    })

    it('cast float', function(done) {
      assert.ok(newType(BASE_FIELD).cast(1.1))
      done()
    })

    it('don\'t cast string "0"', function(done) {
      assert.notOk(newType(BASE_FIELD).cast('0'))
      done()
    })

    it('don\'t cast string', function(done) {
      assert.notOk(newType(BASE_FIELD).cast('string'))
      done()
    })

    it('cast currency', function(done) {
      BASE_FIELD.format = 'currency'
      var numbers = ['10,000.00', '10000.00', '$10000.00']

      numbers.forEach((value) => {
        assert.ok(newType(BASE_FIELD).cast(value))
      })
      done()
    })

    it('cast currency from Number', function(done) {
      BASE_FIELD.format = 'currency'
      assert.ok(newType(BASE_FIELD).cast(new Number(10000.00)))
      done()
    })

    it('don\'t cast wrong format currency', function(done) {
      BASE_FIELD.format = 'currency'

      var numbers = ['10,000a.00', '10+000.00', '$10:000.00']
      numbers.forEach((value) => {
        assert.notOk(newType(BASE_FIELD).cast(value))
      })
      done()
    })
  })

  describe('DateType', function() {
    var newType = base => new types.DateType(base)

    beforeEach(function(done) {
      BASE_FIELD.format = 'default'
      BASE_FIELD.type = 'date'
      done()
    })

    it('cast simple date', function(done) {
      assert(newType(BASE_FIELD).cast('2019-01-01'))
      done()
    })

    it('cast any date', function(done) {
      BASE_FIELD.format = 'any'
      assert(newType(BASE_FIELD).cast('10 Jan 1969'))
      done()
    })

    it('cast date with format specified', function(done) {
      BASE_FIELD.format = 'fmt:DD/MM/YYYY'
      assert(newType(BASE_FIELD).cast('10/06/2014'))
      done()
    })

    it('don\'t cast wrong simple date', function(done) {
      assert.notOk(newType(BASE_FIELD).cast('01-01-2019'))
      done()
    })

    it('don\'t cast wrong date string', function(done) {
      assert.notOk(
        newType(BASE_FIELD).cast('10th Jan nineteen sixty nine'))
      done()
    })

    it('don\'t cast date if it do not correspond specified format',
       function(done) {
         BASE_FIELD.format = 'fmt:DD/MM/YYYY'
         assert.notOk(newType(BASE_FIELD).cast('2014/12/19'))
         done()
       })
  })

  describe('TimeType', function() {
    beforeEach(function(done) {
      BASE_FIELD.format = 'default'
      BASE_FIELD.type = 'time'
      done()
    })

    it('cast simple time', function(done) {
      assert((new types.TimeType(BASE_FIELD)).cast('06:00:00'))
      done()
    })

    it('don\'t cast wrong simple time', function(done) {
      assert.notOk((new types.TimeType(BASE_FIELD)).cast('3 am'))
      done()
    })
  })

  describe('DateTimeType', function() {
    beforeEach(function(done) {
      BASE_FIELD.format = 'default'
      BASE_FIELD.type = 'datetime'
      done()
    })

    it('cast simple datetime', function(done) {
      assert((new types.DateTimeType(BASE_FIELD)).cast('2014-01-01T06:00:00Z'))
      done()
    })

    it('cast any datetime', function(done) {
      BASE_FIELD.format = 'any'
      assert((new types.DateTimeType(BASE_FIELD)).cast('10 Jan 1969 9:00'))
      done()
    })

    it('don\'t cast wrong simple date', function(done) {
      assert.notOk((new types.DateTimeType(BASE_FIELD)).cast('10 Jan 1969 9'))
      done()
    })
  })

  describe('BooleanType', function() {
    beforeEach(function(done) {
      BASE_FIELD.type = 'boolean'
      done()
    })

    it('cast simple string as True boolean', function(done) {
      assert((new types.BooleanType(BASE_FIELD)).cast('y'))
      done()
    })

    it('cast simple string as False boolean', function(done) {
      assert((new types.BooleanType(BASE_FIELD)).cast('n'))
      done()
    })
  })

  describe('NullType', function() {
    beforeEach(function(done) {
      BASE_FIELD.type = 'null'
      done()
    })

    it('cast simple string as Null', function(done) {
      assert((new types.NullType(BASE_FIELD)).cast('null'))
      done()
    })

    it('don\'t cast random string as Null', function(done) {
      assert.notOk((new types.NullType(BASE_FIELD)).cast('isnull'))
      done()
    })
  })

  describe('ArrayType', function() {
    beforeEach(function(done) {
      BASE_FIELD.type = 'array'
      done()
    })

    it('cast array', function(done) {
      assert((new types.ArrayType(BASE_FIELD)).cast([1, 2]))
      done()
    })

    it('don\'t cast random string as array', function(done) {
      assert.notOk((new types.ArrayType(BASE_FIELD)).cast('string, string'))
      done()
    })
  })

  describe('ObjectType', function() {
    beforeEach(function(done) {
      BASE_FIELD.type = 'object'
      done()
    })

    it('cast object', function(done) {
      assert((new types.ObjectType(BASE_FIELD)).cast({ key: 'value' }))
      done()
    })

    it('don\'t cast random array as object', function(done) {
      assert.notOk((new types.ObjectType(BASE_FIELD)).cast(['boo', 'ya']))
      done()
    })
  })

  describe('GeoPointType', function() {
    beforeEach(function(done) {
      BASE_FIELD.type = 'geopoint'
      done()
    })

    it('cast geo point', function(done) {
      assert((new types.GeoPointType(BASE_FIELD)).cast('10.0, 21.00'))
      done()
    })

    it('don\'t cast random string as Geopoint', function(done) {
      assert.notOk(
        (new types.GeoPointType(BASE_FIELD)).cast('this is not a geopoint'))
      done()
    })
  })

  describe('GeoJSONType', function() {
    beforeEach(function(done) {
      BASE_FIELD.type = 'geojson'
      done()
    })

    it('cast geo json', function(done) {
      assert((new types.GeoJSONType(BASE_FIELD)).cast({ type: 'Point' }))
      done()
    })

    it('don\'t cast random string as GeoJSON', function(done) {
      assert.notOk((new types.GeoJSONType(BASE_FIELD)).cast(''))
      done()
    })
  })
})
