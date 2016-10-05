/* global describe, beforeEach, it */
import { assert } from 'chai'
import fs from 'fs'
import Resource from '../src/resource'
import Schema from '../src/schema'

let SCHEMA
  , DATA

describe('Resource', () => {
  beforeEach(done => {
    SCHEMA = {
      fields: [
        {
          name: 'id'
          , type: 'integer'
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
          , type: 'datetime'
          , constraints: { required: false }
        }
      ]
    }

    DATA = [
      [1, '10.0', '1', 'string1', '2012-06-15 00:00:00']
      , [2, '10.1', '2', 'string2', '2013-06-15 01:00:00']
      , [3, '10.2', '3', 'string3', '2014-06-15 02:00:00']
      , [4, '10.3', '4', 'string4', '2015-06-15 03:00:00']
      , [5, '10.4', '5', 'string5', '2016-06-15 04:00:00']
    ]
    done()
  })

  it('shouldn\'t instantiate with wrong schema', done => {
    (new Resource('wrong schema', DATA)).then(resource => {
      assert.isTrue(false)
      done()
    }, error => {
      assert.isNotNull(error)
      done()
    })
  })

  it('should work with Schema instance', function (done) {
    let count = 0;
    (new Schema(SCHEMA)).then(model => {
      (new Resource(model, DATA)).then(resource => {
        resource.iter(items => {
          // ... do something with items
          count += 1
        }).then(() => {
          assert.equal(count, 5)
          done()
        }, errors => {
          assert.isNull(errors)
          done()
        })
      }, error => {
        assert.isNull(error)
        done()
      }, error => {
        assert.isNull(error)
        done()
      })
    })
  })

  it('should return converted values for provided array', function (done) {
    let count = 0;
    (new Resource(SCHEMA, DATA)).then(
      resource => {
        resource.iter(items => {
          // ... do something with items
          count += 1
        }).then(() => {
          assert.equal(count, 5)
          done()
        }, errors => {
          assert.isNull(errors)
          done()
        })
      }, error => {
        assert.isNull(error)
        done()
      })
  })

  it('should return converted values for readable stream', function (done) {
    let count = 0;
    (new Resource(SCHEMA, fs.createReadStream('./data/data_big.csv'))).then(
      resource => {
        resource.iter(items => {
          // ... do something with items
          count++
        }).then(() => {
          assert.equal(count, 100)
          done()
        }, errors => {
          assert.isNull(errors)
          done()
        })
      }, error => {
        assert.isNull(error)
        done()
      })
  })

  it('should return converted values for local path', function (done) {
    let count = 0;
    (new Resource(SCHEMA, './data/data_big.csv')).then(resource => {
      resource.iter(items => {
        // ... do something with items
        count++
      }).then(() => {
        assert.equal(count, 100)
        done()
      }, errors => {
        assert.isNull(errors)
        done()
      })
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  //
  //it('should return converted values', done => {
  //  (new Resource(SCHEMA, DATA)).then(resource => {
  //    let convItem
  //      , origItem
  //
  //    try {
  //      const converted = resource.iter()
  //      assert.equal(DATA.length, converted.length)
  //
  //      for (let i = 0, l1 = converted.length; i < l1; i++) {
  //        convItem = converted[i]
  //        origItem = DATA[i]
  //        assert.equal(convItem[0], String(origItem[0]))
  //        assert.equal(convItem[1], Number(origItem[1]))
  //        assert.equal(convItem[2], parseInt(origItem[2], 10))
  //        assert.equal(convItem[3], String(origItem[3]))
  //        assert.isTrue(moment.isMoment(convItem[4]))
  //      }
  //    } catch (e) {
  //      console.log(e)
  //      assert.isNull(e)
  //    }
  //    done()
  //  }, error => {
  //    assert.isNull(error)
  //    done()
  //  })
  //})
  //
  //it('unique constraints violation', done => {
  //  SCHEMA.fields[0].constraints.unique = true
  //  DATA.push(['string', '10.0', '1', 'string', '2012-06-15'])
  //  DATA.push(['string', '10.0', '1', 'string', '2012-06-15']);
  //  (new Resource(SCHEMA, DATA)).then(resource => {
  //    try {
  //      resource.iter()
  //    } catch (e) {
  //      assert.isArray(e)
  //      assert.equal(e.length, 2)
  //    }
  //    done()
  //  }, error => {
  //    assert.isNull(error)
  //    done()
  //  })
  //})
  //
  //it('unique constraints violation fail fast', done => {
  //  SCHEMA.fields[0].constraints.unique = true
  //  DATA.push(['string', '10.0', '1', 'string', '2012-06-15']);
  //  (new Resource(SCHEMA, DATA)).then(resource => {
  //    try {
  //      resource.iter(true)
  //    } catch (e) {
  //      assert.isArray(e)
  //      assert.equal(e.length, 1)
  //    }
  //    done()
  //  }, error => {
  //    assert.isNull(error)
  //    done()
  //  })
  //})
  //
  //it('unique constraints violation skip constraints', done => {
  //  SCHEMA.fields[0].constraints.unique = true
  //  DATA.push(['string', '10.0', '1', 'string', '2012-06-15']);
  //  (new Resource(SCHEMA, DATA)).then(resource => {
  //    assert.doesNotThrow(() => {
  //      resource.iter(true, true)
  //    }, Array)
  //    done()
  //  }, error => {
  //    assert.isNull(error)
  //    done()
  //  })
  //})
  //
  //it('unique constraints violation for primary key', done => {
  //  SCHEMA.primaryKey = ['height', 'age']
  //  DATA.push(['string', '10.0', '1', 'string', '2012-06-15']);
  //  (new Resource(SCHEMA, DATA)).then(resource => {
  //    try {
  //      resource.iter()
  //    } catch (e) {
  //      assert.isArray(e)
  //      assert.equal(e.length, 1)
  //    }
  //    done()
  //  }, error => {
  //    assert.isNull(error)
  //    done()
  //  })
  //})
})
