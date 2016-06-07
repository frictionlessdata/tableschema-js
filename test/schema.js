/* global describe, beforeEach, it */
import _ from 'lodash'
import fetchMock from 'fetch-mock'
import { assert } from 'chai'
import Schema from '../src/schema'

let SCHEMA
const SCHEMA_MIN = {
  fields: [
    {
      name: 'id'
    }
    , {
      name: 'height'
    }
  ]
}

describe('Models', () => {
  beforeEach(done => {
    SCHEMA = {
      fields: [
        {
          name: 'id'
          , type: 'string'
          , constraints: { required: true }
        }
        , {
          name: 'height'
          , type: 'number'
          , constraints: { required: false }
        }
        , {
          name: 'age'
          , type: 'integer'
          , constraints: { required: false }
        }
        , {
          name: 'name'
          , type: 'string'
          , constraints: { required: true }
        }
        , {
          name: 'occupation'
          , type: 'string'
          , constraints: { required: false }
        }
      ]
    }
    done()
  })

  it('have a correct number of header columns', done => {
    (new Schema(SCHEMA)).then(schema => {
      assert.equal(schema.headers().length, 5)
      done()
    }, (error) => {
      assert(error)
    })
  })

  it('have a correct number of header required columns', done => {
    (new Schema(SCHEMA)).then(schema => {
      assert.equal(schema.requiredHeaders().length, 2)
      done()
    }, (error) => {
      assert(error)
    })
  })

  it('have one of a field from passed schema', done => {
    (new Schema(SCHEMA)).then(schema => {
      assert.isTrue(schema.hasField('id'))
      assert.isTrue(schema.hasField('height'))
      assert.isTrue(schema.hasField('age'))
      assert.isTrue(schema.hasField('name'))
      assert.isTrue(schema.hasField('occupation'))
      done()
    }, (error) => {
      assert(error)
    })
  })

  it('do not have fields not specified in passed schema', done => {
    (new Schema(SCHEMA)).then(schema => {
      assert.isFalse(schema.hasField('religion'))
      done()
    }, (error) => {
      assert(error)
    })
  })

  it('have correct number of fields of certain type', done => {
    (new Schema(SCHEMA)).then(schema => {
      const stringTypes = schema.getFieldsByType('string')
        , numberTypes = schema.getFieldsByType('number')
        , integerTypes = schema.getFieldsByType('integer')

      assert.isArray(stringTypes)
      assert.equal(stringTypes.length, 3)
      assert.equal(_.find(stringTypes, { name: 'id' }).type, 'string')
      assert.equal(_.find(stringTypes, { name: 'name' }).type, 'string')
      assert.equal(_.find(stringTypes, { name: 'occupation' }).type, 'string')

      assert.isArray(numberTypes)
      assert.equal(numberTypes.length, 1)
      assert.equal(_.find(numberTypes, { name: 'height' }).type, 'number')

      assert.isArray(integerTypes)
      assert.equal(integerTypes.length, 1)
      assert.equal(_.find(integerTypes, { name: 'age' }).type, 'integer')

      done()
    }, error => {
      assert(error)
    })
  })

  it('respect caseInsensitiveHeaders option', done => {
    SCHEMA.fields = SCHEMA.fields.map((field) => {
      const copyField = _.extend({}, field)
      copyField.name = copyField.name[0].toUpperCase() +
                       _.drop(copyField.name).join('').toLowerCase()
      return copyField
    })

    const model = (new Schema(SCHEMA, { caseInsensitiveHeaders: true }))
    model.then(schema => {
      assert.deepEqual(schema.headers().sort(),
                       ['id', 'height', 'name', 'age', 'occupation'].sort())
      done()
    }, (error) => {
      assert(error)
    })
  })

  it('raise exception when invalid json passed as schema', done => {
    (new Schema('this is string')).then(schema => {
      assert.isObject(schema)
      assert.isTrue(false)
    }, (error) => {
      assert.isArray(error)
      done()
    })
  })

  it('raise exception when invalid format schema passed', done => {
    (new Schema({})).then(schema => {
      assert.isObject(schema)
      assert.isTrue(false)
    }, (error) => {
      assert.isArray(error)
      done()
    })
  })

  it('set default types if not provided', done => {
    (new Schema(SCHEMA_MIN)).then(schema => {
      const stringTypes = schema.getFieldsByType('string')
      assert.isArray(stringTypes)
      assert.equal(stringTypes.length, 2)
      assert.equal(_.find(stringTypes, { name: 'id' }).type, 'string')
      assert.equal(_.find(stringTypes, { name: 'height' }).type, 'string')
      done()
    }, (error) => {
      assert.isNull(error)
      done()
    })
  })

  it('fields are not required by default', done => {
    const data = {
      fields: [
        { name: 'id', constraints: { required: true } }
        , { name: 'label' }
      ]
    }
      , model = new Schema(data)

    model.then(schema => {
      assert.isArray(schema.requiredHeaders())
      assert.equal(schema.requiredHeaders().length, 1)
      done()
    }, (error) => {
      assert.isNull(error)
      done()
    })
  })

  it('schema should not mutate', done => {
    const data = { fields: [{ name: 'id' }] }
      , schemaCopy = _.extend({}, data)
      , model = new Schema(data)

    model.then(schema => {
      assert.deepEqual(data, schemaCopy)
      done()
    }, (error) => {
      assert.isNull(error)
      done()
    })
  })

  it('should return true on test', done => {
    const model = new Schema(SCHEMA)
    model.then(schema => {
      assert.isTrue(schema.test('age', 1))
      done()
    }, (error) => {
      assert.isNull(error)
      done()
    })
  })

  it('should throw exception if field name does not exists', done => {
    const model = new Schema(SCHEMA)
    model.then(schema => {
      assert.throws(() => {
        schema.getField('unknown')
      }, Error)
      done()
    }, (error) => {
      assert.isNull(error)
      done()
    })
  })

  it('convert row', done => {
    (new Schema(SCHEMA)).then(schema => {
      const convertedRow = schema.convertRow('string', '10.0', '1', 'string',
                                             'string')
      assert.deepEqual(['string', '10.0', 1, 'string', 'string'], convertedRow)
      done()
    }, (error) => {
      assert.isNull(error)
      done()
    })
  })

  it('shouldn\'t convert row with less items than headers count', done => {
    (new Schema(SCHEMA)).then(schema => {
      assert.throws(() => {
        schema.convertRow('string', '10.0', '1', 'string')
      }, Error)
      done()
    }, (error) => {
      assert.isNull(error)
      done()
    })
  })

  it('shouldn\'t convert row with too many items', done => {
    (new Schema(SCHEMA)).then(schema => {
      assert.throws(() => {
        schema.convertRow('string', '10.0', '1', 'string', 'string', 'string')
      }, Error)
      done()
    }, (error) => {
      assert.isNull(error)
      done()
    })
  })

  it('shouldn\'t convert row with wrong type (fail fast)', done => {
    (new Schema(SCHEMA)).then(schema => {
      assert.throws(() => {
        schema.convertRow('string', 'notdecimal', '10.6', 'string', 'string',
                          { failFast: true })
      }, Error)
      done()
    }, (error) => {
      assert.isNull(error)
      done()
    })
  })

  it('shouldn\'t convert row with wrong type multiple errors', done => {
    (new Schema(SCHEMA)).then(schema => {
      try {
        schema.convertRow('string', 'notdecimal', '10.6', 'string',
                          true)
      } catch (e) {
        assert.isArray(e)
        assert.equal(e.length, 3)
      }
      done()
    }, (error) => {
      assert.isNull(error)
      done()
    })
  })

  it('convert multiple rows', done => {
    (new Schema(SCHEMA)).then(schema => {
      const rows = schema.convert(
        [
          ['string', '10.0', '1', 'string', 'string']
          , ['string', '10.0', '1', 'string', 'string']
          , ['string', '10.0', '1', 'string', 'string']
          , ['string', '10.0', '1', 'string', 'string']
          , ['string', '10.0', '1', 'string', 'string']
        ])
      for (const row of rows) {
        assert.deepEqual(['string', '10.0', 1, 'string', 'string'],
                         row)
      }
      done()
    }, (error) => {
      assert.isNull(error)
      done()
    })
  })

  it('shouldn\'t convert rows with wrong types fail fast', done => {
    (new Schema(SCHEMA)).then(schema => {
      assert.throws(() => {
        schema.convert(
          [
            ['string', 'not', '1', 'string', 'string']
            , ['string', '10.0', '1', 'string', 'string']
            , ['string', 'an', '1', 'string', 'string']
            , ['string', '10.0', '1', 'string', 'string']
            , ['string', '10.0', 'integer', 'string', 'string']
          ], true)
      }, Error)
      done()
    }, (error) => {
      assert.isNull(error)
      done()
    })
  })

  it('shouldn\'t convert rows with wrong types multiple errors', done => {
    (new Schema(SCHEMA)).then(schema => {
      try {
        schema.convert([['string', 'not', '1', 'string', 'string']
                         , ['string', '10.0', '1', 'string', 'string']
                         , ['string', 'an', '1', 'string', 'string']
                         , ['string', '10.0', '1', 'string', 'string']
                         , ['string', '10.0', 'integer', 'string', 'string']])
      } catch (e) {
        assert.isArray(e)
        assert.equal(e.length, 3)
      }
      done()
    }, (error) => {
      assert.isNull(error)
      done()
    })
  })

  it('shouldn\'t convert rows with incorrect row length fail fast', done => {
    (new Schema(SCHEMA)).then(schema => {
      assert.throws(() => {
        schema.convert(
          [
            ['string', '10.0', '1', 'string']
            , ['string', '10.0', '1', 'string', 'string']
            , ['string', '10.0', '1', 'string', 'string', 1]
            , ['string', '10.0', '1', 'string', 'string']
            , ['string', '10.0', '1', 'string', 'string']
          ], true)
      }, Error)
      done()
    }, (error) => {
      assert.isNull(error)
      done()
    })
  })

  it('shouldn\'t convert rows with incorrect row length multiple errors',
     done => {
       (new Schema(SCHEMA)).then(schema => {
         try {
           schema.convert(
             [['string', '10.0', '1', 'string']
               , ['string', '10.0', '1', 'string', 'string']
               , ['string', '10.0', '1', 'string', 'string', 1]
               , ['string', '10.0', '1', 'string', 'string']
               , ['string', '10.0', '1', 'string', 'string']])
         } catch (e) {
           assert.isArray(e)
           assert.equal(e.length, 2)
         }
         done()
       }, (error) => {
         assert.isNull(error)
         done()
       })
     })

  it('should load json file', done => {
    const url = 'http://localhost/remote.json'
    fetchMock.restore()
    fetchMock.mock(url, SCHEMA)

    const model = new Schema(url)
    model.then((schema) => {
      assert.equal(schema.headers().length, 5)
      assert.equal(schema.requiredHeaders().length, 2)
      assert.isTrue(schema.hasField('id'))
      assert.isTrue(schema.hasField('height'))
      assert.isTrue(schema.hasField('age'))
      assert.isTrue(schema.hasField('name'))
      assert.isTrue(schema.hasField('occupation'))
      done()
    }, (error) => {
      assert.isNull(error)
      done()
    })
  })

  it('should fail on load of json file', done => {
    const url = 'http://localhost/remote.json'
    fetchMock.restore()
    fetchMock.mock(url, 400)

    const model = new Schema(url)
    model.then(schema => {
      assert.isTrue(false, 'Shouldn\'t enter here')
      done()
    }).catch(error => {
      assert.isNotNull(error)
      done()
    })
  })
})
