'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fs = require('fs');
var moment = require('moment');
var min = require('lodash/min');
var zip = require('lodash/zip');
var isArray = require('lodash/isArray');
var isEqual = require('lodash/isEqual');
var isString = require('lodash/isString');
var cloneDeep = require('lodash/cloneDeep');
var isBoolean = require('lodash/isBoolean');
var upperFirst = require('lodash/upperFirst');

var _require = require('./errors'),
    TableSchemaError = _require.TableSchemaError;

var _require2 = require('./profile'),
    Profile = _require2.Profile;

var helpers = require('./helpers');
var config = require('./config');

var _require3 = require('./field'),
    Field = _require3.Field;

var types = require('./types');

// Module API

/**
 * Schema representation
 */

var Schema = function () {
  _createClass(Schema, [{
    key: 'getField',


    /**
     * Return a field
     *
     * @param {string} fieldName
     * @returns {(Field|null)} field instance if exists
     */
    value: function getField(fieldName) {
      var _this = this;

      var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          _ref$index = _ref.index,
          index = _ref$index === undefined ? 0 : _ref$index;

      var name = fieldName;
      var fields = this._fields.filter(function (field) {
        if (_this._caseInsensitiveHeaders) return field.name.toLowerCase === name.toLowerCase;
        return field.name === name;
      });
      if (!fields.length) {
        return null;
      }
      if (!index) {
        return fields[0];
      }
      return this._fields[index];
    }

    /**
     * Add a field
     *
     * @param {Object} descriptor
     * @returns {Field} added field instance
     */

  }, {
    key: 'addField',
    value: function addField(descriptor) {
      if (!this._currentDescriptor.fields) this._currentDescriptor.fields = [];
      this._currentDescriptor.fields.push(descriptor);
      this._build();
      return this._fields[this._fields.length - 1];
    }

    /**
     * Remove a field
     *
     * @param {string} name
     * @returns {(Field|null)} removed field instance if exists
     */

  }, {
    key: 'removeField',
    value: function removeField(name) {
      var field = this.getField(name);
      if (field) {
        var predicat = function predicat(field) {
          return field.name !== name;
        };
        this._currentDescriptor.fields = this._currentDescriptor.fields.filter(predicat);
        this._build();
      }
      return field;
    }

    /**
     * Cast row based on field types and formats.
     *
     * @param {Array[]} row - data row as an array of values
     * @param {boolean} failFalst
     * @returns {Array[]} cast data row
     */

  }, {
    key: 'castRow',
    value: function castRow(row) {
      var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          _ref2$failFast = _ref2.failFast,
          failFast = _ref2$failFast === undefined ? false : _ref2$failFast;

      var result = [];
      var errors = [];

      // Check row length
      if (row.length !== this.fields.length) {
        throw new TableSchemaError('The row with ' + row.length + ' values does not match ' + ('the ' + this.fields.length + ' fields in the schema'));
      }

      // Cast row
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = zip(this.fields, row).entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _step$value = _slicedToArray(_step.value, 2),
              index = _step$value[0],
              _step$value$ = _slicedToArray(_step$value[1], 2),
              field = _step$value$[0],
              value = _step$value$[1];

          try {
            // Recreate the failing field to throw proper error message
            if (!field) new Field(this._currentDescriptor.fields[index]); // eslint-disable-line
            result.push(field.castValue(value));
          } catch (error) {
            error.columnNumber = index + 1;
            if (failFast) throw error;
            errors.push(error);
          }
        }

        // Raise errors
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      if (errors.length) {
        var message = 'There are ' + errors.length + ' type and format mismatch errors (see \'error.errors\')';
        throw new TableSchemaError(message, errors);
      }

      return result;
    }

    /**
     * Infer and set `schema.descriptor` based on data sample.
     *
     * @param {Array[]} rows - array of arrays representing rows
     * @param {(integer|string[])} headers - data sample headers (one of):
     *   - row number containing headers (`rows` should contain headers rows)
     *   - array of headers (`rows` should NOT contain headers rows)
     *   - defaults to 1
     * @returns {Object} Table Schema descriptor
     */

  }, {
    key: 'infer',
    value: function infer(rows) {
      var _ref3 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          _ref3$headers = _ref3.headers,
          headers = _ref3$headers === undefined ? 1 : _ref3$headers;

      rows = cloneDeep(rows);

      // Get headers
      if (!isArray(headers)) {
        var headersRow = headers;
        for (;;) {
          headersRow -= 1;
          headers = rows.shift();
          if (!headersRow) break;
        }
      }

      // Get deafult descriptor
      var descriptor = {
        fields: headers.map(function (header) {
          return { name: header, type: 'any', format: 'default' };
        })

        // Get inferred descriptor
      };var threshold = min([rows.length, config.INFER_THRESHOLD]);
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = descriptor.fields.entries()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _step2$value = _slicedToArray(_step2.value, 2),
              fieldIndex = _step2$value[0],
              field = _step2$value[1];

          var counter = {};
          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = rows.entries()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var _step3$value = _slicedToArray(_step3.value, 2),
                  rowIndex = _step3$value[0],
                  row = _step3$value[1];

              var inspectionCount = rowIndex + 1;
              var inspection = JSON.stringify(inspectValue(row[fieldIndex]));
              counter[inspection] = (counter[inspection] || 0) + 1;
              if (inspectionCount >= threshold) {
                if (counter[inspection] / inspectionCount >= config.INFER_CONFIDENCE) {
                  Object.assign(field, JSON.parse(inspection));
                  break;
                }
              }
            }
          } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
              }
            } finally {
              if (_didIteratorError3) {
                throw _iteratorError3;
              }
            }
          }
        }

        // Set descriptor
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      this._currentDescriptor = descriptor;
      this._build();

      return descriptor;
    }

    /**
     * Update schema instance if there are in-place changes in the descriptor.
     *
     * @example
     *
     * ```javascript
     * const descriptor = {fields: [{name: 'field', type: 'string'}]}
     * const schema = await Schema.load(descriptor)
     *
     * schema.getField('name').type // string
     * schema.descriptor.fields[0].type = 'number'
     * schema.getField('name').type // string
     * schema.commit()
     * schema.getField('name').type // number
     * ```
     *
     * @param {boolean} strict - alter `strict` mode for further work
     * @throws {TableSchemaError} raises any error occurred in the process
     * @returns {Boolean} returns true on success and false if not modified
     */

  }, {
    key: 'commit',
    value: function commit() {
      var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          strict = _ref4.strict;

      if (isBoolean(strict)) this._strict = strict;else if (isEqual(this._currentDescriptor, this._nextDescriptor)) return false;
      this._currentDescriptor = cloneDeep(this._nextDescriptor);
      this._build();
      return true;
    }

    /**
     * Save schema descriptor to target destination.
     *
     * @param {string} target - path where to save a descriptor
     * @throws {TableSchemaError} raises any error occurred in the process
     * @returns {boolean} returns true on success
     */

  }, {
    key: 'save',
    value: function save(target) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        var contents = JSON.stringify(_this2._currentDescriptor, null, 4);
        fs.writeFile(target, contents, function (error) {
          return !error ? resolve() : reject(error);
        });
      });
    }

    // Private

  }, {
    key: 'valid',


    /**
     * Validation status
     *
     * It always `true` in strict mode.
     *
     * @returns {Boolean} returns validation status
     */
    get: function get() {
      return this._errors.length === 0;
    }

    /**
     * Validation errors
     *
     * It always empty in strict mode.
     *
     * @returns {Error[]} returns validation errors
     */

  }, {
    key: 'errors',
    get: function get() {
      return this._errors;
    }

    /**
     * Descriptor
     *
     * @returns {Object} schema descriptor
     */

  }, {
    key: 'descriptor',
    get: function get() {
      // Never use this.descriptor inside this class (!!!)
      return this._nextDescriptor;
    }

    /**
     * Primary Key
     *
     * @returns {string[]} schema primary key
     */

  }, {
    key: 'primaryKey',
    get: function get() {
      var primaryKey = this._currentDescriptor.primaryKey || [];
      return isArray(primaryKey) ? primaryKey : [primaryKey];
    }

    /**
     * Foreign Keys
     *
     * @returns {Object[]} schema foreign keys
     */

  }, {
    key: 'foreignKeys',
    get: function get() {
      var foreignKeys = this._currentDescriptor.foreignKeys || [];
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = foreignKeys[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var key = _step4.value;

          key.fields = key.fields || [];
          key.reference = key.reference || {};
          key.reference.resource = key.reference.resource || '';
          key.reference.fields = key.reference.fields || [];
          if (!isArray(key.fields)) {
            key.fields = [key.fields];
          }
          if (!isArray(key.reference.fields)) {
            key.reference.fields = [key.reference.fields];
          }
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      return foreignKeys;
    }

    /**
     * Fields
     *
     * @returns {Field[]} schema fields
     */

  }, {
    key: 'fields',
    get: function get() {
      return this._fields;
    }

    /**
     * Field names
     *
     * @returns {string[]} schema field names
     */

  }, {
    key: 'fieldNames',
    get: function get() {
      return this._fields.map(function (field) {
        return field.name;
      });
    }
  }], [{
    key: 'load',

    // Public

    /**
     * Factory method to instantiate `Schema` class.
     *
     * This method is async and it should be used with await keyword or as a `Promise`.
     *
     * @param {(string|Object)} descriptor - schema descriptor:
     *   - local path
     *   - remote url
     *   - object
     * @param {boolean} strict - flag to alter validation behaviour:
     *   - if false error will not be raised and all error will be collected in `schema.errors`
     *   - if strict is true any validation error will be raised immediately
     * @throws {TableSchemaError} raises any error occurred in the process
     * @returns {Schema} returns schema class instance
     */
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var descriptor = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        var _ref6 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            _ref6$strict = _ref6.strict,
            strict = _ref6$strict === undefined ? false : _ref6$strict,
            _ref6$caseInsensitive = _ref6.caseInsensitiveHeaders,
            caseInsensitiveHeaders = _ref6$caseInsensitive === undefined ? false : _ref6$caseInsensitive;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return helpers.retrieveDescriptor(descriptor);

              case 2:
                descriptor = _context.sent;
                return _context.abrupt('return', new Schema(descriptor, { strict: strict, caseInsensitiveHeaders: caseInsensitiveHeaders }));

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function load() {
        return _ref5.apply(this, arguments);
      }

      return load;
    }()
  }]);

  function Schema() {
    var descriptor = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var _ref7 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref7$strict = _ref7.strict,
        strict = _ref7$strict === undefined ? false : _ref7$strict,
        _ref7$caseInsensitive = _ref7.caseInsensitiveHeaders,
        caseInsensitiveHeaders = _ref7$caseInsensitive === undefined ? false : _ref7$caseInsensitive;

    _classCallCheck(this, Schema);

    // Set attributes
    this._strict = strict;
    this._caseInsensitiveHeaders = caseInsensitiveHeaders;
    this._currentDescriptor = cloneDeep(descriptor);
    this._nextDescriptor = cloneDeep(descriptor);
    this._profile = new Profile('table-schema');
    this._errors = [];
    this._fields = [];

    // Build instance
    this._build();
  }

  _createClass(Schema, [{
    key: '_build',
    value: function _build() {
      // Process descriptor
      this._currentDescriptor = helpers.expandSchemaDescriptor(this._currentDescriptor);
      this._nextDescriptor = cloneDeep(this._currentDescriptor);

      // Validate descriptor
      this._errors = [];

      var _profile$validate = this._profile.validate(this._currentDescriptor),
          valid = _profile$validate.valid,
          errors = _profile$validate.errors;

      if (!valid) {
        this._errors = errors;
        if (this._strict) {
          var message = 'There are ' + errors.length + ' validation errors (see \'error.errors\')';
          throw new TableSchemaError(message, errors);
        }
      }

      // Populate fields
      this._fields = [];
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = (this._currentDescriptor.fields || [])[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var field = _step5.value;

          var missingValues = this._currentDescriptor.missingValues;
          try {
            field = new Field(field, { missingValues: missingValues });
          } catch (error) {
            field = false;
          }
          this._fields.push(field);
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }
    }
  }]);

  return Schema;
}();

