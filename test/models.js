/* global describe, beforeEach, it, require */
import { _ } from 'underscore'
import { assert } from 'chai'
import SchemaModel from '../src/models'

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
  beforeEach((done) => {
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

  it('have a correct number of header columns', (done) => {
    assert.equal((new SchemaModel(SCHEMA)).headers().length, 5)
    done()
  })

  it('have a correct number of header required columns', (done) => {
    assert.equal((new SchemaModel(SCHEMA)).requiredHeaders().length, 2)
    done()
  })

  it('have one of a field from passed schema', (done) => {
    const model = (new SchemaModel(SCHEMA))
    assert.isTrue(model.hasField('id'))
    assert.isTrue(model.hasField('height'))
    assert.isTrue(model.hasField('age'))
    assert.isTrue(model.hasField('name'))
    assert.isTrue(model.hasField('occupation'))
    done()
  })

  it('do not have fields not specified in passed schema', (done) => {
    assert.isFalse((new SchemaModel(SCHEMA)).hasField('religion'))
    done()
  })

  it('have correct number of fields of certain type', (done) => {
    const model = new SchemaModel(SCHEMA)
      , stringTypes = model.getFieldsByType('string')
      , numberTypes = model.getFieldsByType('number')
      , integerTypes = model.getFieldsByType('integer')

    assert.isArray(stringTypes)
    assert.equal(stringTypes.length, 3)
    assert.equal(_.findWhere(stringTypes, { name: 'id' }).type, 'string')
    assert.equal(_.findWhere(stringTypes, { name: 'name' }).type, 'string')
    assert.equal(_.findWhere(stringTypes, { name: 'occupation' }).type,
                 'string')

    assert.isArray(numberTypes)
    assert.equal(numberTypes.length, 1)
    assert.equal(_.findWhere(numberTypes, { name: 'height' }).type, 'number')

    assert.isArray(integerTypes)
    assert.equal(integerTypes.length, 1)
    assert.equal(_.findWhere(integerTypes, { name: 'age' }).type, 'integer')

    done()
  })

  it('respect caseInsensitiveHeaders option', (done) => {
    SCHEMA.fields = SCHEMA.fields.map((field) => {
      const copyField = _.extend({}, field)
      copyField.name = copyField.name[0].toUpperCase() +
                       _.rest(copyField.name).join('').toLowerCase()
      return copyField
    })

    const model = (new SchemaModel(SCHEMA, { caseInsensitiveHeaders: true }))
    assert.deepEqual(model.headers().sort(),
                     ['id', 'height', 'name', 'age', 'occupation'].sort())
    done()
  })

  it('raise exception when invalid json passed as schema', (done) => {
    try {
      const schema = new SchemaModel('this is string')
      assert.isObject(schema)
      assert.isTrue(false)
    } catch (e) {
      assert.isTrue(true)
    }
    done()
  })

  it('raise exception when invalid format schema passed', (done) => {
    try {
      const schema = new SchemaModel({})
      assert.isObject(schema)
      assert.isTrue(false)
    } catch (e) {
      assert.isTrue(true)
    }
    done()
  })

  it('set default types if not provided', (done) => {
    const model = new SchemaModel(SCHEMA_MIN)
      , stringTypes = model.getFieldsByType('string')

    assert.isArray(stringTypes)
    assert.equal(stringTypes.length, 2)
    assert.equal(_.findWhere(stringTypes, { name: 'id' }).type, 'string')
    assert.equal(_.findWhere(stringTypes, { name: 'height' }).type, 'string')

    done()
  })

  it('fields are not required by default', (done) => {
    const schema = {
      fields: [
        { name: 'id', constraints: { required: true } }
        , { name: 'label' }
      ]
    }
      , model = new SchemaModel(schema)

    assert.isArray(model.requiredHeaders())
    assert.equal(model.requiredHeaders().length, 1)

    done()
  })

  it('schema should not mutate', (done) => {
    const schema = { fields: [{ name: 'id' }] }
      , schemaCopy = _.extend({}, schema)
      , model = new SchemaModel(schema)

    assert.deepEqual(schema, schemaCopy)
    done()
  })

  it('convert row', (done) => {
    const model = new SchemaModel(SCHEMA)
      , convertedRow = model.convertRow('string', '10.0', '1', 'string',
                                        'string')
    assert.deepEqual(['string', '10.0', 1, 'string', 'string'], convertedRow)

    done()
  })

  it('shouldn\'t convert row with less items than headers count', (done) => {
    const model = new SchemaModel(SCHEMA)

    assert.throws(() => {
      model.convertRow('string', '10.0', '1', 'string')
    }, Error)
    done()
  })

  it('shouldn\'t convert row with too many items', (done) => {
    const model = new SchemaModel(SCHEMA)

    assert.throws(() => {
      model.convertRow('string', '10.0', '1', 'string', 'string', 'string')
    }, Error)
    done()
  })

  it('shouldn\'t convert row with wrong type (fail fast)', (done) => {
    const model = new SchemaModel(SCHEMA)

    assert.throws(() => {
      model.convertRow('string', 'notdecimal', '10.6',
                       'string', 'string', { failFast: true })
    }, Error)
    done()
  })

  it('shouldn\'t convert row with wrong type multiple errors', (done) => {
    const model = new SchemaModel(SCHEMA)

    try {
      model.convertRow('string', 'notdecimal', '10.6', 'string',
                       true)
    } catch (e) {
      assert.isArray(e)
      assert.equal(e.length, 3)
    }
    done()
  })

  it('convert multiple rows', (done) => {
    const model = new SchemaModel(SCHEMA)
      , rows = model.convert([['string', '10.0', '1', 'string', 'string']
                               , ['string', '10.0', '1', 'string', 'string']
                               , ['string', '10.0', '1', 'string', 'string']
                               , ['string', '10.0', '1', 'string', 'string']
                               , ['string', '10.0', '1', 'string', 'string']])
    for (const row of rows) {
      assert.deepEqual(['string', '10.0', 1, 'string', 'string'],
                       row)
    }
    done()
  })

  it('shouldn\'t convert rows with wrong types fail fast', (done) => {
    const model = new SchemaModel(SCHEMA)

    assert.throws(() => {
      model.convert([['string', 'not', '1', 'string', 'string']
                      , ['string', '10.0', '1', 'string', 'string']
                      , ['string', 'an', '1', 'string', 'string']
                      , ['string', '10.0', '1', 'string', 'string']
                      , ['string', '10.0', 'integer', 'string', 'string']],
                    true)
    }, Error)

    done()
  })

  it('shouldn\'t convert rows with wrong types multiple errors', (done) => {
    const model = new SchemaModel(SCHEMA)

    try {
      model.convert([['string', 'not', '1', 'string', 'string']
                      , ['string', '10.0', '1', 'string', 'string']
                      , ['string', 'an', '1', 'string', 'string']
                      , ['string', '10.0', '1', 'string', 'string']
                      , ['string', '10.0', 'integer', 'string', 'string']])
    } catch (e) {
      assert.isArray(e)
      assert.equal(e.length, 3)
    }

    done()
  })

  it('shouldn\'t convert rows with incorrect row length fail fast',
     (done) => {
       const model = new SchemaModel(SCHEMA)

       assert.throws(() => {
         model.convert([['string', '10.0', '1', 'string']
                         , ['string', '10.0', '1', 'string', 'string']
                         , ['string', '10.0', '1', 'string', 'string', 1]
                         , ['string', '10.0', '1', 'string', 'string']
                         , ['string', '10.0', '1', 'string', 'string']], true)
       }, Error)

       done()
     })

  it('shouldn\'t convert rows with incorrect row length multiple errors',
     (done) => {
       const model = new SchemaModel(SCHEMA)

       try {
         model.convert([['string', '10.0', '1', 'string']
                         , ['string', '10.0', '1', 'string', 'string']
                         , ['string', '10.0', '1', 'string', 'string', 1]
                         , ['string', '10.0', '1', 'string', 'string']
                         , ['string', '10.0', '1', 'string', 'string']])
       } catch (e) {
         assert.isArray(e)
         assert.equal(e.length, 2)
       }

       done()
     })
})
