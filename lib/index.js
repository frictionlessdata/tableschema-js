'use strict';

require('regenerator-runtime/runtime');

var _require = require('./table'),
    Table = _require.Table;

var _require2 = require('./schema'),
    Schema = _require2.Schema;

var _require3 = require('./field'),
    Field = _require3.Field;

var _require4 = require('./validate'),
    validate = _require4.validate;

var _require5 = require('./infer'),
    infer = _require5.infer;

var _require6 = require('./errors'),
    DataPackageError = _require6.DataPackageError;

var _require7 = require('./errors'),
    TableSchemaError = _require7.TableSchemaError;

// Module API

module.exports = {
  Table: Table,
  Schema: Schema,
  Field: Field,
  validate: validate,
  infer: infer,
  DataPackageError: DataPackageError,
  TableSchemaError: TableSchemaError,

  // Deprecated
  errors: {
    DataPackageError: DataPackageError,
    TableSchemaError: TableSchemaError
  }
};