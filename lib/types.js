'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _underscore = require('underscore');

var _ = _interopRequireWildcard(_underscore);

var _utilities = require('./utilities');

var _utilities2 = _interopRequireDefault(_utilities);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var moment = require('moment')
// FIXME: the order is matter, why? probably need to find better way to check
// what type of the current value is
,
    typeNames = ['BooleanType', 'IntegerType', 'NullType', 'DateType', 'TimeType', 'DateTimeType', 'ArrayType', 'ObjectType', 'GeoPointType', 'GeoJSONType', 'NumberType', 'StringType', 'AnyType'];

function AbstractType(field) {
  this.js = _typeof(null);
  this.name = '';
  this.format = 'default';
  this.required = true;
  this.formats = ['default'];

  // `field` is the field schema.
  this.field = field;

  if (field) {
    this.format = field.format;
    this.required = !!_.result(field.constraints, 'required');
  }
  return this;
}

AbstractType.prototype = {
  /**
   * Check if `value` can be cast as type `this.js`
   *
   * @param value
   * @returns {Boolean}
   */

  cast: function cast(value) {
    var format = void 0;

    // We can check on `constraints.required` before we cast
    if (!this.required && _.contains(_.flatten([null, _utilities2.default.NULL_VALUES]), value)) {
      return true;
    } else if (this.required && _.contains([null, undefined, ''], value)) {
      return false;
    }

    // Cast with the appropriate handler, falling back to default if none
    if (!this.format) {
      format = 'default';
    } else {
      if (this.format.indexOf('fmt') === 0) {
        format = 'fmt';
      } else {
        format = this.format;
      }
    }

    var handler = 'cast' + String(format.charAt(0).toUpperCase() + format.substring(1));

    if (this.hasFormat(format) && this[handler]) {
      return this[handler](value);
    }

    return this.castDefault(value);
  }
  /**
   * Check if the value can be cast to the type/format
   *
   * @param value
   * @returns {Boolean}
   */
  ,
  castDefault: function castDefault(value) {
    if (this.typeCheck(value)) {
      return true;
    }

    try {
      if (_.isFunction(this.js)) {
        return this.js(value);
      }
    } catch (e) {
      return false;
    }
    return false;
  },
  hasFormat: function hasFormat(format) {
    return !!_.contains(this.formats, format);
  }
  /**
   * Type check of value
   *
   * @param value
   * @returns {boolean}
   */
  ,
  typeCheck: function typeCheck(value) {
    return !!(value instanceof this.js);
  }
};

var Abstract = function () {
  function Abstract(field) {
    _classCallCheck(this, Abstract);

    this.js = _typeof(null);
    this.name = '';
    this.format = 'default';
    this.required = true;
    this.formats = ['default'];

    // `field` is the field schema.
    this.field = field;

    if (field) {
      this.format = field.format;
      this.required = !!_.result(field.constraints, 'required');
    }
  }

  /**
   * Check if `value` can be cast as type `this.js`
   *
   * @param value
   * @returns {Boolean}
   */


  _createClass(Abstract, [{
    key: 'cast',
    value: function cast(value) {
      var format = void 0;

      // We can check on `constraints.required` before we cast
      if (!this.required && _.contains(_.flatten([null, _utilities2.default.NULL_VALUES]), value)) {
        return true;
      } else if (this.required && _.contains([null, undefined, ''], value)) {
        return false;
      }

      // Cast with the appropriate handler, falling back to default if none
      if (!this.format) {
        format = 'default';
      } else {
        if (this.format.indexOf('fmt') === 0) {
          format = 'fmt';
        } else {
          format = this.format;
        }
      }

      var handler = 'cast' + String(format.charAt(0).toUpperCase() + format.substring(1));

      if (this.hasFormat(format) && this[handler]) {
        return this[handler](value);
      }

      return this.castDefault(value);
    }

    /**
     * Check if the value can be cast to the type/format
     *
     * @param value
     * @returns {Boolean}
     */

  }, {
    key: 'castDefault',
    value: function castDefault(value) {
      if (this.typeCheck(value)) {
        return true;
      }

      try {
        if (_.isFunction(this.js)) {
          return this.js(value);
        }
      } catch (e) {
        return false;
      }
      return false;
    }
  }, {
    key: 'hasFormat',
    value: function hasFormat(format) {
      return !!_.contains(this.formats, format);
    }

    /**
     * Type check of value
     *
     * @param value
     * @returns {boolean}
     */

  }, {
    key: 'typeCheck',
    value: function typeCheck(value) {
      return !!(value instanceof this.js);
    }
  }]);

  return Abstract;
}();

