require('regenerator-runtime/runtime')
const { Table } = require('./table')
const { Schema } = require('./schema')
const { Field } = require('./field')
const { validate } = require('./validate')
const { infer } = require('./infer')
const { DataPackageError } = require('./errors')
const { TableSchemaError } = require('./errors')

// Module API

module.exports = {
  Table,
  Schema,
  Field,
  validate,
  infer,
  DataPackageError,
  TableSchemaError,

  // Deprecated
  errors: {
    DataPackageError,
    TableSchemaError,
  },
}
