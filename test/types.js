/* global describe, beforeEach, it, require */
import { assert } from 'chai'
import types from '../src/types'

let BASE_FIELD

describe('Types', () => {
  beforeEach((done) => {
    BASE_FIELD = {
      constraints: { required: true }
      , format: 'default'
      , name: 'Name'
      , type: 'string'
    }
    done()
  })

  describe('StringType', () => {
    const newType = base => new types.StringType(base)

    it('cast string', (done) => {
      assert(newType(BASE_FIELD).cast('string'))
      done()
    })

    it('cast empty string if no constraints', (done) => {
      BASE_FIELD.constraints.required = false
      assert(newType(BASE_FIELD).cast(''))
      done()
    })

    it('don\'t cast digits', (done) => {
      assert.notOk(newType(BASE_FIELD).cast(1))
      done()
    })

    it('don\'t cast empty string by default', (done) => {
      assert.notOk(newType(BASE_FIELD).cast(''))
      done()
    })

    it('cast email', (done) => {
      BASE_FIELD.format = 'email'
      assert(newType(BASE_FIELD).cast('example@example.com'))
      done()
    })

    it('don\'t cast email with wrong email format', (done) => {
      BASE_FIELD.format = 'email'
      assert.notOk(newType(BASE_FIELD).cast('example.com'))
      done()
    })

    it('don\'t cast email with non-string value', (done) => {
      BASE_FIELD.format = 'email'
      assert.notOk(newType(BASE_FIELD).cast(1))
      done()
    })

    it('cast uri', (done) => {
      BASE_FIELD.format = 'uri'
      assert(newType(BASE_FIELD).cast('http://www.example.com/'))
      done()
    })

    it('don\'t cast uri with wrong uri format', (done) => {
      BASE_FIELD.format = 'uri'
      assert.notOk(
        newType(BASE_FIELD).cast('http//www.example.com/'))
      done()
    })

    it('don\'t cast uri with non-string value', (done) => {
      BASE_FIELD.format = 'uri'
      assert.notOk(newType(BASE_FIELD).cast(1))
      done()
    })

    it('cast binary', (done) => {
      BASE_FIELD.format = 'binary'
      assert.ok(newType(BASE_FIELD).cast(
        Buffer.from('test').toString('base64')))
      done()
    })

    it('don\'t cast binary with non-string value', (done) => {
      BASE_FIELD.format = 'binary'
      assert.notOk(newType(BASE_FIELD).cast(1))
      done()
    })
  })

  describe('IntegerType', () => {
    const newType = base => new types.IntegerType(base)

    beforeEach((done) => {
      BASE_FIELD.type = 'integer'
      done()
    })

    it('cast integer', (done) => {
      assert.equal(newType(BASE_FIELD).cast(1), 1)
      done()
    })

    it('cast string "0"', (done) => {
      assert.equal(newType(BASE_FIELD).cast('0'), 0)
      done()
    })

    it('don\'t cast string "1.00"', (done) => {
      assert.isFalse(newType(BASE_FIELD).cast('1.00'))
      done()
    })

    it('don\'t cast float', (done) => {
      assert.isFalse(newType(BASE_FIELD).cast(1.01))
      done()
    })

    it('don\'t cast string', (done) => {
      assert.isFalse(newType(BASE_FIELD).cast('string'))
      done()
    })
  })

  describe('NumberType', () => {
    const newType = base => new types.NumberType(base)

    beforeEach((done) => {
      BASE_FIELD.type = 'number'
      done()
    })

    it('don\'t cast float .00', (done) => {
      assert.notOk(newType(BASE_FIELD).cast(1.00))
      done()
    })

    it('cast float', (done) => {
      assert.ok(newType(BASE_FIELD).cast(1.1))
      done()
    })

    it('cast localized numbers', (done) => {
      ['10,000.00', '10,000,000.00', '100.23'].forEach(function (value) {
        assert.ok((newType(BASE_FIELD)).cast(value))
      })
      BASE_FIELD.decimalChar = '#';
      ['10,000#00', '10,000,000#00', '100#23'].forEach(function (value) {
        assert.ok(newType(BASE_FIELD).cast(value))
      })
      BASE_FIELD.groupChar = 'Q';
      ['10Q000#00', '10Q000Q000#00', '100#23'].forEach(function (value) {
        assert.ok(newType(BASE_FIELD).cast(value))
      })
      done()
    })

    it('don\'t cast string "0"', (done) => {
      assert.notOk(newType(BASE_FIELD).cast('0'))
      done()
    })

    it('don\'t cast string', (done) => {
      assert.notOk(newType(BASE_FIELD).cast('string'))
      done()
    })

    it('cast currency', (done) => {
      BASE_FIELD.format = 'currency';

      ['10,000.00', '$10000.00'].forEach((value) => {
        assert.ok(newType(BASE_FIELD).cast(value))
      })

      BASE_FIELD.groupChar = ' '
      BASE_FIELD.decimalChar = ',';
      ['10 000 000,00', '10000,00', '10,000 €'].forEach(function (V) {
        if (!(newType(BASE_FIELD)).cast(V)) {
          console.log('BBB', BASE_FIELD, V)
        }
        assert((newType(BASE_FIELD)).cast(V))
      })
      done()
    })

    it('cast currency from Number', (done) => {
      BASE_FIELD.format = 'currency'
      assert.ok(newType(BASE_FIELD).cast(Number(10000.01)))
      done()
    })

    it('don\'t cast wrong format currency', (done) => {
      BASE_FIELD.format = 'currency'

      const numbers = ['10,000a.00', '10+000.00', '$10:000.00']
      numbers.forEach((value) => {
        assert.notOk(newType(BASE_FIELD).cast(value))
      })
      done()
    })
  })

  describe('DateType', () => {
    const newType = base => new types.DateType(base)

    beforeEach((done) => {
      BASE_FIELD.format = 'default'
      BASE_FIELD.type = 'date'
      done()
    })

    it('cast simple date', (done) => {
      assert(newType(BASE_FIELD).cast('2019-01-01'))
      done()
    })

    it('cast any date', (done) => {
      BASE_FIELD.format = 'any'
      assert(newType(BASE_FIELD).cast('10 Jan 1969'))
      done()
    })

    it('cast date with format specified', (done) => {
      BASE_FIELD.format = 'fmt:DD/MM/YYYY'
      assert(newType(BASE_FIELD).cast('10/06/2014'))
      done()
    })

    it('don\'t cast wrong simple date', (done) => {
      assert.notOk(newType(BASE_FIELD).cast('01-01-2019'))
      done()
    })

    it('don\'t cast wrong date string', (done) => {
      assert.notOk(
        newType(BASE_FIELD).cast('10th Jan nineteen sixty nine'))
      done()
    })

    it('don\'t cast date if it do not correspond specified format',
       (done) => {
         BASE_FIELD.format = 'fmt:DD/MM/YYYY'
         assert.notOk(newType(BASE_FIELD).cast('2014/12/19'))
         done()
       })
  })

  describe('TimeType', () => {
    beforeEach((done) => {
      BASE_FIELD.format = 'default'
      BASE_FIELD.type = 'time'
      done()
    })

    it('cast simple time', (done) => {
      assert((new types.TimeType(BASE_FIELD)).cast('06:00:00'))
      done()
    })

    it('don\'t cast wrong simple time', (done) => {
      assert.notOk((new types.TimeType(BASE_FIELD)).cast('3 am'))
      done()
    })
  })

  describe('DateTimeType', () => {
    beforeEach((done) => {
      BASE_FIELD.format = 'default'
      BASE_FIELD.type = 'datetime'
      done()
    })

    it('cast simple datetime', (done) => {
      assert((new types.DateTimeType(BASE_FIELD)).cast('2014-01-01T06:00:00Z'))
      done()
    })

    it('cast any datetime', (done) => {
      BASE_FIELD.format = 'any'
      assert((new types.DateTimeType(BASE_FIELD)).cast('10 Jan 1969 9:00'))
      done()
    })

    it('don\'t cast wrong simple date', (done) => {
      assert.notOk((new types.DateTimeType(BASE_FIELD)).cast('10 Jan 1969 9'))
      done()
    })
  })

  describe('BooleanType', () => {
    beforeEach((done) => {
      BASE_FIELD.type = 'boolean'
      done()
    })

    const newType = base => new types.BooleanType(base)

    it('cast boolean', (done) => {
      assert.ok(newType(BASE_FIELD).cast(true))
      done()
    })

    it('cast simple string as True boolean', (done) => {
      assert.ok(newType(BASE_FIELD).cast('y'))
      done()
    })

    it('cast simple string as False boolean', (done) => {
      assert.ok(newType(BASE_FIELD).cast('n'))
      done()
    })
  })

  describe('ArrayType', () => {
    beforeEach((done) => {
      BASE_FIELD.type = 'array'
      done()
    })

    it('cast array', (done) => {
      assert((new types.ArrayType(BASE_FIELD)).cast([1, 2]))
      done()
    })

    it('don\'t cast random string as array', (done) => {
      assert.notOk((new types.ArrayType(BASE_FIELD)).cast('string, string'))
      done()
    })
  })

  describe('ObjectType', () => {
    beforeEach((done) => {
      BASE_FIELD.type = 'object'
      done()
    })

    it('cast object', (done) => {
      assert((new types.ObjectType(BASE_FIELD)).cast({ key: 'value' }))
      done()
    })

    it('don\'t cast random array as object', (done) => {
      assert.notOk((new types.ObjectType(BASE_FIELD)).cast(['boo', 'ya']))
      done()
    })
  })

  describe('GeoPointType', () => {
    beforeEach((done) => {
      BASE_FIELD.type = 'geopoint'
      done()
    })

    it('cast geo point', (done) => {
      assert((new types.GeoPointType(BASE_FIELD)).cast('10.0, 21.00'))
      done()
    })

    it('don\'t cast random string as Geopoint', (done) => {
      assert.notOk(
        (new types.GeoPointType(BASE_FIELD)).cast('this is not a geopoint'))
      done()
    })
  })

  describe('GeoJSONType', () => {
    beforeEach((done) => {
      BASE_FIELD.type = 'geojson'
      done()
    })

    it('cast geo json', (done) => {
      assert((new types.GeoJSONType(BASE_FIELD)).cast({ type: 'Point' }))
      done()
    })

    it('don\'t cast random string as GeoJSON', (done) => {
      assert.notOk((new types.GeoJSONType(BASE_FIELD)).cast(''))
      done()
    })
  })
})