var StringType = function (_Abstract) {
  _inherits(StringType, _Abstract);

  function StringType(field) {
    _classCallCheck(this, StringType);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(StringType).call(this, field));

    _this.js = 'string';
    _this.name = 'string';
    _this.formats = ['default', 'email', 'uri', 'binary'];
    _this.emailPattern = new RegExp('[^@]+@[^@]+\\.[^@]+');
    _this.uriPattern = new RegExp('^http[s]?://');
    return _this;
  }

  _createClass(StringType, [{
    key: 'castEmail',
    value: function castEmail(value) {
      if (!this.typeCheck(value)) {
        return false;
      }

      if (!this.emailPattern.exec(value)) {
        return false;
      }
      return value;
    }
  }, {
    key: 'castUri',
    value: function castUri(value) {
      if (!this.typeCheck(value)) {
        return false;
      }

      if (!this.uriPattern.exec(value)) {
        return false;
      }

      return value;
    }
  }, {
    key: 'castBinary',
    value: function castBinary(value) {
      if (!this.typeCheck(value)) {
        return false;
      }

      try {
        return new Buffer(value, 'base64').toString();
      } catch (e) {
        return false;
      }
    }
  }, {
    key: 'typeCheck',
    value: function typeCheck(value) {
      return typeof value === 'string';
    }
  }]);

  return StringType;
}(Abstract);

var IntegerType = function (_Abstract2) {
  _inherits(IntegerType, _Abstract2);

  function IntegerType(field) {
    _classCallCheck(this, IntegerType);

    var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(IntegerType).call(this, field));

    _this2.js = Number;
    _this2.name = 'integer';
    return _this2;
  }

  _createClass(IntegerType, [{
    key: 'castDefault',
    value: function castDefault(value) {
      return Number(value) == value && value % 1 === 0;
    }
  }]);

  return IntegerType;
}(Abstract);

var NumberType = function (_Abstract3) {
  _inherits(NumberType, _Abstract3);

  function NumberType(field) {
    _classCallCheck(this, NumberType);

    var _this3 = _possibleConstructorReturn(this, Object.getPrototypeOf(NumberType).call(this, field));

    _this3.js = Number;
    _this3.name = 'number';
    _this3.formats = ['default', 'currency'];
    return _this3;
  }

  _createClass(NumberType, [{
    key: 'castDefault',
    value: function castDefault(value) {
      return Number(value) == value && value % 1 !== 0;
    }
  }, {
    key: 'castCurrency',
    value: function castCurrency(value) {
      var v = String(value).replace(new RegExp('[.,;$€]', 'g'), '');

      // parseFloat() parse string even if there are non-digit characters
      if (new RegExp('[^\\d]+', 'g').exec(v)) {
        return false;
      }

      try {
        return isFinite(parseFloat(v));
      } catch (e) {
        return false;
      }
    }
  }]);

  return NumberType;
}(Abstract);

var BooleanType = function (_Abstract4) {
  _inherits(BooleanType, _Abstract4);

  function BooleanType(field) {
    _classCallCheck(this, BooleanType);

    var _this4 = _possibleConstructorReturn(this, Object.getPrototypeOf(BooleanType).call(this, field));

    _this4.js = Boolean;
    _this4.name = 'boolean';
    _this4.trueValues = _utilities2.default.TRUE_VALUES;
    _this4.falseValues = _utilities2.default.FALSE_VALUES;
    return _this4;
  }

  _createClass(BooleanType, [{
    key: 'castDefault',
    value: function castDefault(value) {
      if (this.typeCheck(value)) {
        return true;
      }

      var v = String(value).trim().toLowerCase();

      return !!_.contains(_.union(this.trueValues, this.falseValues), v);
    }
  }]);

  return BooleanType;
}(Abstract);

var NullType = function (_Abstract5) {
  _inherits(NullType, _Abstract5);

  function NullType(field) {
    _classCallCheck(this, NullType);

    var _this5 = _possibleConstructorReturn(this, Object.getPrototypeOf(NullType).call(this, field));

    _this5.name = 'null';
    _this5.nullValues = _utilities2.default.NULL_VALUES;
    return _this5;
  }

  _createClass(NullType, [{
    key: 'castDefault',
    value: function castDefault(value) {
      if (_.isNull(value)) {
        return true;
      }
      var v = value.trim().toLowerCase();
      return !!_.contains(this.nullValues, v);
    }
  }]);

  return NullType;
}(Abstract);

var ArrayType = function (_Abstract6) {
  _inherits(ArrayType, _Abstract6);

  function ArrayType(field) {
    _classCallCheck(this, ArrayType);

    var _this6 = _possibleConstructorReturn(this, Object.getPrototypeOf(ArrayType).call(this, field));

    _this6.js = Array;
    _this6.name = 'array';
    return _this6;
  }

  _createClass(ArrayType, [{
    key: 'castDefault',
    value: function castDefault(value) {
      if (this.typeCheck(value)) {
        return true;
      }

      try {
        return this.typeCheck(JSON.parse(value));
      } catch (e) {
        return false;
      }
    }
  }]);

  return ArrayType;
}(Abstract);

