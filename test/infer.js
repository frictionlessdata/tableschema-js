/* global describe, it, require */
import fs from 'fs'
import csv from 'csv'
import { _ } from 'underscore'
import { assert } from 'chai'
import infer from '../src/infer'

describe('Infer', () => {
  it('produce schema from a generic .csv', (done) => {
    fs.readFile('data/data_infer.csv', (err, data) => {
      assert.isNull(err, 'loading file data/data_infer.csv failed')

      csv.parse(data, (error, output) => {
        assert.isNull(error, 'CSV parse failed')
        const schema = infer(output[0], _.rest(output))

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

  it('produce schema from a generic .csv UTF-8 encoded', (done) => {
    fs.readFile('data/data_infer_utf8.csv', (err, data) => {
      assert.isNull(err, 'loading file data/data_infer_utf8.csv failed')

      csv.parse(data, (error, output) => {
        assert.isNull(error, 'CSV parse failed')
        const schema = infer(output[0], _.rest(output))

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

  it('respect row limit parameter', (done) => {
    fs.readFile('data/data_infer_row_limit.csv', (err, data) => {
      assert.isNull(err, 'loading file data/data_infer_row_limit.csv failed')

      csv.parse(data, (error, output) => {
        assert.isNull(error, 'CSV parse failed')
        const schema = infer(output[0], _.rest(output), { rowLimit: 4 })

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
        assert.equal(_.findWhere(schema.fields, { name: 'id' }).type, 'integer')
        assert.equal(_.findWhere(schema.fields, { name: 'age' }).type,
                     'integer')
        assert.equal(_.findWhere(schema.fields, { name: 'name' }).type,
                     'string')
        done()
      })
    })
  })

  it('respect primaryKey parameter', (done) => {
    fs.readFile('data/data_infer.csv', (err, data) => {
      assert.isNull(err, 'loading file data/data_infer.csv failed')

      csv.parse(data, (error, output) => {
        assert.isNull(error, 'CSV parse failed')
        const schema = infer(output[0], _.rest(output), { primaryKey: 'id' })

        assert.property(schema, 'primaryKey')
        assert.equal(schema.primaryKey, 'id')
        done()
      })
    })
  })

  it('respect primaryKey parameter as an array', (done) => {
    fs.readFile('data/data_infer.csv', (err, data) => {
      assert.isNull(err, 'loading file data/data_infer.csv failed')

      csv.parse(data, (error, output) => {
        assert.isNull(error, 'CSV parse failed')
        const schema = infer(output[0], _.rest(output),
                             { primaryKey: ['id', 'age'] })

        assert.property(schema, 'primaryKey')
        assert.isArray(schema.primaryKey)
        assert.isTrue(schema.primaryKey.indexOf('id') !== -1)
        assert.isTrue(schema.primaryKey.indexOf('age') !== -1)
        done()
      })
    })
  })

  it('do not create constraints if explicit param passed as FALSE', (done) => {
    fs.readFile('data/data_infer.csv', (err, data) => {
      assert.isNull(err, 'loading file data/data_infer.csv failed')

      csv.parse(data, (error, output) => {
        assert.isNull(error, 'CSV parse failed')
        const schema = infer(output[0], _.rest(output), { explicit: false })

        for (const field of schema.fields) {
          assert.notProperty(field, 'constraints')
        }
        done()
      })
    })
  })

  it('create constraints if explicit param passed as TRUE', (done) => {
    fs.readFile('data/data_infer.csv', (err, data) => {
      assert.isNull(err, 'loading file data/data_infer.csv failed')

      csv.parse(data, (error, output) => {
        assert.isNull(error, 'CSV parse failed')
        const schema = infer(output[0], _.rest(output), { explicit: true })

        for (const field of schema.fields) {
          assert.property(field, 'constraints')
        }
        done()
      })
    })
  })
})
