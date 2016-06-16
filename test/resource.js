/* global describe, beforeEach, it */
import { assert } from 'chai'
import Resource from '../src/resource'
import moment from 'moment'

let SCHEMA
  , DATA

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
          , type: 'date'
          , constraints: { required: false }
        }
      ]
    }

    DATA = [
      ['string', '10.0', '1', 'string', '2012-06-15']
      , ['string2', '10.0', '1', 'string', '2013-06-15']
      , ['string3', '10.0', '1', 'string', '2014-06-15']
      , ['string4', '10.0', '1', 'string', '2015-06-15']
      , ['string5', '10.0', '1', 'string', '2016-06-15']
    ]
    done()
  })

  it('shouldn\'t instantiate on wrong schema', done => {
    (new Resource('wrong schema', DATA)).then(resource => {
      assert.isTrue(false)
      done()
    }, error => {
      assert.isNotNull(error)
      done()
    })
  })

  it('should return converted values', done => {
    (new Resource(SCHEMA, DATA)).then(resource => {
      let convItem
        , origItem

      const converted = resource.iter()
      assert.equal(DATA.length, converted.length)

      for (let i = 0, l1 = converted.length; i < l1; i++) {
        convItem = converted[i]
        origItem = DATA[i]
        assert.equal(convItem[0], String(origItem[0]))
        assert.equal(convItem[1], Number(origItem[1]))
        assert.equal(convItem[2], parseInt(origItem[2], 10))
        assert.equal(convItem[3], String(origItem[3]))
        assert.isTrue(moment.isMoment(convItem[4]))
      }

      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('unique constraints violation', done => {
    SCHEMA.fields[0].constraints.unique = true
    DATA.push(['string', '10.0', '1', 'string', '2012-06-15']);
    DATA.push(['string', '10.0', '1', 'string', '2012-06-15']);
    (new Resource(SCHEMA, DATA)).then(resource => {
      try {
        resource.iter()
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

  it('unique constraints violation fail fast', done => {
    SCHEMA.fields[0].constraints.unique = true
    DATA.push(['string', '10.0', '1', 'string', '2012-06-15']);
    (new Resource(SCHEMA, DATA)).then(resource => {
      try {
        resource.iter(true)
      } catch (e) {
        assert.isArray(e)
        assert.equal(e.length, 1)
      }
      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('unique constraints violation skip constraints', done => {
    SCHEMA.fields[0].constraints.unique = true
    DATA.push(['string', '10.0', '1', 'string', '2012-06-15']);
    (new Resource(SCHEMA, DATA)).then(resource => {
      assert.doesNotThrow(() => {
        resource.iter(true, true)
      }, Array)
      done()
    }, error => {
      assert.isNull(error)
      done()
    })
  })
})
