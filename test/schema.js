const lodash = require('lodash')
const fetchMock = require('fetch-mock')
const {assert} = require('chai')
const {Schema} = require('../src')
const {catchError} = require('./helpers')


// Tests

let SCHEMA
const SCHEMA_MIN = {
  fields: [
    {name: 'id'},
    {name: 'height'},
  ]
}

describe('Schema', () => {

  beforeEach(done => {
    SCHEMA = {
      fields: [
        {name: 'id', type: 'string', constraints: {required: true}},
        {name: 'height', type: 'number'},
        {name: 'age', type: 'integer'},
        {name: 'name', type: 'string', constraints: {required: true}},
        {name: 'occupation', type: 'string'},
      ]
    }
    done()
  })

  it('have a correct number of header columns', done => {
    (Schema.load(SCHEMA)).then(schema => {
      assert.equal(schema.fieldNames.length, 5)
      done()
    }, error => {
      assert(error)
    })
  })

  it.skip('have a correct number of header required columns', done => {
    (Schema.load(SCHEMA, true)).then(schema => {
      const headers = schema.requiredHeaders
      assert.equal(headers.length, 2)
      assert.equal(headers[0], 'id')
      assert.equal(headers[1], 'name')
      done()
    }, error => {
      assert(error)
    })
  })

  it('have one of a field from passed schema', done => {
    (Schema.load(SCHEMA, true)).then(schema => {
      assert.isTrue(schema.fieldNames.includes('id'))
      assert.isTrue(schema.fieldNames.includes('height'))
      assert.isTrue(schema.fieldNames.includes('age'))
      assert.isTrue(schema.fieldNames.includes('name'))
      assert.isTrue(schema.fieldNames.includes('occupation'))
      done()
    }, error => {
      assert(error)
    })
  })

  it('do not have fields not specified in passed schema', done => {
    (Schema.load(SCHEMA)).then(schema => {
      assert.isFalse(schema.fieldNames.includes('religion'))
      done()
    }, error => {
      assert(error)
    })
  })

  it.skip('respect caseInsensitiveHeaders option', done => {
    (Schema.load(SCHEMA, {caseInsensitiveHeaders: true})).then(schema => {
      assert.isTrue(schema.fieldNames.includes('NAME'))
      done()
    }, error => {
      assert(error)
    })
  })

  it('raise exception when invalid json passed as schema', async () => {
    const error = await catchError(Schema.load, 'bad descriptor')
    if (process.env.USER_ENV === 'browser') {
      assert.include(error.message, 'in browser')
    } else {
      assert.include(error.message, 'load descriptor')
    }
  })

  it('raise exception when invalid format schema passed', done => {
    (Schema.load({})).then(schema => {
      assert.isObject(schema)
      assert.isTrue(false)
    }, error => {
      assert.isArray(error)
      done()
    })
  })

  it('set default types if not provided', done => {
    (Schema.load(SCHEMA_MIN)).then(schema => {
      const fields = lodash.filter(schema.fields, F => F.type === 'string')
      assert.isArray(fields)
      assert.equal(fields.length, 2)
      fields.forEach(F => {
        assert.equal(F.type, 'string')
      })
      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it.skip('fields are not required by default', done => {
    const data = {
      fields: [
        { name: 'id', constraints: { required: true } },
        { name: 'label' }
      ]
    }
    const model = Schema.load(data)

    model.then(schema => {
      const requiredHeaders = schema.requiredHeaders

      assert.isArray(requiredHeaders)
      assert.equal(requiredHeaders.length, 1)
      assert.equal(requiredHeaders[0], 'id')

      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('schema should not mutate', done => {
    const data = { fields: [{ name: 'id' }] }
      , schemaCopy = lodash.extend({}, data)
      , model = Schema.load(data)

    model.then(() => {
      assert.deepEqual(data, schemaCopy)
      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('should throw exception if field name does not exists', done => {
    const model = Schema.load(SCHEMA)
    model.then(schema => {
      assert.throws(() => {
        schema.getField('unknown')
      }, Error)
      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('should load json file', done => {
    const url = 'http://example.com/remote.json'
    fetchMock.restore()
    fetchMock.mock(url, SCHEMA)

    const model = Schema.load(url, true)
    model.then(schema => {
      assert.equal(schema.fieldNames.length, 5)
      // assert.equal(schema.requiredHeaders.length, 2)
      assert.isTrue(schema.fieldNames.includes('id'))
      assert.isTrue(schema.fieldNames.includes('height'))
      assert.isTrue(schema.fieldNames.includes('age'))
      assert.isTrue(schema.fieldNames.includes('name'))
      assert.isTrue(schema.fieldNames.includes('occupation'))
      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('should fail on load of json file', done => {
    const url = 'http://example.com/remote.json'
    fetchMock.restore()
    fetchMock.mock(url, 400)

    const model = Schema.load(url)
    model.then(() => {
      assert.isTrue(false, 'Shouldn\'t enter here')
      done()
    }).catch(error => {
      assert.isNotNull(error)
      done()
    })
  })

  it('convert row', done => {
    (Schema.load(SCHEMA)).then(schema => {
      const value = ['string', '10.0', '1', 'string', 'string']
        , convertedRow = schema.castRow(value)
      assert.deepEqual(['string', 10, 1, 'string', 'string'], convertedRow)
      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('shouldn\'t convert row with less items than headers count', done => {
    (Schema.load(SCHEMA)).then(schema => {
      assert.throws(() => {
        schema.castRow(['string', '10.0', '1', 'string'])
      }, Array)
      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('shouldn\'t convert row with too many items', done => {
    (Schema.load(SCHEMA)).then(schema => {
      assert.throws(() => {
        schema.castRow(
          ['string', '10.0', '1', 'string', 'string', 'string'])
      }, Array)
      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('shouldn\'t convert row with wrong type (fail fast)', done => {
    (Schema.load(SCHEMA)).then(schema => {
      assert.throws(() => {
        schema.castRow(['string', 'notdecimal', '10.6', 'string', 'string']
          , true)
      }, Array)
      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('shouldn\'t convert row with wrong type multiple errors', done => {
    (Schema.load(SCHEMA)).then(schema => {
      try {
        schema.castRow(['string', 'notdecimal', '10.6', 'string', true])
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

  it('should allow pattern format for date', async () => {
    const descriptor = {fields: [{name: 'year', format: '%Y', type: 'date'}]}
    const schema = await Schema.load(descriptor)
    assert.deepEqual(schema.castRow(['2005']), [new Date(2005, 0, 1)])
  })

  it('should work in strict mode', async () => {
    const descriptor = {fields: [{name: 'name', type: 'string'}]}
    const schema = await Schema.load(descriptor)
    assert.deepEqual(schema.valid, true)
    assert.deepEqual(schema.errors, [])
  })

  it('should work in non-strict mode', async () => {
    const descriptor = {fields: [{name: 'name', type: 'bad'}]}
    const schema = await Schema.load(descriptor, {strict: false})
    assert.deepEqual(schema.valid, false)
    assert.deepEqual(schema.errors.length, 1)
  })

})
