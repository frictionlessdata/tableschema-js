/* global describe, beforeEach, it, require */
var _ = require('underscore')
  , assert = require('chai').assert
  , SchemaModel = require('../lib/models')
  , SCHEMA

describe('Models', function () {
  beforeEach(function (done) {
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

  it('have a correct number of header columns', function (done) {
    assert.equal((new SchemaModel(SCHEMA)).headers().length, 5)
    done()
  })

  it('have a correct number of header required columns', function (done) {
    assert.equal((new SchemaModel(SCHEMA)).requiredHeaders().length, 2)
    done()
  })

  it('have one of a field from passed schema', function (done) {
    assert((new SchemaModel(SCHEMA)).hasField('name'))
    done()
  })

  it('do not have fields not specified in passed schema', function (done) {
    assert.notOk((new SchemaModel(SCHEMA)).hasField('religion'))
    done()
  })

  it('have correct number of fields of certain type', function (done) {
    var model = new SchemaModel(SCHEMA)

    assert.equal(model.getFieldsByType('string').length, 3)
    assert.equal(model.getFieldsByType('number').length, 1)
    assert.equal(model.getFieldsByType('integer').length, 1)
    done()
  })

  it('respect caseInsensitiveHeaders option', function (done) {
    SCHEMA.fields = SCHEMA.fields.map((field) => {
      var copyField = _.extend({}, field)
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

  it('raise exception when invalid json passed as schema', function (done) {
    try {
      var schema = new SchemaModel('this is string')
      assert.isObject(schema)
      assert.isTrue(false)
    } catch (e) {
      assert.isTrue(true)
    }
    done()
  })

  it('raise exception when invalid format schema passed', function (done) {
    try {
      var schema = new SchemaModel({})
      assert.isObject(schema)
      assert.isTrue(false)
    } catch (e) {
      assert.isTrue(true)
    }
    done()
  })
})
