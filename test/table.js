import fs from 'fs'
import {assert} from 'chai'
import {Table} from '../src/table'
import {Schema} from '../src/schema'


// Tests

let SCHEMA
  , DATA

describe('Table', () => {

  before(function() {
    // Skip infer tests for browser
    if (process.env.USER_ENV === 'browser') {
      this.skip()
    }
  })

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
          , type: 'datetime'
          , format: 'any'
        }
      ]
    }

    DATA = [
      [1, '10.0', 1, 'string1', '2012-06-15 00:00:00']
      , [2, '10.1', 2, 'string2', '2013-06-15 01:00:00']
      , [3, '10.2', 3, 'string3', '2014-06-15 02:00:00']
      , [4, '10.3', 4, 'string4', '2015-06-15 03:00:00']
      , [5, '10.4', 5, 'string5', '2016-06-15 04:00:00']
    ]
    done()
  })

  it('shouldn\'t instantiate with wrong schema', done => {
    (new Table(DATA, {schema: 'wrong schema'})).then(() => {
      assert.isTrue(false)
      done()
    }, error => {
      assert.isNotNull(error)
      done()
    })
  })

  it('should work with Schema instance', (done) => {
    let count = 0;
    (Schema.load(SCHEMA)).then(model => {
      (new Table(DATA, {schema: model})).then(table => {
        table.iter({callback: () => {count += 1}}).then(() => {
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

  it('should return converted values for provided array', (done) => {
    let count = 0;
    (new Table(DATA, {schema: SCHEMA})).then(table => {
      table.iter({callback: () => {count += 1}}).then(() => {
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

  it('should return converted values for readable stream', (done) => {
    let count = 0;
    (new Table(fs.createReadStream('./data/data_big.csv'), {schema: SCHEMA})).then(
      table => {
        table.iter({callback: () => {count += 1}}).then(() => {
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

  it('should return converted values for local path', (done) => {
    let count = 0;
    (new Table('./data/data_big.csv', {schema: SCHEMA})).then(table => {
      table.iter({callback: () => {count += 1}}).then(() => {
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

  it('should return converted values', done => {
    (new Table(DATA, {schema: SCHEMA})).then(table => {
      const converted = []
      table.iter({callback: items => {converted.push(items)}}).then(() => {
        let convItem
          , origItem
        assert.equal(DATA.length, converted.length)

        for (let i = 0, l1 = converted.length; i < l1; i = i + 1) {
          convItem = converted[i]
          origItem = DATA[i]
          assert.equal(convItem[0], String(origItem[0]))
          assert.equal(convItem[1], Number(origItem[1]))
          assert.equal(convItem[2], parseInt(origItem[2], 10))
          assert.equal(convItem[3], String(origItem[3]))
          assert.equal(Object.prototype.toString.call(convItem[4]),
                       '[object Date]')
        }
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

  it('unique constraints violation', done => {
    SCHEMA.fields[0].constraints.unique = true
    DATA.push([1, '10.0', '1', 'string', '2012-06-15'])
    DATA.push([1, '10.0', '1', 'string', '2012-06-15']);
    (new Table(DATA, {schema: SCHEMA})).then(table => {
      table.iter({callback: () => {}}).then(() => {
        done()
      }, errors => {
        assert.isArray(errors)
        assert.equal(errors.length, 2)
        done()
      })
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('unique constraints violation fail fast', done => {
    SCHEMA.fields[0].constraints.unique = true
    DATA.push([1, '10.0', '1', 'string', '2012-06-15']);
    (new Table(DATA, {schema: SCHEMA})).then(table => {
      table.iter({callback: () => {}}).then(() => {
        done()
      }, errors => {
        assert.isArray(errors)
        assert.equal(errors.length, 1)
        done()
      })
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it.skip('unique constraints violation skip constraints', done => {
    SCHEMA.fields[0].constraints.unique = true
    DATA.push([1, '10.0', '1', 'string', '2012-06-15']);
    (new Table(DATA, {schema: SCHEMA})).then(table => {
      const callback = () => {
      }
      table.iter(callback, true, true).then(() => {
        assert.isTrue(true)
        done()
      }, errors => {
        // shouldn't get here
        assert.isNull(errors)
        done()
      })
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('unique constraints violation for primary key', done => {
    SCHEMA.primaryKey = ['height', 'age']
    DATA.push([6, '10.0', 1, 'string', '2012-06-15']);
    (new Table(DATA, {schema: SCHEMA})).then(table => {
      table.iter({callback: () => {}}).then(() => {
        done()
      }, errors => {
        assert.isArray(errors)
        assert.equal(errors.length, 1)
        done()
      })
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('should read from data with limit of rows', done => {
    (new Table(DATA, {schema: SCHEMA})).then(table => {
      table.read({limit: 2}).then(data => {
        assert.isArray(data)
        assert.equal(data.length, 2)
        done()
      }, errors => {
        // never should get here
        assert.isNull(errors)
        done()
      })
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it.skip('should read from data with limit and return keyed rows', done => {
    (new Table(DATA, {schema: SCHEMA})).then(table => {
      table.read(true, false, 2).then(data => {
        assert.isArray(data)
        assert.equal(data.length, 2)
        for (const value of data) {
          for (const header of table.schema.headers) {
            assert.isTrue(value.hasOwnProperty(header))
          }
        }
        done()
      }, errors => {
        // never should get here
        assert.isNull(errors)
        done()
      })
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it.skip('should read from data with limit and return extended rows', done => {
    (new Table(DATA, {schema: SCHEMA})).then(table => {
      table.read(false, true, 2).then(data => {
        assert.isArray(data)
        assert.equal(data.length, 2)
        let index = 1
        for (const value of data) {
          for (const header of table.schema.headers) {
            assert.isTrue(value[index].hasOwnProperty(header))
          }
          index += 1
        }
        done()
      }, errors => {
        // never should get here
        assert.isNull(errors)
        done()
      })
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('should save source', done => {
    const path = 'test.csv';
    (new Table(DATA, {schema: SCHEMA})).then(table => {
      table.save(path).then(() => {
        fs.readFile(path, 'utf8', (error, data) => {
          assert.isNull(error)
          assert.isNotNull(data)
          fs.unlinkSync(path)
          done()
        })
      }).catch(error => {
        // never should get here
        assert.isNull(error)
        done()
      })
    }, error => {
      assert.isNull(error)
      done()
    })
  })

  it('should iter/read with cast true', async () => {
    const table = await new Table(DATA, {schema: SCHEMA})
    const iterRows = []
    const callback = row => iterRows.push(row)
    const readRows = await table.read({cast: true})
    await table.iter({callback, cast: true})
    assert.deepEqual(iterRows[0], [1, 10.0, 1, 'string1', new Date(2012, 6-1, 15)])
    assert.deepEqual(readRows[0], [1, 10.0, 1, 'string1', new Date(2012, 6-1, 15)])
  })

  it('should iter/read with cast false', async () => {
    const table = await new Table(DATA, {schema: SCHEMA})
    const iterRows = []
    const callback = row => iterRows.push(row)
    const readRows = await table.read({cast: false})
    await table.iter({callback, cast: false})
    assert.deepEqual(iterRows[0], [1, '10.0', 1, 'string1', '2012-06-15 00:00:00'])
    assert.deepEqual(readRows[0], [1, '10.0', 1, 'string1', '2012-06-15 00:00:00'])
  })
})