var ObjectType = function (_Abstract7) {
  _inherits(ObjectType, _Abstract7);

  function ObjectType(field) {
    _classCallCheck(this, ObjectType);

    var _this7 = _possibleConstructorReturn(this, Object.getPrototypeOf(ObjectType).call(this, field));

    _this7.js = Object;
    _this7.name = 'object';
    return _this7;
  }

  _createClass(ObjectType, [{
    key: 'castDefault',
    value: function castDefault(value) {
      if (_.isObject(value) && !_.isArray(value) && !_.isFunction(value)) {
        return true;
      }

      try {
        return JSON.parse(value) instanceof this.js;
      } catch (e) {
        return false;
      }
    }
  }]);

  return ObjectType;
}(Abstract);

var DateType = function (_Abstract8) {
  _inherits(DateType, _Abstract8);

  function DateType(field) {
    _classCallCheck(this, DateType);

    var _this8 = _possibleConstructorReturn(this, Object.getPrototypeOf(DateType).call(this, field));

    _this8.js = Object;
    _this8.name = 'date';
    _this8.formats = ['default', 'any', 'fmt'];
    _this8.ISO8601 = 'YYYY-MM-DD';
    return _this8;
  }

  _createClass(DateType, [{
    key: 'castAny',
    value: function castAny(value) {
      var date = void 0;

      try {
        date = moment(new Date(value));

        if (date.isValid()) {
          return date;
        }
      } catch (e) {
        return false;
      }
      return false;
    }
  }, {
    key: 'castDefault',
    value: function castDefault(value) {
      var date = void 0;

      try {
        date = moment(value, this.ISO8601, true);

        if (date.isValid()) {
          return date;
        }
      } catch (e) {
        return false;
      }
      return false;
    }
  }, {
    key: 'castFmt',
    value: function castFmt(value) {
      var date = void 0;

      try {
        date = moment(value, this.format.replace(/^fmt:/, ''), true);

        if (date.isValid()) {
          return date;
        }
      } catch (e) {
        return false;
      }
      return false;
    }
  }]);

  return DateType;
}(Abstract);

var TimeType = function (_DateType) {
  _inherits(TimeType, _DateType);

  function TimeType(field) {
    _classCallCheck(this, TimeType);

    var _this9 = _possibleConstructorReturn(this, Object.getPrototypeOf(TimeType).call(this, field));

    _this9.js = Object;
    _this9.name = 'time';
    _this9.formats = ['default', 'any', 'fmt'];
    return _this9;
  }

  _createClass(TimeType, [{
    key: 'castDefault',
    value: function castDefault(value) {
      var date = void 0;

      try {
        date = moment(value, 'HH:mm:ss', true);
      } catch (e) {
        return false;
      }

      if (date.isValid()) {
        return date;
      }

      return false;
    }
  }]);

  return TimeType;
}(DateType);

var DateTimeType = function (_DateType2) {
  _inherits(DateTimeType, _DateType2);

  function DateTimeType(field) {
    _classCallCheck(this, DateTimeType);

    var _this10 = _possibleConstructorReturn(this, Object.getPrototypeOf(DateTimeType).call(this, field));

    _this10.js = Object;
    _this10.name = 'datetime';
    _this10.formats = ['default', 'any', 'fmt'];
    _this10.ISO8601 = moment.ISO_8601;
    return _this10;
  }

  return DateTimeType;
}(DateType);

var GeoPointType = function (_Abstract9) {
  _inherits(GeoPointType, _Abstract9);

  function GeoPointType(field) {
    _classCallCheck(this, GeoPointType);

    var _this11 = _possibleConstructorReturn(this, Object.getPrototypeOf(GeoPointType).call(this, field));

    _this11.name = 'geopoint';
    _this11.formats = ['default', 'array', 'object'];
    return _this11;
  }

  _createClass(GeoPointType, [{
    key: 'castDefault',
    value: function castDefault(value) {
      if (!this.typeCheck(value)) {
        return false;
      }

      if (_.isString(value)) {
        return value.split(',').length === 2;
      }

      if (_.isObject(value)) {
        return value;
      }

      try {
        return JSON.parse(value);
      } catch (e) {
        return false;
      }
    }
  }, {
    key: 'castArray',
    value: function castArray() {
      throw new Error('Not implemented');
    }
  }, {
    key: 'castObject',
    value: function castObject() {
      throw new Error('Not implemented');
    }

    // Geo point may be passed as string object with keys or array

  }, {
    key: 'typeCheck',
    value: function typeCheck(value) {
      return _.isString(value) || _.isArray(value) || _.keys(value).length;
    }
  }]);

  return GeoPointType;
}(Abstract);

