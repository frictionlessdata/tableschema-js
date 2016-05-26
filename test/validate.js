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
    }
    done()
  })

  it('ensure schema is object', (done) => {
    const schema = ''
    assert.throws(() => {
      validate(schema)
    }, Array)
    done()
  })

  it('ensure schema has fields', (done) => {
    const schema = {}
    assert.throws(() => {
      validate(schema)
    }, Array)
    done()
  })

  it('ensure schema has fields and fields are array', (done) => {
    const schema = { fields: ['1', '2'] }
    assert.throws(() => {
      validate(schema)
    }, Array)
    done()
  })

  it('ensure schema fields constraints must be an object', (done) => {
    const schema = {
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
      validate(schema)
    }, Array)
    done()
  })

  it('ensure constraints properties have correct type', (done) => {
    const schema = {
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
      validate(schema)
      assert(false)
    } catch (e) {
      assert.isArray(e)
      assert.equal(e.length, 11)
    }
    done()
  })

  it('ensure constraints properties with correct type is valid', (done) => {
    const schema = {
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

    validate(schema)
    assert(true)
    done()
  })
})
