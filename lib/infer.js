'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _underscore = require('underscore');

var _ = _interopRequireWildcard(_underscore);

var _types = require('./types');

var types = _interopRequireWildcard(_types);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * Return a schema from the passed headers and values.
 *
 * @param headers {Array} - a list of header names
 * @param values {Array} - a reader over data, yielding each row as a list of
 *   values
 * @param options {Object}:
 *  - {integer} rowLimit - limit amount of rows to be proceed
 *  - {boolean} explicit - be explicit
 *  - {string} primaryKey - pass in a primary key or iterable of keys
 *  - {object} cast - TODO add description
 *
 * @returns {object} a JSON Table Schema as a Python dict
 */

exports.default = function (headers, values) {
  var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  // Set up default options
  var opts = _.extend({
    rowLimit: null,
    explicit: false,
    primaryKey: null,
    cast: {}
  }, options),
      guesser = new types.TypeGuesser(opts.cast),
      schema = { fields: [] };

  if (opts.primaryKey) {
    schema.primaryKey = opts.primaryKey;
  }

  schema.fields = headers.map(function (header) {
    var constraints = {},
        descriptor = {
      name: header,
      title: '',
      description: ''
    };

    if (opts.explicit) {
      constraints.required = true;
    }

    if (header === opts.primaryKey) {
      constraints.unique = true;
    }

    if (!_.isEmpty(constraints)) {
      descriptor.constraints = constraints;
    }

    return descriptor;
  });

  headers.forEach(function (header, index) {
    var columnValues = _.pluck(values, index);

    if (opts.rowLimit) {
      columnValues = _.first(columnValues, opts.rowLimit);
    }

    schema.fields[index] = _.extend(schema.fields[index], {
      type: guesser.multiCast(columnValues),
      format: 'default'
    });
  });

  return schema;
};
//# sourceMappingURL=infer.js.map