/* global describe, it, beforeEach */
import { _ } from 'underscore'
import { assert } from 'chai'
import ensure from '../src/ensure'

let SCHEMA
describe('Ensure', () => {
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

  it('ensure schema is object', (done) => {
    const schema = ''
    assert.throws(() => {
      ensure(schema)
    }, Array)
    done()
  })

  it('ensure schema has fields', (done) => {
    const schema = {}
    assert.throws(() => {
      ensure(schema)
    }, Array)
    done()
  })

  it('ensure schema has fields and fields are array', (done) => {
    const schema = { fields: ['1', '2'] }
    assert.throws(() => {
      ensure(schema)
    }, Array)
    done()
  })
})
