'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _underscore = require('underscore');

var _bluebird = require('bluebird');

var _ensure = require('./ensure');

var _ensure2 = _interopRequireDefault(_ensure);

var _utilities = require('./utilities');

var _utilities2 = _interopRequireDefault(_utilities);

var _types = require('./types');

var _types2 = _interopRequireDefault(_types);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEFAULTS = {
  constraints: { required: true },
  format: 'default',
  type: 'string'
};
/**
 * Model for a JSON Table Schema.
 *
 * Providers handy helpers for ingesting, validating and outputting
 * JSON Table Schemas: http://dataprotocols.org/json-table-schema/
 *
 * @param {string|dict} source: A filepath, url or dictionary that represents a
 *   schema
 *
 * @param {boolean} caseInsensitiveHeaders: if True, headers should be
 * considered case insensitive, and `SchemaModel` forces all
 * headers to lowercase when they are represented via a model
 * instance. This setting **does not** mutate the actual strings
 * that come from the the input schema source, so out put methods
 * such as as_python and as_json are **not** subject to this flag.
 */

var SchemaModel = function () {
  function SchemaModel(source) {
    var caseInsensitiveHeaders = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

    _classCallCheck(this, SchemaModel);

    this.source = source;
    this.caseInsensitiveHeaders = caseInsensitiveHeaders;

    var asJs = this.toJs();

    // Manually use .loadSource() to get schema in case of URL passed instead of
    // schema
    if (asJs instanceof _bluebird.Promise) {
      this.schemaPromise = asJs;
    } else {
      this.validateAndExpand(asJs);
    }
  }

  /**
   * Check if value can be cast to fieldName's type
   *
   * @param fieldName
   * @param value
   * @param index
   *
   * @returns {Boolean}
   */


  _createClass(SchemaModel, [{
    key: 'cast',
    value: function cast(fieldName, value, index) {
      return this.getType(fieldName, index || 0).cast(value);
    }

    /**
     * Expand the schema with additional default properties
     *
     * @param schema
     * @returns {*}
     */

  }, {
    key: 'expand',
    value: function expand(schema) {
      return _underscore._.extend(schema, {
        fields: (schema.fields || []).map(function (field) {
          var copyField = _underscore._.extend({}, field);

          // Ensure we have a default type if no type was declared
          if (!copyField.type) {
            copyField.type = DEFAULTS.type;
          }

          // Ensure we have a default format if no format was
          // declared
          if (!copyField.format) {
            copyField.format = DEFAULTS.format;
          }

          // Ensure we have a minimum constraints declaration
          if (!copyField.constraints) {
            copyField.constraints = DEFAULTS.constraints;
          } else if (_underscore._.isUndefined(field.constraints.required)) {
            copyField.constraints.required = DEFAULTS.constraints.required;
          }
          return copyField;
        })
      });
    }
  }, {
    key: 'fields',
    value: function fields() {
      return this.asJs.fields;
    }
  }, {
    key: 'foreignKeys',
    value: function foreignKeys() {
      return this.asJs.foreignKeys;
    }

    /**
     * Return the `constraints` object for `fieldName`.
     * @param {string} fieldName
     * @param {integer} index
     * @returns {object}
     */

  }, {
    key: 'getConstraints',
    value: function getConstraints(fieldName) {
      var index = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

      return this.getField(fieldName, index).constraints;
    }

    // Return the `field` object for `fieldName`.
    // `index` allows accessing a field name by position, as JTS allows
    // duplicate field names.

  }, {
    key: 'getField',
    value: function getField(fieldName) {
      var index = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

      try {
        return _underscore._.where(this.fields(), { name: fieldName })[index];
      } catch (e) {
        return null;
      }
    }

    // Return all fields that match the given type.

  }, {
    key: 'getFieldsByType',
    value: function getFieldsByType(typeName) {
      return _underscore._.where(this.fields(), { type: typeName });
    }

    // Return the `type` for `fieldName`.

  }, {
    key: 'getType',
    value: function getType(fieldName, index) {
      var field = this.getField(fieldName, index || 0);
      return this.typeMap[field.type](field);
    }

    /**
     * Check if the field exists in the schema
     *
     * @param fieldName
     * @returns {boolean}
     */

  }, {
    key: 'hasField',
    value: function hasField(fieldName) {
      return Boolean(this.getField(fieldName));
    }
  }, {
    key: 'headers',
    value: function headers() {
      var raw = _underscore._.chain(this.asJs.fields).map(_underscore._.property('name')).value();

      if (this.caseInsensitiveHeaders) {
        return _underscore._.invoke(raw, 'toLowerCase');
      }
      return raw;
    }

    // Load schema from URL passed in init

  }, {
    key: 'loadSchema',
    value: function loadSchema() {
      return this.schemaPromise.then(this.validateAndExpand);
    }
  }, {
    key: 'primaryKey',
    value: function primaryKey() {
      return this.asJs.primaryKey;
    }
  }, {
    key: 'requiredHeaders',
    value: function requiredHeaders() {
      var raw = _underscore._.chain(this.asJs.fields).filter(function (field) {
        return field.constraints.required;
      }).map(_underscore._.property('name')).value();

      if (this.caseInsensitiveHeaders) {
        return _underscore._.invoke(raw, 'toLowerCase');
      }

      return raw;
    }

    // Return schema as an Object.

  }, {
    key: 'toJs',
    value: function toJs() {
      try {
        return _utilities2.default.loadJSONSource(this.source);
      } catch (e) {
        return null;
      }
    }

    /**
     * Map a JSON Table Schema type to a JTSKit type class
     */

  }, {
    key: 'validateAndExpand',
    value: function validateAndExpand(value) {
      if (_underscore._.isUndefined(value) || _underscore._.isNull(value)) {
        throw new Error('Invalid JSON');
      }

      if (!(0, _ensure2.default)(value)[0]) {
        throw new Error('Invalid schema');
      }

      this.asJs = this.expand(value);

      return this;
    }
  }, {
    key: 'typeMap',
    get: function get() {
      return {
        string: _types2.default.StringType,
        number: _types2.default.NumberType,
        integer: _types2.default.IntegerType,
        boolean: _types2.default.BooleanType,
        null: _types2.default.NullType,
        array: _types2.default.ArrayType,
        object: _types2.default.ObjectType,
        date: _types2.default.DateType,
        time: _types2.default.TimeType,
        datetime: _types2.default.DateTimeType,
        geopoint: _types2.default.GeoPointType,
        geojson: _types2.default.GeoJSONType,
        any: _types2.default.AnyType
      };
    }
  }]);

  return SchemaModel;
}();

exports.default = SchemaModel;
//# sourceMappingURL=models.js.map