// Internal

var INSPECT_VALUE_YEAR_PATTERN = /[12]\d{3}/;
var INSPECT_VALUE_DATE_TIME_MAPPING = {
  // TODO:
  // Decide on resonable amount of heuristics here
  // and fill this mapping based on the decision
  '%d/%m/%y': 'date',
  '%d/%m/%Y': 'date',
  '%m/%d/%y': 'date',
  '%m/%d/%Y': 'date',
  '%H:%M': 'time'
};
var INSPECT_VALUE_GUESS_ORDER = [
// This format is too broad
// {type: 'year', format: 'default'},
{ type: 'yearmonth', format: 'default' }, { type: 'duration', format: 'default' }, { type: 'geojson', format: 'default' }, { type: 'geojson', format: 'topojson' }, { type: 'geopoint', format: 'default' }, { type: 'geopoint', format: 'array' }, { type: 'geopoint', format: 'object' }, { type: 'object', format: 'default' }, { type: 'array', format: 'default' }, { type: 'datetime', format: 'default' },
// This format is too broad
// {type: 'datetime', format: 'any'},
{ type: 'time', format: 'default' },
// This format is too broad
// {type: 'time', format: 'any'},
{ type: 'date', format: 'default' },
// This format is too broad
// {type: 'date', format: 'any'},
{ type: 'integer', format: 'default' }, { type: 'number', format: 'default' }, { type: 'boolean', format: 'default' }, { type: 'string', format: 'uuid' }, { type: 'string', format: 'email' }, { type: 'string', format: 'uri' }, { type: 'string', format: 'default' }, { type: 'any', format: 'default' }];

