/* global describe, beforeEach, it, require */
import { assert } from 'chai'
import Type from '../src/types'
import d3time from 'd3-time-format'
import moment from 'moment'

let BASE_FIELD
describe('Types', () => {
  beforeEach(done => {
    BASE_FIELD = {
      constraints: { required: true }
      , format: 'default'
      , name: 'Name'
      , type: 'string'
    }
    done()
  })

  const type = new Type()

  describe('StringType', () => {
    it('cast string', done => {
      assert.equal(type.cast(BASE_FIELD, 'string'), 'string')
      assert.isTrue(type.test(BASE_FIELD, 'string'))
      done()
    })

    it('cast empty string if no constraints', done => {
      assert.isNull(type.cast(BASE_FIELD, ''))
      assert.isTrue(type.test(BASE_FIELD, ''))
      done()
    })

    it('don\'t cast empty string if constraints', done => {
      const value = ''
      assert.throws(() => {
        type.cast(BASE_FIELD, value, false)
      }, Error)
      assert.isTrue(type.test(BASE_FIELD, value))
      assert.isFalse(type.test(BASE_FIELD, value, false))
      done()
    })

    it('cast string if constraints pattern match', done => {
      const value = 'String match tests'
      BASE_FIELD.constraints.pattern = '/test/gmi'
      assert.equal(type.cast(BASE_FIELD, value, false), value)
      assert.isTrue(type.test(BASE_FIELD, value, false))
      done()
    })

    it('unsupported constraints should throw error', done => {
      const value = 'String'
      BASE_FIELD.constraints.unknown = 1
      assert.throws(() => {
        type.cast(BASE_FIELD, value, false)
      }, Error)
      assert.isTrue(type.test(BASE_FIELD, value))
      assert.isFalse(type.test(BASE_FIELD, value, false))
      done()
    })

    it('should check constraints successfully', done => {
      const value = 'String'
      BASE_FIELD.constraints.minLength = 3
      BASE_FIELD.constraints.maxLength = 6
      assert.equal(type.cast(BASE_FIELD, value, false), value)
      assert.isTrue(type.test(BASE_FIELD, value))
      done()
    })

    it('should throw error on constraints', done => {
      const value = 'String'
      BASE_FIELD.constraints.minLength = 1
      BASE_FIELD.constraints.maxLength = 3
      assert.throws(() => {
        type.cast(BASE_FIELD, value, false)
      }, Error)
      assert.isTrue(type.test(BASE_FIELD, value))
      assert.isFalse(type.test(BASE_FIELD, value, false))
      done()
    })

    it('don\'t cast string if constraints pattern does not match', done => {
      const value = 'String not match'
      BASE_FIELD.constraints.pattern = '/test/gmi'
      assert.throws(() => {
        type.cast(BASE_FIELD, value, false)
      }, Error)
      assert.isTrue(type.test(BASE_FIELD, value))
      assert.isFalse(type.test(BASE_FIELD, value, false))
      done()
    })

    it('don\'t cast digits', done => {
      assert.throws(() => {
        type.cast(BASE_FIELD, 1)
      }, Error)
      assert.isFalse(type.test(BASE_FIELD, 1))
      done()
    })

    it('cast "null" value returns null', done => {
      assert.isNull(type.cast(BASE_FIELD, ''))
      assert.isTrue(type.test(BASE_FIELD, ''))
      done()
    })

    it('cast email', done => {
      const value = 'example@example.com'
      BASE_FIELD.format = 'email'
      assert.equal(type.cast(BASE_FIELD, value), value)
      assert.isTrue(type.test(BASE_FIELD, value))
      done()
    })

    it('don\'t cast email with wrong email format', done => {
      const value = 'example.com'
      BASE_FIELD.format = 'email'
      assert.throws(() => {
        type.cast(BASE_FIELD, value)
      }, Error)
      assert.isFalse(type.test(BASE_FIELD, value))
      done()
    })

    it('don\'t cast email with non-string value', done => {
      BASE_FIELD.format = 'email'
      assert.throws(() => {
        type.cast(BASE_FIELD, 1)
      }, Error)
      assert.isFalse(type.test(BASE_FIELD, 1))
      done()
    })

    it('cast uri', done => {
      const value = 'http://www.example.com/'
      BASE_FIELD.format = 'uri'
      assert.equal(type.cast(BASE_FIELD, value), value)
      assert.isTrue(type.test(BASE_FIELD, value))
      done()
    })

    it('don\'t cast uri with wrong uri format', done => {
      const value = 'http//www.example.com/'
      BASE_FIELD.format = 'uri'
      assert.throws(() => {
        type.cast(BASE_FIELD, value)
      }, Error)
      assert.isFalse(type.test(BASE_FIELD, value))
      done()
    })

    it('don\'t cast uri with non-string value', done => {
      BASE_FIELD.format = 'uri'
      assert.throws(() => {
        type.cast(BASE_FIELD, 1)
      }, Error)
      assert.isFalse(type.test(BASE_FIELD, 1))
      done()
    })

    it('cast binary', done => {
      const value = Buffer.from('test').toString('base64')
      BASE_FIELD.format = 'binary'
      assert.equal(type.cast(BASE_FIELD, value), 'test')
      assert.isTrue(type.test(BASE_FIELD, value))
      done()
    })

    it('don\'t cast binary with non-string value', done => {
      BASE_FIELD.format = 'binary'
      assert.throws(() => {
        type.cast(BASE_FIELD, 1)
      }, Error)
      assert.isFalse(type.test(BASE_FIELD, 1))
      done()
    })

    it('cast default if unknown format provided', done => {
      const value = 'httpwww.example.com/'
      BASE_FIELD.format = 'unknown'
      assert.equal(type.cast(BASE_FIELD, value), value)
      assert.isTrue(type.test(BASE_FIELD, value))
      done()
    })
  })

  describe('IntegerType', () => {
    beforeEach(done => {
      BASE_FIELD.type = 'integer'
      done()
    })

    it('cast integer', done => {
      assert.equal(type.cast(BASE_FIELD, 1), 1)
      assert.isTrue(type.test(BASE_FIELD, 1))
      done()
    })

    it('cast string "0"', done => {
      assert.equal(type.cast(BASE_FIELD, '0'), 0)
      assert.isTrue(type.test(BASE_FIELD, '0'))
      done()
    })

    it('don\'t cast string "1.00"', done => {
      assert.throws(() => {
        type.cast(BASE_FIELD, '1.00')
      }, Error)
      assert.isFalse(type.test(BASE_FIELD, '1.00'))
      done()
    })

    it('don\'t cast float', done => {
      assert.throws(() => {
        type.cast(BASE_FIELD, 1.01)
      }, Error)
      assert.isFalse(type.test(BASE_FIELD, 1.01))
      done()
    })

    it('don\'t cast string', done => {
      assert.throws(() => {
        type.cast(BASE_FIELD, 'string')
      }, Error)
      assert.isFalse(type.test(BASE_FIELD, 'string'))
      done()
    })

    it('cast percent signs', done => {
      assert.ok(type.cast(BASE_FIELD, '100%'))
      assert.ok(type.cast(BASE_FIELD, '1000‰'))
      done()
    })
  })

  describe('NumberType', () => {
    beforeEach(done => {
      BASE_FIELD.type = 'number'
      done()
    })

    it('cast float', done => {
      assert.equal(type.cast(BASE_FIELD, 1.1), 1.1)
      assert.equal(type.cast(BASE_FIELD, '1.00'), '1.00')
      assert.equal(type.cast(BASE_FIELD, 1.00), 1)
      assert.isTrue(type.test(BASE_FIELD, 1.1))
      assert.isTrue(type.test(BASE_FIELD, '1.00'))
      assert.isTrue(type.test(BASE_FIELD, 1.00))
      assert.equal(type.cast(BASE_FIELD, Number(1.00).toFixed(2)), '1.00')
      assert.isTrue(type.test(BASE_FIELD, Number(1.00).toFixed(2)))
      done()
    })

    it('cast localized numbers', done => {
      ['10,000.00', '10,000,000.00', '100.23'].forEach(function (value) {
        assert.doesNotThrow(() => {
          type.cast(BASE_FIELD, value)
        }, Error)
        assert.isTrue(type.test(BASE_FIELD, value))
      })
      BASE_FIELD.decimalChar = '#';
      ['10,000#00', '10,000,000#00', '100#23'].forEach(function (value) {
        assert.doesNotThrow(() => {
          type.cast(BASE_FIELD, value)
        }, Error)
        assert.isTrue(type.test(BASE_FIELD, value))
      })
      BASE_FIELD.groupChar = 'Q';
      ['10Q000#00', '10Q000Q000#00', '100#23'].forEach(function (value) {
        assert.doesNotThrow(() => {
          type.cast(BASE_FIELD, value)
        }, Error)
        assert.isTrue(type.test(BASE_FIELD, value))
      })
      done()
    })

    it('don\'t cast string "0"', done => {
      assert.doesNotThrow(() => {
        type.cast(BASE_FIELD, '0')
      }, Error)
      assert.isTrue(type.test(BASE_FIELD, '0'))
      done()
    })

    it('don\'t cast string', done => {
      assert.throws(() => {
        type.cast(BASE_FIELD, 'string')
      }, Error)
      assert.isFalse(type.test(BASE_FIELD, 'string'))
      done()
    })

    it('cast currency', done => {
      BASE_FIELD.format = 'currency';

      ['10,000.00', '$10000.00'].forEach((value) => {
        assert.doesNotThrow(() => {
          type.cast(BASE_FIELD, value)
        }, Error)
        assert.isTrue(type.test(BASE_FIELD, value))
      })

      BASE_FIELD.groupChar = ' '
      BASE_FIELD.decimalChar = ',';
      ['10 000 000,00', '10000,00', '10,000 €'].forEach(function (value) {
        assert.doesNotThrow(() => {
          type.cast(BASE_FIELD, value)
        }, Error)
        assert.isTrue(type.test(BASE_FIELD, value))
      })
      done()
    })

    it('cast currency from Number', done => {
      BASE_FIELD.format = 'currency'
      assert.ok(type.cast(BASE_FIELD, Number(10000.01)))
      done()
    })

    it('don\'t cast wrong format currency', done => {
      BASE_FIELD.format = 'currency'

      const numbers = ['10,000a.00', '10+000.00', '$10:000.00']
      numbers.forEach((value) => {
        assert.throws(() => {
          type.cast(BASE_FIELD, value)
        }, Error)
        assert.isFalse(type.test(BASE_FIELD, value))
      })
      done()
    })

    it('cast percent signs', function (done) {
      assert.ok(type.cast(BASE_FIELD, '95.23%'))
      assert.ok(type.cast(BASE_FIELD, '995.56‰'))
      done()
    })
  })

  describe('DateType', () => {
    beforeEach(done => {
      BASE_FIELD.format = 'default'
      BASE_FIELD.type = 'date'
      done()
    })

    it('cast simple date', done => {
      assert.isObject(type.cast(BASE_FIELD, '2019-01-01'))
      assert.isTrue(type.test(BASE_FIELD, '2019-01-01'))
      done()
    })

    it('cast any date', done => {
      BASE_FIELD.format = 'any'
      assert.isObject(type.cast(BASE_FIELD, '10 Jan 1969'))
      assert.isTrue(type.test(BASE_FIELD, '10 Jan 1969'))
      done()
    })

    it('cast date with format specified', done => {
      BASE_FIELD.format = 'fmt:%d/%m/%Y'

      const value = '10/06/2014'
        , result = moment(d3time.timeParse('%d/%m/%Y')(value))

      assert.deepEqual(type.cast(BASE_FIELD, value), result)
      assert.isTrue(type.test(BASE_FIELD, value))
      done()
    })

    it('don\'t cast wrong simple date', done => {
      assert.throws(() => {
        type.cast(BASE_FIELD, '01-01-2019')
      }, Error)
      assert.isFalse(type.test(BASE_FIELD, '01-01-2019'))
      done()
    })

    it('don\'t cast wrong date string', done => {
      const value = '10th Jan nineteen sixty nine'

      assert.throws(() => {
        type.cast(BASE_FIELD, value)
      }, Error)
      assert.isFalse(type.test(BASE_FIELD, value))
      done()
    })

    it('don\'t cast date if it do not correspond specified format',
       done => {
         BASE_FIELD.format = 'fmt:%d/%m/%Y'
         const value = '2014/12/19'

         assert.throws(() => {
           type.cast(BASE_FIELD, value)
         }, Error)
         assert.isFalse(type.test(BASE_FIELD, value))
         done()
       })
  })

  describe('TimeType', () => {
    beforeEach(done => {
      BASE_FIELD.format = 'default'
      BASE_FIELD.type = 'time'
      done()
    })

    it('cast simple time', done => {
      assert.isObject(type.cast(BASE_FIELD, '06:00:00'))
      assert.isTrue(type.test(BASE_FIELD, '06:00:00'))
      done()
    })

    it('don\'t cast wrong simple time', done => {
      assert.throws(() => {
        type.cast(BASE_FIELD, '3 am')
      }, Error)
      assert.isFalse(type.test(BASE_FIELD, '3 am'))
      done()
    })
  })

  describe('DateTimeType', () => {
    beforeEach(done => {
      BASE_FIELD.format = 'default'
      BASE_FIELD.type = 'datetime'
      done()
    })

    it('cast simple datetime', done => {
      assert.isObject(type.cast(BASE_FIELD, '2014-01-01T06:00:00Z'))
      assert.isTrue(type.test(BASE_FIELD, '2014-01-01T06:00:00Z'))
      done()
    })

    it('cast any datetime', done => {
      BASE_FIELD.format = 'any'
      assert.isObject(type.cast(BASE_FIELD, '10 Jan 1969 9:00'))
      assert.isTrue(type.test(BASE_FIELD, '10 Jan 1969 9:00'))
      done()
    })

    it('don\'t cast wrong simple date', done => {
      const value = '10 Jan 1969 9'
      assert.throws(() => {
        type.cast(BASE_FIELD, value)
      }, Error)
      assert.isFalse(type.test(BASE_FIELD, value))
      done()
    })
  })

  describe('BooleanType', () => {
    beforeEach(done => {
      BASE_FIELD.type = 'boolean'
      done()
    })

    it('cast boolean', done => {
      assert.equal(type.cast(BASE_FIELD, true), true)
      assert.isTrue(type.test(BASE_FIELD, true))
      done()
    })

    it('cast simple string as True boolean', done => {
      assert.equal(type.cast(BASE_FIELD, 'y'), true)
      assert.isTrue(type.test(BASE_FIELD, 'y'))
      done()
    })

    it('cast simple string as False boolean', done => {
      assert.equal(type.cast(BASE_FIELD, 'n'), false)
      assert.isTrue(type.test(BASE_FIELD, 'n'))
      done()
    })
  })

  describe('ArrayType', () => {
    beforeEach(done => {
      BASE_FIELD.type = 'array'
      done()
    })

    it('cast array', done => {
      assert.deepEqual(type.cast(BASE_FIELD, [1, 2]), [1, 2])
      assert.isTrue(type.test(BASE_FIELD, [1, 2]))
      done()
    })

    it('don\'t cast random string as array', done => {
      assert.throws(() => {
        type.cast(BASE_FIELD, 'string, string')
      }, Error)
      assert.isFalse(type.test(BASE_FIELD, 'string, string'))
      done()
    })
  })

  describe('ObjectType', () => {
    beforeEach(done => {
      BASE_FIELD.type = 'object'
      done()
    })

    it('cast object', done => {
      assert.deepEqual(type.cast(BASE_FIELD, { key: 'value' }),
                       { key: 'value' })
      assert.isTrue(type.test(BASE_FIELD, { key: 'value' }))
      done()
    })

    it('don\'t cast random array as object', done => {
      assert.throws(() => {
        type.cast(BASE_FIELD, ['boo', 'ya'])
      }, Error)
      assert.isFalse(type.test(BASE_FIELD, ['boo', 'ya']))
      done()
    })
  })

  // TODO rewrite completely Geo types
  describe('GeoPointType', () => {
    beforeEach(done => {
      BASE_FIELD.type = 'geopoint'
      done()
    })

    it('cast geo point from string', done => {
      assert.deepEqual(type.cast(BASE_FIELD, '10.0, 21.00'),
                       ['10.0', '21.00'])
      assert.isTrue(type.test(BASE_FIELD, '10.0, 21.00'))
      done()
    })

    it('don\'t cast random string as Geopoint', done => {
      const value = 'this is not a geopoint'
      assert.throws(() => {
        type.cast(BASE_FIELD, value)
      }, Error)
      assert.isFalse(type.test(BASE_FIELD, value))
      done()
    })

    it('cast geo point from array', done => {
      const value = ['10.0', '21.00']
      assert.deepEqual(type.cast(BASE_FIELD, value), value)
      assert.isTrue(type.test(BASE_FIELD, value))
      done()
    })

    it('cast geo point from array of numbers', done => {
      const value = [10.0, 21.00]
      assert.deepEqual(type.cast(BASE_FIELD, value), ['10.0', '21.0'])
      assert.isTrue(type.test(BASE_FIELD, value))
      done()
    })

    it('don\'t cast geo point from strings array', done => {
      const value = ['ddd', 'ddd']
      assert.throws(() => {
        type.cast(BASE_FIELD, value)
      }, Error)
      assert.isFalse(type.test(BASE_FIELD, value))
      done()
    })

    it('don\'t cast array with incorrect length of values', done => {
      const value = ['10.0']
      assert.throws(() => {
        type.cast(BASE_FIELD, value)
      }, Error)
      assert.isFalse(type.test(BASE_FIELD, value))
      done()
    })

    it('cast geo point from object', done => {
      const value = { longitude: 10.0, latitude: 21.0 }
      assert.deepEqual(type.cast(BASE_FIELD, value), ['10.0', '21.0'])
      assert.isTrue(type.test(BASE_FIELD, value))
      done()
    })

    it('don\'t cast geo point from any object', done => {
      const value = { l: 10.0, t: 21.0 }
      assert.throws(() => {
        type.cast(BASE_FIELD, value)
      }, Error)
      assert.isFalse(type.test(BASE_FIELD, value))
      done()
    })

    it('don\'t cast geo point from object with not numbers', done => {
      const value = { longitude: 'asd', latitude: 'asd' }
      assert.throws(() => {
        type.cast(BASE_FIELD, value)
      }, Error)
      assert.isFalse(type.test(BASE_FIELD, value))
      done()
    })
  })
})
