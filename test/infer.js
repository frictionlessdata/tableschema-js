/* global describe, it, require */

var _ = require('underscore')
  , assert = require('chai').assert
  , csv = require('csv')
  , CSVData = require('./CSV')
  , infer = require('../lib/').infer

// WARN Use Model in test cases instead of validating schema directly
describe('Infer', function () {
  it('produce schema from a generic .csv', function (done) {
    csv.parse(CSVData.dataInfer, function (error, output) {
      assert.isNull(error, 'CSV parse failed')

      var schema = infer(output[0], _.rest(output))

      assert.equal(_.findWhere(schema.fields, { name: 'id' }).type, 'integer')
      assert.equal(_.findWhere(schema.fields, { name: 'age' }).type, 'integer')
      assert.equal(_.findWhere(schema.fields, { name: 'name' }).type, 'string')
      done()
    })
  })

  it('respect rowLimit param', function (done) {
    csv.parse(CSVData.dataInferRowLimit, function (error, output) {
      assert.isNull(error, 'CSV parse failed')

      var schema = infer(output[0], _.rest(output), { rowLimit: 4 })

      assert.equal(_.findWhere(schema.fields, { name: 'id' }).type, 'integer')
      assert.equal(_.findWhere(schema.fields, { name: 'age' }).type, 'integer')
      assert.equal(_.findWhere(schema.fields, { name: 'name' }).type, 'string')
      done()
    })
  })

  it('respect primaryKey param', function (done) {
    csv.parse(CSVData.dataInferRowLimit, function (error, output) {
      assert.isNull(error, 'CSV parse failed')

      var primaryKey = 'id'
        , schema = infer(output[0], _.rest(output), { primaryKey })

      assert.equal(schema.primaryKey, primaryKey)
      done()
    })
  })

  it('respect primaryKey param passed as list of fields', function (done) {
    csv.parse(CSVData.dataInfer, function (error, output) {
      assert.isNull(error, 'CSV parse failed')

      var primaryKey = ['id', 'age']
        , schema = infer(output[0], _.rest(output), { primaryKey })

      assert.equal(schema.primaryKey, primaryKey)
      done()
    })
  })

  it('do not create constraints if explicit param passed as False',
     function (done) {
       csv.parse(CSVData.dataInfer, function (error, output) {
         assert.isNull(error, 'CSV parse failed')

         var schema = infer(output[0], _.rest(output), { explicit: false })

         assert.notProperty(schema.fields[0], 'constraints')
         done()
       })
     })

  it('create constraints if explicit param passed as True', function (done) {
    csv.parse(CSVData.dataInfer, function (error, output) {
      assert.isNull(error, 'CSV parse failed')

      var schema = infer(output[0], _.rest(output), { explicit: true })

      assert.property(schema.fields[0], 'constraints')
      assert.property(schema.fields[0].constraints, 'required')
      done()
    })
  })

  it('Should take the best suitable type', function (done) {
    csv.parse(CSVData.dataDates, function (error, output) {
      assert.isNull(error, 'CSV parse failed')

      var schema = infer(output[0], _.rest(output))

      assert.equal(schema.fields[0].type, 'integer')
      assert.equal(schema.fields[1].type, 'datetime')
      done()
    })
  })
})
