/* global describe, beforeEach, it, require */
const _ = require('underscore')
  , assert = require('chai').assert
  , SchemaModel = require('../lib/models')

let SCHEMA

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
    assert((new SchemaModel(SCHEMA)).hasField('name'))
    done()
  })

  it('do not have fields not specified in passed schema', (done) => {
    assert.notOk((new SchemaModel(SCHEMA)).hasField('religion'))
    done()
  })

  it('have correct number of fields of certain type', (done) => {
    const model = new SchemaModel(SCHEMA)

    assert.equal(model.getFieldsByType('string').length, 3)
    assert.equal(model.getFieldsByType('number').length, 1)
    assert.equal(model.getFieldsByType('integer').length, 1)
    done()
  })

  it('respect caseInsensitiveHeaders option', (done) => {
    SCHEMA.fields = SCHEMA.fields.map((field) => {
      const copyField = _.extend({}, field)
      copyField.name = copyField.name[0].toUpperCase() +
                       _.rest(copyField.name).join('').toLowerCase()
      return copyField
    })

    assert.deepEqual(
      (new SchemaModel(SCHEMA, { caseInsensitiveHeaders: true })).headers()
        .sort(),
      ['id', 'height', 'name', 'age', 'occupation'].sort()
    )
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
})