function inspectValue(value) {
  // Heuristic
  if (isString(value)) {
    // Guess year
    if (value.length === 4) {
      if (value.match(INSPECT_VALUE_YEAR_PATTERN)) {
        return { type: 'year', format: 'default' };
      }
    }

    // Guess date/time
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
      for (var _iterator6 = Object.entries(INSPECT_VALUE_DATE_TIME_MAPPING)[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
        var _step6$value = _slicedToArray(_step6.value, 2),
            format = _step6$value[0],
            type = _step6$value[1];

        if (moment(value, helpers.convertDatetimeFormatFromFDtoJS(format), true).isValid()) {
          return { type: type, format: format };
        }
      }
    } catch (err) {
      _didIteratorError6 = true;
      _iteratorError6 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion6 && _iterator6.return) {
          _iterator6.return();
        }
      } finally {
        if (_didIteratorError6) {
          throw _iteratorError6;
        }
      }
    }
  }

  // Automatic
  var _iteratorNormalCompletion7 = true;
  var _didIteratorError7 = false;
  var _iteratorError7 = undefined;

  try {
    for (var _iterator7 = INSPECT_VALUE_GUESS_ORDER[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
      var _ref9 = _step7.value;
      var type = _ref9.type,
          format = _ref9.format;

      var cast = types['cast' + upperFirst(type)];
      var result = cast(format, value);
      if (result === config.ERROR) continue;
      return { type: type, format: format };
    }
  } catch (err) {
    _didIteratorError7 = true;
    _iteratorError7 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion7 && _iterator7.return) {
        _iterator7.return();
      }
    } finally {
      if (_didIteratorError7) {
        throw _iteratorError7;
      }
    }
  }
}

// System

module.exports = {
  Schema: Schema
};