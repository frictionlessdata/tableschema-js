'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _underscore = require('underscore');

var _ = _interopRequireWildcard(_underscore);

var _utilities = require('./utilities');

var utilities = _interopRequireWildcard(_utilities);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var moment = require('moment')
// FIXME: the order is manner, why? probably need to find better way to check
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

  if (this.field) {
    this.format = this.field.format;
    this.required = _.result(this.field.constraints, 'required') || false;
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
    if (!this.required && _.contains(_.flatten([null, utilities.NULL_VALUES]), value)) {
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

function StringType(field) {
  AbstractType.call(this, field);

  this.js = 'string';
  this.name = 'string';
  this.formats = ['default', 'email', 'uri', 'binary'];
  this.emailPattern = new RegExp('[^@]+@[^@]+\\.[^@]+');
  this.uriPattern = new RegExp('^http[s]?://');

  return this;
}

StringType.prototype = _.extend({}, AbstractType.prototype, {
  castEmail: function castEmail(value) {
    if (!this.typeCheck(value)) {
      return false;
    }

    if (!this.emailPattern.exec(value)) {
      return false;
    }
    return value;
  },
  castUri: function castUri(value) {
    if (!this.typeCheck(value)) {
      return false;
    }

    if (!this.uriPattern.exec(value)) {
      return false;
    }

    return value;
  },
  castBinary: function castBinary(value) {
    if (!this.typeCheck(value)) {
      return false;
    }

    try {
      return new Buffer(value, 'base64').toString();
    } catch (e) {
      return false;
    }
  },
  typeCheck: function typeCheck(value) {
    return typeof value === 'string';
  }
});

function IntegerType(field) {
  AbstractType.call(this, field);

  this.js = Number;
  this.name = 'integer';

  return this;
}

IntegerType.prototype = _.extend({}, AbstractType.prototype, {
  castDefault: function castDefault(value) {
    return Number(value) == value && value % 1 === 0;
  }
});

function NumberType(field) {
  AbstractType.call(this, field);

  this.js = Number;
  this.name = 'number';
  this.formats = ['default', 'currency'];

  return this;
}

NumberType.prototype = _.extend({}, AbstractType.prototype, {
  castDefault: function castDefault(value) {
    return Number(value) == value && value % 1 !== 0;
  },
  castCurrency: function castCurrency(value) {
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
});

function BooleanType(field) {
  AbstractType.call(this, field);

  this.js = Boolean;
  this.name = 'boolean';
  this.trueValues = utilities.TRUE_VALUES;
  this.falseValues = utilities.FALSE_VALUES;

  return this;
}

BooleanType.prototype = _.extend({}, AbstractType.prototype, {
  castDefault: function castDefault(value) {
    if (this.typeCheck(value)) {
      return true;
    }

    var v = value.trim().toLowerCase();

    return !!_.contains(_.union(this.trueValues, this.falseValues), v);
  }
});

function NullType(field) {
  AbstractType.call(this, field);

  this.name = 'null';
  this.nullValues = utilities.NULL_VALUES;

  return this;
}

NullType.prototype = _.extend({}, AbstractType.prototype, {
  castDefault: function castDefault(value) {
    if (_.isNull(value)) {
      return true;
    }
    var v = value.trim().toLowerCase();
    return !!_.contains(this.nullValues, v);
  }
});

function ArrayType(field) {
  AbstractType.call(this, field);

  this.js = Array;
  this.name = 'array';

  return this;
}

ArrayType.prototype = _.extend({}, AbstractType.prototype, {
  castDefault: function castDefault(value) {
    if (this.typeCheck(value)) {
      return true;
    }

    try {
      return this.typeCheck(JSON.parse(value));
    } catch (e) {
      return false;
    }
  }
});

function ObjectType(field) {
  AbstractType.call(this, field);

  this.js = Object;
  this.name = 'object';

  return this;
}

ObjectType.prototype = _.extend({}, AbstractType.prototype, {
  castDefault: function castDefault(value) {
    if (_.isObject(value) && !_.isArray(value) && !_.isFunction(value)) {
      return true;
    }

    try {
      return JSON.parse(value) instanceof this.js;
    } catch (e) {
      return false;
    }
  }
});

function DateType(field) {
  AbstractType.call(this, field);

  this.js = Object;
  this.name = 'date';
  this.formats = ['default', 'any', 'fmt'];
  this.ISO8601 = 'YYYY-MM-DD';

  return this;
}

DateType.prototype = _.extend({}, AbstractType.prototype, {
  castAny: function castAny(value) {
    var date = void 0;

    try {
      date = moment(new Date(value));
    } catch (e) {
      return false;
    }

    if (date.isValid()) {
      return date;
    }

    return false;
  },
  castDefault: function castDefault(value) {
    var date = void 0;

    try {
      date = moment(value, this.ISO8601, true);
    } catch (e) {
      return false;
    }

    if (date.isValid()) {
      return date;
    }

    return false;
  },
  castFmt: function castFmt(value) {
    var date = void 0;

    try {
      date = moment(value, this.format.replace(/^fmt:/, ''), true);
    } catch (e) {
      return false;
    }

    if (date.isValid()) {
      return date;
    }

    return false;
  }
});

function TimeType(field) {
  AbstractType.call(this, field);

  this.js = Object;
  this.name = 'time';
  this.formats = ['default', 'any', 'fmt'];

  return this;
}

TimeType.prototype = _.extend({}, DateType.prototype, {
  castDefault: function castDefault(value) {
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
});

function DateTimeType(field) {
  AbstractType.call(this, field);

  this.js = Object;
  this.name = 'datetime';
  this.formats = ['default', 'any', 'fmt'];
  this.ISO8601 = moment.ISO_8601;

  return this;
}

DateTimeType.prototype = _.extend({}, DateType.prototype);

function GeoPointType(field) {
  AbstractType.call(this, field);

  this.name = 'geopoint';
  this.formats = ['default', 'array', 'object'];

  return this;
}

GeoPointType.prototype = _.extend({}, AbstractType.prototype, {
  castDefault: function castDefault(value) {
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
  },
  castArray: function castArray() {
    throw new Error('Not implemented');
  },
  castObject: function castObject() {
    throw new Error('Not implemented');
  }

  // Geo point may be passed as string object with keys or array
  ,
  typeCheck: function typeCheck(value) {
    return _.isString(value) || _.isArray(value) || _.keys(value).length;
  }
});

function GeoJSONType(field) {
  AbstractType.call(this, field);

  this.js = Object;
  this.name = 'geojson';
  this.formats = ['default', 'topojson'];

  this.spec = {
    types: ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'GeometryCollection', 'Feature', 'FeatureCollection']
  };

  return this;
}

GeoJSONType.prototype = _.extend({}, AbstractType.prototype, {
  castDefault: GeoPointType.prototype.castDefault,

  castTopojson: function castTopojson() {
    throw new Error('Not implemented');
  }

  // Geo JSON is always an object
  ,
  typeCheck: function typeCheck(value) {
    return _.isObject(value) && !_.isFunction(value);
  }
});

function AnyType(field) {
  AbstractType.call(this, field);

  this.name = 'any';

  return this;
}

AnyType.prototype = _.extend({}, AbstractType.prototype, {
  cast: function cast() {
    return true;
  }
});

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
    return new exports[suitableType]().name;
  };

  this.cast = function cast(value) {
    try {
      return [new (_.find(availableTypes(), function (T) {
        return new exports[T](typeOptions[new exports[T]().name] || {}).cast(value);
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
      return exports[type];
    });
  }

  /**
   * Return types suitable to the provided multiple values
   *
   * @param values
   * @returns {Array}
   */
  function suitableTypes(values) {
    var _this = this;

    var filtered = values.filter(function (v) {
      return !_.isUndefined(v) || _.isEmpty(v);
    });

    if (filtered.length === 0) {
      return ['AnyType'];
    }

    var typeList = filtered.map(function (value) {
      return typeNames.filter(function (T) {
        var typeName = new exports[T]().name;
        return new exports[T](typeOptions[typeName] || {}).cast(value);
      }, _this);
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

exports = module.exports = {
  AnyType: AnyType,
  StringType: StringType,
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
  TypeGuesser: TypeGuesser
};
//# sourceMappingURL=types.js.map