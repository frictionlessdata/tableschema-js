import fs from 'fs'
import _ from 'lodash'
import parse from 'csv-parse'
import { assert } from 'chai'
import {infer} from '../src/infer'


// Tests

describe('infer', () => {

  before(function() {
    // Skip infer tests for browser
    if (process.env.USER_ENV === 'browser') {
      this.skip()
    }
  })

  it('produce schema from a generic .csv', done => {
    fs.readFile('data/data_infer.csv', (err, data) => {
      assert.isNull(err)

      parse(data, (error, values) => {
        assert.isNull(error, 'CSV parse failed')
        const headers = values.shift()
          , schema = infer(headers, values)

        assert.property(schema, 'fields')
        assert.isArray(schema.fields)
        for (const field of schema.fields) {
          assert.property(field, 'name')
          assert.property(field, 'title')
          assert.property(field, 'description')
          assert.property(field, 'type')
          assert.property(field, 'format')
        }
        done()
      })
    })
  })

  it('produce schema from a generic .csv UTF-8 encoded', done => {
    fs.readFile('data/data_infer_utf8.csv', (err, data) => {
      assert.isNull(err)

      parse(data, (error, values) => {
        assert.isNull(error, 'CSV parse failed')
        const headers = values.shift()
          , schema = infer(headers, values)

        assert.property(schema, 'fields')
        assert.isArray(schema.fields)
        for (const field of schema.fields) {
          assert.property(field, 'name')
          assert.property(field, 'title')
          assert.property(field, 'description')
          assert.property(field, 'type')
          assert.property(field, 'format')
        }
        done()
      })
    })
  })

  it('respect row limit parameter', done => {
    fs.readFile('data/data_infer_row_limit.csv', (err, data) => {
      assert.isNull(err)

      parse(data, (error, values) => {
        assert.isNull(error, 'CSV parse failed')
        const headers = values.shift()
          , schema = infer(headers, values, { rowLimit: 4 })

        assert.property(schema, 'fields')
        assert.isArray(schema.fields)
        for (const field of schema.fields) {
          assert.property(field, 'name')
          assert.property(field, 'title')
          assert.property(field, 'description')
          assert.property(field, 'type')
          assert.property(field, 'format')
        }
        // here need to check the type of the value, because without row limit
        // parameter the type of value can change
        assert.equal(_.find(schema.fields, { name: 'id' }).type, 'integer')
        assert.equal(_.find(schema.fields, { name: 'age' }).type, 'integer')
        assert.equal(_.find(schema.fields, { name: 'name' }).type, 'string')
        done()
      })
    })
  })

  // There is no more currency format
  it.skip('respect cast parameter', done => {
    fs.readFile('data/data_infer_formats.csv', (err, data) => {
      assert.isNull(err)

      parse(data, (error, values) => {
        assert.isNull(error, 'CSV parse failed')
        const headers = values.shift()
          , schema = infer(
          headers
          , values
          , {
            cast: {
              number: {
                format: 'currency'
              }
              , string: {
                format: 'uri'
              }
            }
          })

        assert.property(schema, 'fields')
        assert.isArray(schema.fields)
        for (const field of schema.fields) {
          assert.property(field, 'name')
          assert.property(field, 'title')
          assert.property(field, 'description')
          assert.property(field, 'type')
          assert.property(field, 'format')
        }
        // here need to check the type of the value, because without row limit
        // parameter the type of value can change
        assert.equal(_.find(schema.fields, { name: 'id' }).type, 'integer')
        assert.equal(_.find(schema.fields, { name: 'capital' }).type, 'number')
        assert.equal(_.find(schema.fields, { name: 'url' }).type, 'string')
        assert.equal(_.find(schema.fields, { name: 'capital' }).format,
                     'currency')
        assert.equal(_.find(schema.fields, { name: 'url' }).format, 'uri')
        done()
      })
    })
  })

  it('respect primaryKey parameter', done => {
    fs.readFile('data/data_infer.csv', (err, data) => {
      assert.isNull(err)

      parse(data, (error, values) => {
        assert.isNull(error, 'CSV parse failed')
        const headers = values.shift()
          , schema = infer(headers, values, { primaryKey: 'id' })

        assert.property(schema, 'primaryKey')
        assert.isArray(schema.primaryKey)
        assert.equal(schema.primaryKey[0], 'id')
        done()
      })
    })
  })

  it('respect primaryKey parameter as an array', done => {
    fs.readFile('data/data_infer.csv', (err, data) => {
      assert.isNull(err)

      parse(data, (error, values) => {
        assert.isNull(error, 'CSV parse failed')
        const headers = values.shift()
          , schema = infer(headers, values, { primaryKey: ['id', 'age'] })

        assert.property(schema, 'primaryKey')
        assert.isArray(schema.primaryKey)
        assert.isTrue(schema.primaryKey.indexOf('id') !== -1)
        assert.isTrue(schema.primaryKey.indexOf('age') !== -1)
        done()
      })
    })
  })

  it('do not create constraints if explicit param passed as FALSE', done => {
    fs.readFile('data/data_infer.csv', (err, data) => {
      assert.isNull(err)

      parse(data, (error, values) => {
        assert.isNull(error, 'CSV parse failed')
        const headers = values.shift()
          , schema = infer(headers, values, { explicit: false })

        for (const field of schema.fields) {
          assert.notProperty(field, 'constraints')
        }
        done()
      })
    })
  })

  it('create constraints if explicit param passed as TRUE', done => {
    fs.readFile('data/data_infer.csv', (err, data) => {
      assert.isNull(err)

      parse(data, (error, values) => {
        assert.isNull(error, 'CSV parse failed')
        const headers = values.shift()
          , schema = infer(headers, values, { explicit: true })

        for (const field of schema.fields) {
          assert.property(field, 'constraints')
        }
        done()
      })
    })
  })
})