var GeoJSONType = function (_GeoPointType) {
  _inherits(GeoJSONType, _GeoPointType);

  function GeoJSONType(field) {
    _classCallCheck(this, GeoJSONType);

    var _this12 = _possibleConstructorReturn(this, Object.getPrototypeOf(GeoJSONType).call(this, field));

    _this12.js = Object;
    _this12.name = 'geojson';
    _this12.formats = ['default', 'topojson'];

    _this12.spec = {
      types: ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'GeometryCollection', 'Feature', 'FeatureCollection']
    };
    return _this12;
  }

  _createClass(GeoJSONType, [{
    key: 'castDefault',
    value: function castDefault(value) {
      return _get(Object.getPrototypeOf(GeoJSONType.prototype), 'castDefault', this).call(this, value);
    }
  }, {
    key: 'castTopojson',
    value: function castTopojson() {
      throw new Error('Not implemented');
    }

    // Geo JSON is always an object

  }, {
    key: 'typeCheck',
    value: function typeCheck(value) {
      return _.isObject(value) && !_.isFunction(value);
    }
  }]);

  return GeoJSONType;
}(GeoPointType);

var AnyType = function (_Abstract10) {
  _inherits(AnyType, _Abstract10);

  function AnyType(field) {
    _classCallCheck(this, AnyType);

    var _this13 = _possibleConstructorReturn(this, Object.getPrototypeOf(AnyType).call(this, field));

    _this13.name = 'any';
    return _this13;
  }

  _createClass(AnyType, [{
    key: 'cast',
    value: function cast() {
      return true;
    }
  }]);

  return AnyType;
}(Abstract);

var Types = {
  IntegerType: IntegerType,
  NumberType: NumberType,
  BooleanType: BooleanType,
  NullType: NullType,
  ArrayType: ArrayType,
  ObjectType: ObjectType,
  DateType: DateType,
  TimeType: TimeType,
  DateTimeType: DateTimeType,
  GeoPointType: GeoPointType,
  GeoJSONType: GeoJSONType,
  TypeGuesser: TypeGuesser,
  AnyType: AnyType,
  StringType: StringType
};

/**
 * Guess the type for a value
 *
 * @param options - TODO add description
 */
function TypeGuesser(options) {
  var typeOptions = options || {};

  this.multiCast = function multiCast(values) {
    var types = suitableTypes(values),
        suitableType = _.find(typeNames, function (type) {
      return _.indexOf(types, type) !== -1;
    });
    return new Types[suitableType]().name;
  };

  this.cast = function cast(value) {
    try {
      return [new (_.find(availableTypes(), function (T) {
        return new Types[T](typeOptions[new Types[T]().name] || {}).cast(value);
      }))().name, 'default'];
    } catch (e) {
      return null;
    }
  };

  return this;

  /**
   * Return available types objects
   *
   * @returns {Array}
   */
  function availableTypes() {
    return typeNames.map(function (type) {
      return Types[type];
    });
  }

  /**
   * Return types suitable to the provided multiple values
   *
   * @param values
   * @returns {Array}
   */
  function suitableTypes(values) {
    var _this14 = this;

    var filtered = values.filter(function (v) {
      return !_.isUndefined(v) || _.isEmpty(v);
    });

    if (filtered.length === 0) {
      return ['AnyType'];
    }

    var typeList = filtered.map(function (value) {
      return typeNames.filter(function (T) {
        var typeName = new Types[T]().name;
        return new Types[T](typeOptions[typeName] || {}).cast(value);
      }, _this14);
    });
    return _.reduce(typeList, function (memo, types) {
      return _.intersection(memo, types);
    });
  }
}

function TypeResolver() {
  return this;
}

TypeResolver.prototype = {
  get: function get(results) {
    var counts = {},
        variants = _.uniq(results);

    // Only one candidate... that's easy.
    if (variants.length === 1) {
      return { type: results[0][0], format: results[0][1] };
    }

    results.forEach(function (result) {
      counts[result] = (counts[result] || 0) + 1;
    });

    // Tuple representation of  `counts`  dict, sorted  by  values  of
    // `counts`
    var sortedCounts = _.sortBy(_.pairs(counts), function (cnt) {
      return cnt[1];
    }).reverse();

    return {
      type: sortedCounts[0][0].split(',')[0],
      format: sortedCounts[0][0].split(',')[1]
    };
  }
};

exports.default = Types;
//# sourceMappingURL=types.js.map