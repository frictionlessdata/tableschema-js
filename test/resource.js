/* global describe, beforeEach, it */
import { assert } from 'chai'
import Resource from '../src/resource'
import Schema from '../src/schema'

let SCHEMA

describe('Resource', () => {
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

  it('unique constraints violation', done => {
    SCHEMA.fields[0].constraints.unique = true
    const data = [
      ['string', '10.0', '1', 'string', 'string']
      , ['string2', '10.0', '1', 'string', 'string']
      , ['string3', '10.0', '1', 'string', 'string']
      , ['string4', '10.0', '1', 'string', 'string']
      , ['string', '10.0', '1', 'string', 'string']
    ];
    (new Resource(SCHEMA, data)).then(resource => {
      assert.throws(() => {
        resource.iter()
      }, Array)
      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })
})
