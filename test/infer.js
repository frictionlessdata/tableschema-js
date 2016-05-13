/* global describe, it, require */

'use strict'

const _ = require('underscore')
  , assert = require('chai').assert
  , csv = require('csv')
  , CSVData = require('./CSV')
  , infer = require('../src/').infer

// WARN Use Model in test cases instead of validating schema directly
describe('Infer', () => {
  it('produce schema from a generic .csv', (done) => {
    csv.parse(CSVData.dataInfer, (error, output) => {
      assert.isNull(error, 'CSV parse failed')

      const schema = infer(output[0], _.rest(output))

      assert.equal(_.findWhere(schema.fields, { name: 'id' }).type, 'integer')
      assert.equal(_.findWhere(schema.fields, { name: 'age' }).type, 'integer')
      assert.equal(_.findWhere(schema.fields, { name: 'name' }).type, 'string')
      done()
    })
  })

  it('respect rowLimit param', (done) => {
    csv.parse(CSVData.dataInferRowLimit, (error, output) => {
      assert.isNull(error, 'CSV parse failed')

      const schema = infer(output[0], _.rest(output), { rowLimit: 4 })

      assert.equal(_.findWhere(schema.fields, { name: 'id' }).type, 'integer')
      assert.equal(_.findWhere(schema.fields, { name: 'age' }).type, 'integer')
      assert.equal(_.findWhere(schema.fields, { name: 'name' }).type, 'string')
      done()
    })
  })

  it('respect primaryKey param', (done) => {
    csv.parse(CSVData.dataInferRowLimit, (error, output) => {
      assert.isNull(error, 'CSV parse failed')

      const primaryKey = 'id'
        , schema = infer(output[0], _.rest(output), { primaryKey })

      assert.equal(schema.primaryKey, primaryKey)
      done()
    })
  })

  it('respect primaryKey param passed as list of fields', (done) => {
    csv.parse(CSVData.dataInfer, (error, output) => {
      assert.isNull(error, 'CSV parse failed')

      const primaryKey = ['id', 'age']
        , schema = infer(output[0], _.rest(output), { primaryKey })

      assert.equal(schema.primaryKey, primaryKey)
      done()
    })
  })

  it('do not create constraints if explicit param passed as False', (done) => {
    csv.parse(CSVData.dataInfer, (error, output) => {
      assert.isNull(error, 'CSV parse failed')

      const schema = infer(output[0], _.rest(output), { explicit: false })

      assert.notProperty(schema.fields[0], 'constraints')
      done()
    })
  })

  it('create constraints if explicit param passed as True', (done) => {
    csv.parse(CSVData.dataInfer, (error, output) => {
      assert.isNull(error, 'CSV parse failed')

      const schema = infer(output[0], _.rest(output), { explicit: true })

      assert.property(schema.fields[0], 'constraints')
      assert.property(schema.fields[0].constraints, 'required')
      done()
    })
  })

  it('Should take the best suitable type', (done) => {
    csv.parse(CSVData.dataDates, (error, output) => {
      assert.isNull(error, 'CSV parse failed')

      const schema = infer(output[0], _.rest(output))

      assert.equal(schema.fields[0].type, 'integer')
      assert.equal(schema.fields[1].type, 'datetime')
      done()
    })
  })
})
