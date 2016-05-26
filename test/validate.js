/* global describe, it, beforeEach */
import { _ } from 'underscore'
import { assert } from 'chai'
import validate from '../src/validate'

let SCHEMA
describe('Validate', () => {
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
        }
        , {
          name: 'age'
          , type: 'integer'
        }
        , {
          name: 'name'
          , type: 'string'
          , constraints: { required: true }
        }
        , {
          name: 'occupation'
          , type: 'string'
        }
      ]
      , primaryKey: 'id'
    }
    done()
  })

  it('ensure schema is object', (done) => {
    SCHEMA = ''
    assert.throws(() => {
      validate(SCHEMA)
    }, Array)
    done()
  })

  it('ensure schema has fields', (done) => {
    SCHEMA = {}
    assert.throws(() => {
      validate(SCHEMA)
    }, Array)
    done()
  })

  it('ensure schema has fields and fields are array', (done) => {
    SCHEMA = { fields: ['1', '2'] }
    assert.throws(() => {
      validate(SCHEMA)
    }, Array)
    done()
  })

  it('ensure schema fields constraints must be an object', (done) => {
    SCHEMA = {
      fields: [{
        name: 'id'
        , type: 'string'
        , constraints: 'string'
      }
        , {
          name: 'height'
          , type: 'number'
        }]
    }

    assert.throws(() => {
      validate(SCHEMA)
    }, Array)
    done()
  })

  it('ensure constraints properties have correct type', (done) => {
    SCHEMA = {
      fields: [{
        name: 'id'
        , type: 'string'
        , constraints: {
          required: 'string'
          , unique: 'string'
          , pattern: 1
          , minimum: 10
          , maximum: 20
        }
      }
        , {
          name: 'age'
          , type: 'integer'
          , constraints: {
            required: 'string'
            , unique: 'string'
            , minLength: true
            , maxLength: true
            , minimum: 'string'
            , maximum: 'string'
          }
        }]
    }

    try {
      validate(SCHEMA)
      assert(false)
    } catch (e) {
      assert.isArray(e)
      assert.equal(e.length, 11)
    }
    done()
  })

  it('ensure constraints properties with correct type is valid', (done) => {
    SCHEMA = {
      fields: [{
        name: 'id'
        , type: 'string'
        , constraints: {
          required: true
          , pattern: '/.*/'
          , unique: true
          , minLength: 1
          , maxLength: 2
        }
      }
        , {
          name: 'age'
          , type: 'integer'
          , constraints: {
            required: true
            , unique: true
            , minLength: 1
            , maxLength: 2
            , minimum: 10
            , maximum: 20
          }
        }]
    }

    validate(SCHEMA)
    assert(true)
    done()
  })

  it('ensure primary key match field names', (done) => {
    SCHEMA.primaryKey = 'id'
    validate(SCHEMA)
    assert(true)
    done()
  })

  it('throw exception if primary key not match field names', (done) => {
    SCHEMA.primaryKey = 'unknown'
    assert.throws(() => {
      validate(SCHEMA)
    }, Array)
    done()
  })

  it('ensure primary key as array match field names', (done) => {
    SCHEMA.primaryKey = ['id', 'name']
    validate(SCHEMA)
    assert(true)
    done()
  })

  it('throw exception if primary key as array not match field names',
     (done) => {
       SCHEMA.primaryKey = ['id', 'unknown']
       assert.throws(() => {
         validate(SCHEMA)
       }, Array)
       done()
     })

  it('throw exception if primary key has not correct type', (done) => {
    SCHEMA.primaryKey = { name: 'id' }
    assert.throws(() => {
      validate(SCHEMA)
    }, Array)
    done()
  })

  it('ensure foreign keys is an array', (done) => {
    SCHEMA.foreignKeys = 'keys'
    assert.throws(() => {
      validate(SCHEMA)
    }, Array)
    done()
  })

  it('ensure every foreign key has fields', (done) => {
    SCHEMA.foreignKeys = ['key1', 'key2']
    assert.throws(() => {
      validate(SCHEMA)
    }, Array)
    done()
  })

  it('ensure fields in keys a string or an array', (done) => {
    SCHEMA.foreignKeys = [{ fields: { name: 'id' } }]
    assert.throws(() => {
      validate(SCHEMA)
    }, Array)

    SCHEMA.foreignKeys = [
      {
        fields: 'id'
        , reference: { fields: 'id', resource: 'resource' }
      }
      , {
        fields: ['id', 'name']
        , reference: { fields: ['id', 'name'], resource: 'resource' }
      }
    ]
    validate(SCHEMA)
    assert.isTrue(true)
    done()
  })
})
