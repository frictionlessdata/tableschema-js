/* global describe, beforeEach, it, require */
import { assert } from 'chai'
import types from '../src/types'
import d3time from 'd3-time-format'

let BASE_FIELD
// FIXME fix test to check return value after casting and not just assert
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
      assert.equal(newType(BASE_FIELD).cast('string'), 'string')
      assert.isTrue(newType(BASE_FIELD).test('string'))
      done()
    })

    it('cast empty string if no constraints', (done) => {
      BASE_FIELD.constraints.required = false
      assert.equal(newType(BASE_FIELD).cast(''), '')
      assert.isTrue(newType(BASE_FIELD).test(''))
      done()
    })

    it('don\'t cast digits', (done) => {
      assert.throws(() => {
        newType(BASE_FIELD).cast(1)
      }, Error)
      assert.isFalse(newType(BASE_FIELD).test(1))
      done()
    })

    it('don\'t cast empty string by default', (done) => {
      assert.throws(() => {
        newType(BASE_FIELD).cast('')
      }, Error)
      assert.isFalse(newType(BASE_FIELD).test(''))
      done()
    })

    it('cast email', (done) => {
      BASE_FIELD.format = 'email'
      assert.equal(newType(BASE_FIELD).cast('example@example.com'),
                   'example@example.com')
      assert.isTrue(newType(BASE_FIELD).test('example@example.com'))
      done()
    })

    it('don\'t cast email with wrong email format', (done) => {
      BASE_FIELD.format = 'email'
      assert.throws(() => {
        newType(BASE_FIELD).cast('example.com')
      }, Error)
      assert.isFalse(newType(BASE_FIELD).test('example.com'))
      done()
    })

    it('don\'t cast email with non-string value', (done) => {
      BASE_FIELD.format = 'email'
      assert.throws(() => {
        newType(BASE_FIELD).cast(1)
      }, Error)
      assert.isFalse(newType(BASE_FIELD).test(1))
      done()
    })

    it('cast uri', (done) => {
      BASE_FIELD.format = 'uri'
      assert.equal(newType(BASE_FIELD).cast('http://www.example.com/'),
                   'http://www.example.com/')
      assert.isTrue(newType(BASE_FIELD).test('http://www.example.com/'))
      done()
    })

    it('don\'t cast uri with wrong uri format', (done) => {
      BASE_FIELD.format = 'uri'
      assert.throws(() => {
        newType(BASE_FIELD).cast('http//www.example.com/')
      }, Error)
      assert.isFalse(newType(BASE_FIELD).test('http//www.example.com/'))
      done()
    })

    it('don\'t cast uri with non-string value', (done) => {
      BASE_FIELD.format = 'uri'
      assert.throws(() => {
        newType(BASE_FIELD).cast(1)
      }, Error)
      assert.isFalse(newType(BASE_FIELD).test(1))
      done()
    })

    it('cast binary', (done) => {
      BASE_FIELD.format = 'binary'

      const value = Buffer.from('test').toString('base64')

      assert.equal(newType(BASE_FIELD).cast(value), 'test')
      assert.isTrue(newType(BASE_FIELD).test(value))
      done()
    })

    it('don\'t cast binary with non-string value', (done) => {
      BASE_FIELD.format = 'binary'
      assert.throws(() => {
        newType(BASE_FIELD).cast(1)
      }, Error)
      assert.isFalse(newType(BASE_FIELD).test(1))
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
      assert.isTrue(newType(BASE_FIELD).test(1))
      done()
    })

    it('cast string "0"', (done) => {
      assert.equal(newType(BASE_FIELD).cast('0'), 0)
      assert.isTrue(newType(BASE_FIELD).test('0'))
      done()
    })

    it('don\'t cast string "1.00"', (done) => {
      assert.throws(() => {
        newType(BASE_FIELD).cast('1.00')
      }, Error)
      assert.isFalse(newType(BASE_FIELD).test('1.00'))
      done()
    })

    it('don\'t cast float', (done) => {
      assert.throws(() => {
        newType(BASE_FIELD).cast(1.01)
      }, Error)
      assert.isFalse(newType(BASE_FIELD).test(1.01))
      done()
    })

    it('don\'t cast string', (done) => {
      assert.throws(() => {
        newType(BASE_FIELD).cast('string')
      }, Error)
      assert.isFalse(newType(BASE_FIELD).test('string'))
      done()
    })
  })

  describe('NumberType', () => {
    const newType = base => new types.NumberType(base)

    beforeEach((done) => {
      BASE_FIELD.type = 'number'
      done()
    })

    it('cast float', (done) => {
      assert.equal(newType(BASE_FIELD).cast(1.1), 1.1)
      assert.equal(newType(BASE_FIELD).cast('1.00'), '1.00')
      assert.isTrue(newType(BASE_FIELD).test(1.1))
      assert.isTrue(newType(BASE_FIELD).test('1.00'))
      // BUT following will make the problem
      assert.throws(() => {
        newType(BASE_FIELD).cast(1.00)
      }, Error)
      assert.isFalse(newType(BASE_FIELD).test(1.00))
      // Possible solution
      assert.equal(newType(BASE_FIELD).cast(Number(1.00).toFixed(2)), '1.00')
      assert.isTrue(newType(BASE_FIELD).test(Number(1.00).toFixed(2)))
      done()
    })

    it('cast localized numbers', (done) => {
      ['10,000.00', '10,000,000.00', '100.23'].forEach(function (value) {
        assert.doesNotThrow(() => {
          newType(BASE_FIELD).cast(value)
        }, Error)
        assert.isTrue(newType(BASE_FIELD).test(value))
      })
      BASE_FIELD.decimalChar = '#';
      ['10,000#00', '10,000,000#00', '100#23'].forEach(function (value) {
        assert.doesNotThrow(() => {
          newType(BASE_FIELD).cast(value)
        }, Error)
        assert.isTrue(newType(BASE_FIELD).test(value))
      })
      BASE_FIELD.groupChar = 'Q';
      ['10Q000#00', '10Q000Q000#00', '100#23'].forEach(function (value) {
        assert.doesNotThrow(() => {
          newType(BASE_FIELD).cast(value)
        }, Error)
        assert.isTrue(newType(BASE_FIELD).test(value))
      })
      done()
    })

    it('don\'t cast string "0"', (done) => {
      assert.throws(() => {
        newType(BASE_FIELD).cast('0')
      }, Error)
      assert.isFalse(newType(BASE_FIELD).test('0'))
      done()
    })

    it('don\'t cast string', (done) => {
      assert.throws(() => {
        newType(BASE_FIELD).cast('string')
      }, Error)
      assert.isFalse(newType(BASE_FIELD).test('string'))
      done()
    })

    it('cast currency', (done) => {
      BASE_FIELD.format = 'currency';

      ['10,000.00', '$10000.00'].forEach((value) => {
        assert.doesNotThrow(() => {
          newType(BASE_FIELD).cast(value)
        }, Error)
        assert.isTrue(newType(BASE_FIELD).test(value))
      })

      BASE_FIELD.groupChar = ' '
      BASE_FIELD.decimalChar = ',';
      ['10 000 000,00', '10000,00', '10,000 €'].forEach(function (value) {
        assert.doesNotThrow(() => {
          newType(BASE_FIELD).cast(value)
        }, Error)
        assert.isTrue(newType(BASE_FIELD).test(value))
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
        assert.throws(() => {
          newType(BASE_FIELD).cast(value)
        }, Error)
        assert.isFalse(newType(BASE_FIELD).test(value))
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
      assert.isObject(newType(BASE_FIELD).cast('2019-01-01'))
      assert.isTrue(newType(BASE_FIELD).test('2019-01-01'))
      done()
    })

    it('cast any date', (done) => {
      BASE_FIELD.format = 'any'
      assert.isObject(newType(BASE_FIELD).cast('10 Jan 1969'))
      assert.isTrue(newType(BASE_FIELD).test('10 Jan 1969'))
      done()
    })

    it('cast date with format specified', (done) => {
      BASE_FIELD.format = 'fmt:%d/%m/%Y'

      const value = '10/06/2014'
        , result = d3time.timeParse('%d/%m/%Y')(value)

      assert.deepEqual(newType(BASE_FIELD).cast(value), result)
      assert.isTrue(newType(BASE_FIELD).test(value))
      done()
    })

    it('don\'t cast wrong simple date', (done) => {
      assert.throws(() => {
        newType(BASE_FIELD).cast('01-01-2019')
      }, Error)
      assert.isFalse(newType(BASE_FIELD).test('01-01-2019'))
      done()
    })

    it('don\'t cast wrong date string', (done) => {
      const value = '10th Jan nineteen sixty nine'

      assert.throws(() => {
        newType(BASE_FIELD).cast(value)
      }, Error)
      assert.isFalse(newType(BASE_FIELD).test(value))
      done()
    })

    it('don\'t cast date if it do not correspond specified format',
       (done) => {
         BASE_FIELD.format = 'fmt:%d/%m/%Y'
         const value = '2014/12/19'

         assert.throws(() => {
           newType(BASE_FIELD).cast(value)
         }, Error)
         assert.isFalse(newType(BASE_FIELD).test(value))
         done()
       })
  })

  describe('TimeType', () => {
    const newType = base => new types.TimeType(base)

    beforeEach((done) => {
      BASE_FIELD.format = 'default'
      BASE_FIELD.type = 'time'
      done()
    })

    it('cast simple time', (done) => {
      assert.isObject(newType(BASE_FIELD).cast('06:00:00'))
      assert.isTrue(newType(BASE_FIELD).test('06:00:00'))
      done()
    })

    it('don\'t cast wrong simple time', (done) => {
      assert.throws(() => {
        newType(BASE_FIELD).cast('3 am')
      }, Error)
      assert.isFalse(newType(BASE_FIELD).test('3 am'))
      done()
    })
  })

  describe('DateTimeType', () => {
    const newType = base => new types.DateTimeType(base)
    beforeEach((done) => {
      BASE_FIELD.format = 'default'
      BASE_FIELD.type = 'datetime'
      done()
    })

    it('cast simple datetime', (done) => {
      assert.isObject(newType(BASE_FIELD).cast('2014-01-01T06:00:00Z'))
      assert.isTrue(newType(BASE_FIELD).test('2014-01-01T06:00:00Z'))
      done()
    })

    it('cast any datetime', (done) => {
      BASE_FIELD.format = 'any'
      assert.isObject(newType(BASE_FIELD).cast('10 Jan 1969 9:00'))
      assert.isTrue(newType(BASE_FIELD).test('10 Jan 1969 9:00'))
      done()
    })

    it('don\'t cast wrong simple date', (done) => {
      const value = '10 Jan 1969 9'
      assert.throws(() => {
        newType(BASE_FIELD).cast(value)
      }, Error)
      assert.isFalse(newType(BASE_FIELD).test(value))
      done()
    })
  })

  describe('BooleanType', () => {
    const newType = base => new types.BooleanType(base)

    beforeEach((done) => {
      BASE_FIELD.type = 'boolean'
      done()
    })

    it('cast boolean', (done) => {
      assert.equal(newType(BASE_FIELD).cast(true), true)
      assert.isTrue(newType(BASE_FIELD).test(true))
      done()
    })

    it('cast simple string as True boolean', (done) => {
      assert.equal(newType(BASE_FIELD).cast('y'), true)
      assert.isTrue(newType(BASE_FIELD).test('y'))
      done()
    })

    it('cast simple string as False boolean', (done) => {
      assert.equal(newType(BASE_FIELD).cast('n'), false)
      assert.isTrue(newType(BASE_FIELD).test('n'))
      done()
    })
  })

  describe('ArrayType', () => {
    const newType = base => new types.ArrayType(base)

    beforeEach((done) => {
      BASE_FIELD.type = 'array'
      done()
    })

    it('cast array', (done) => {
      assert.deepEqual(newType(BASE_FIELD).cast([1, 2]), [1, 2])
      assert.isTrue(newType(BASE_FIELD).test([1, 2]))
      done()
    })

    it('don\'t cast random string as array', (done) => {
      assert.throws(() => {
        newType(BASE_FIELD).cast('string, string')
      }, Error)
      assert.isFalse(newType(BASE_FIELD).test('string, string'))
      done()
    })
  })

  describe('ObjectType', () => {
    const newType = base => new types.ObjectType(base)

    beforeEach((done) => {
      BASE_FIELD.type = 'object'
      done()
    })

    it('cast object', (done) => {
      assert.deepEqual(newType(BASE_FIELD).cast({ key: 'value' }),
                       { key: 'value' })
      assert.isTrue(newType(BASE_FIELD).test({ key: 'value' }))
      done()
    })

    it('don\'t cast random array as object', (done) => {
      assert.throws(() => {
        newType(BASE_FIELD).cast(['boo', 'ya'])
      }, Error)
      assert.isFalse(newType(BASE_FIELD).test(['boo', 'ya']))
      done()
    })
  })

  // TODO rewrite completely Geo types
  describe('GeoPointType', () => {
    const newType = base => new types.GeoPointType(base)

    beforeEach((done) => {
      BASE_FIELD.type = 'geopoint'
      done()
    })

    it('cast geo point from string', (done) => {
      assert.deepEqual(newType(BASE_FIELD).cast('10.0, 21.00'),
                       ['10.0', '21.00'])
      assert.isTrue(newType(BASE_FIELD).test('10.0, 21.00'))
      done()
    })

    it('don\'t cast random string as Geopoint', (done) => {
      const value = 'this is not a geopoint'
      assert.throws(() => {
        newType(BASE_FIELD).cast(value)
      }, Error)
      assert.isFalse(newType(BASE_FIELD).test(value))
      done()
    })

    it('cast geo point from array', (done) => {
      const value = ['10.0', '21.00']
      assert.deepEqual(newType(BASE_FIELD).cast(value), value)
      assert.isTrue(newType(BASE_FIELD).test(value))
      done()
    })

    it('don\'t cast geo point from strings array', (done) => {
      const value = ['ddd', 'ddd']
      assert.throws(() => {
        newType(BASE_FIELD).cast(value)
      }, Error)
      assert.isFalse(newType(BASE_FIELD).test(value))
      done()
    })

    it('don\'t cast array with incorrect length of values', (done) => {
      const value = ['10.0']
      assert.throws(() => {
        newType(BASE_FIELD).cast(value)
      }, Error)
      assert.isFalse(newType(BASE_FIELD).test(value))
      done()
    })
  })

  //describe('GeoJSONType', () => {
  //  const newType = base => new types.GeoPointType(base)
  //  beforeEach((done) => {
  //    BASE_FIELD.type = 'geojson'
  //    done()
  //  })
  //
  //  it('cast geo json', (done) => {
  //    assert((new types.GeoJSONType(BASE_FIELD)).cast({ type: 'Point' }))
  //    done()
  //  })
  //
  //  it('don\'t cast random string as GeoJSON', (done) => {
  //    assert.notOk((new types.GeoJSONType(BASE_FIELD)).cast(''))
  //    done()
  //  })
  //})
})
