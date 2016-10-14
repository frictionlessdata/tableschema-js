/* global describe, beforeEach, it */
import { assert } from 'chai'
import Schema from '../src/schema'

let SCHEMA

describe('Field', () => {
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
          name: 'Age'
          , type: 'integer'
          , constraints: { required: false }
        }
        , {
          name: 'Name'
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

  it('should get correct instance', done => {
    (new Schema(SCHEMA)).then(schema => {
      const Field = schema.getField('height')

      assert.equal(Field.name, 'height')
      assert.equal(Field.format, 'default')
      assert.equal(Field.type, 'number')
      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('should return true on test', done => {
    (new Schema(SCHEMA)).then(schema => {
      const Field = schema.getField('height')

      assert.isTrue(Field.testValue(1))
      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('should return false on test', done => {
    (new Schema(SCHEMA)).then(schema => {
      const Field = schema.getField('height')

      assert.isFalse(Field.testValue('string'))
      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('should cast value', done => {
    (new Schema(SCHEMA)).then(schema => {
      const Field = schema.getField('height')

      assert.equal(Field.castValue(1), 1)
      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('should fail to cast value', done => {
    (new Schema(SCHEMA)).then(schema => {
      const Field = schema.getField('height')
      assert.throws(() => {
        Field.castValue('string')
      }, Error)
      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })
})
