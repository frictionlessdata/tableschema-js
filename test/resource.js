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

  it('convert row', done => {
    (new Schema(SCHEMA)).then(schema => {
      const resource = new Resource(schema)
        , convertedRow = resource.convertRow('string', '10.0', '1', 'string',
                                             'string')
      assert.deepEqual(['string', '10.0', 1, 'string', 'string'], convertedRow)
      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('shouldn\'t convert row with less items than headers count', done => {
    (new Schema(SCHEMA)).then(schema => {
      const resource = new Resource(schema)
      assert.throws(() => {
        resource.convertRow('string', '10.0', '1', 'string')
      }, Error)
      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('shouldn\'t convert row with too many items', done => {
    (new Schema(SCHEMA)).then(schema => {
      const resource = new Resource(schema)
      assert.throws(() => {
        resource.convertRow('string', '10.0', '1', 'string', 'string', 'string')
      }, Error)
      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('shouldn\'t convert row with wrong type (fail fast)', done => {
    (new Schema(SCHEMA)).then(schema => {
      const resource = new Resource(schema)
      assert.throws(() => {
        resource.convertRow('string', 'notdecimal', '10.6', 'string', 'string',
                            { failFast: true })
      }, Error)
      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('shouldn\'t convert row with wrong type multiple errors', done => {
    (new Schema(SCHEMA)).then(schema => {
      const resource = new Resource(schema)
      try {
        resource.convertRow('string', 'notdecimal', '10.6', 'string',
                            true)
      } catch (e) {
        assert.isArray(e)
        assert.equal(e.length, 3)
      }
      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('convert multiple rows', done => {
    (new Schema(SCHEMA)).then(schema => {
      const resource = new Resource(schema)
        , rows = resource.convert(
        [
          ['string', '10.0', '1', 'string', 'string']
          , ['string', '10.0', '1', 'string', 'string']
          , ['string', '10.0', '1', 'string', 'string']
          , ['string', '10.0', '1', 'string', 'string']
          , ['string', '10.0', '1', 'string', 'string']
        ])
      for (const row of rows) {
        assert.deepEqual(['string', '10.0', 1, 'string', 'string'], row)
      }
      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('shouldn\'t convert rows with wrong types fail fast', done => {
    (new Schema(SCHEMA)).then(schema => {
      const resource = new Resource(schema)
      assert.throws(() => {
        resource.convert(
          [
            ['string', 'not', '1', 'string', 'string']
            , ['string', '10.0', '1', 'string', 'string']
            , ['string', 'an', '1', 'string', 'string']
            , ['string', '10.0', '1', 'string', 'string']
            , ['string', '10.0', 'integer', 'string', 'string']
          ], true)
      }, Error)
      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('shouldn\'t convert rows with wrong types multiple errors', done => {
    (new Schema(SCHEMA)).then(schema => {
      const resource = new Resource(schema)
      try {
        resource.convert([['string', 'not', '1', 'string', 'string']
                           , ['string', '10.0', '1', 'string', 'string']
                           , ['string', 'an', '1', 'string', 'string']
                           , ['string', '10.0', '1', 'string', 'string']
                           , ['string', '10.0', 'integer', 'string', 'string']])
      } catch (e) {
        assert.isArray(e)
        assert.equal(e.length, 3)
      }
      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('shouldn\'t convert rows with incorrect row length fail fast', done => {
    (new Schema(SCHEMA)).then(schema => {
      const resource = new Resource(schema)
      assert.throws(() => {
        resource.convert(
          [
            ['string', '10.0', '1', 'string']
            , ['string', '10.0', '1', 'string', 'string']
            , ['string', '10.0', '1', 'string', 'string', 1]
            , ['string', '10.0', '1', 'string', 'string']
            , ['string', '10.0', '1', 'string', 'string']
          ], true)
      }, Error)
      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('shouldn\'t convert rows with incorrect row length multiple errors',
     done => {
       (new Schema(SCHEMA)).then(schema => {
         const resource = new Resource(schema)
         try {
           resource.convert(
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
       }, error => {
         assert.isNull(error)
         done()
       })
     })
})
