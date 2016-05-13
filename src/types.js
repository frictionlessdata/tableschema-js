'use strict'

const _ = require('underscore')
  , moment = require('moment')
  , utilities = require('./utilities')

exports = module.exports = {}

exports.JSType = function JSType(field) {
  this.js = typeof null
  this.name = ''
  this.formats = ['default']

  // `field` is the field schema.
  this.field = field

  if (this.field) {
    this.format = this.field.format
    this.required = _.result(this.field.constraints, 'required') || false
  } else {
    this.format = 'default'
    this.required = true
  }
  return this
}

exports.JSType.prototype = {
  /**
   * Check if `value` can be cast as type `this.js`
   *
   * @param value
   * @returns {Boolean}
   */
  cast(value) {
    let format

    // We can check on `constraints.required` before we cast
    if (!this.required &&
        _.contains(_.flatten([null, utilities.NULL_VALUES]), value)) {
      return true
    } else if (this.required && _.contains([null, undefined, ''], value)) {
      return false
    }

    // Cast with the appropriate handler, falling back to default if none
    if (!this.format) {
      format = 'default'
    } else {
      if (!this.format || this.format.indexOf('fmt') === 0) {
        format = 'fmt'
      } else {
        format = this.format
      }
    }

    const handler = `cast${format.charAt(0).toUpperCase() +
                           format.substring(1)}`

    if (this.hasFormat(format) && this[handler]) {
      return this[handler](value)
    }

    return this.castDefault(value)
  }
  /**
   * Check if the value can be cast to the type/format
   *
   * @param value
   * @returns {Boolean}
   */
  , castDefault(value) {
    if (this.typeCheck(value)) {
      return true
    }

    try {
      if (_.isFunction(this.js)) {
        return this.js(value)
      }
    } catch (e) {
      return false
    }
    return false
  }
  , hasFormat(_format) {
    return !!_.contains(this.formats, _format)
  }
  /**
   * Type check of value
   *
   * @param value
   * @returns {boolean}
   */
  , typeCheck(value) {
    return !!(value instanceof this.js)
  }
}

exports.StringType = function StringType(field) {
  exports.JSType.call(this, field)

  this.js = 'string'
  this.name = 'string'
  this.formats = ['default', 'email', 'uri', 'binary']
  this.emailPattern = new RegExp('[^@]+@[^@]+\\.[^@]+')
  this.uriPattern = new RegExp('^http[s]?://')

  return this
}

exports.StringType.prototype =
  _.extend(
    exports.StringType.prototype,
    exports.JSType.prototype,
    {
      castEmail(value) {
        if (!this.typeCheck(value)) {
          return false
        }

        if (!this.emailPattern.exec(value)) {
          return false
        }
        return value
      }
      , castUri(value) {
      if (!this.typeCheck(value)) {
        return false
      }

      if (!this.uriPattern.exec(value)) {
        return false
      }

      return value
    }
      , castBinary(value) {
      if (!this.typeCheck(value)) {
        return false
      }

      try {
        return (new Buffer(value, 'base64')).toString()
      } catch (e) {
        return false
      }
    }
      , typeCheck(value) {
      return typeof value === 'string'
    }
    }
  )

exports.IntegerType = function IntegerType(field, options) {
  exports.JSType.call(this, field, options)
  this.js = Number
  this.name = 'integer'

  return this
}

exports.IntegerType.prototype =
  _.extend(
    exports.IntegerType.prototype
    , exports.JSType.prototype
    , {
      castDefault(value) {
        if (this.typeCheck(value)) {
          return true
        }

        try {
          const x = parseInt(value, 10)
          return (isFinite(+value) && isFinite(x) && (+value === x))
        } catch (e) {
          return false
        }
      }
    })

exports.NumberType = function NumberType(field, options) {
  exports.JSType.call(this, field, options)

  this.js = Number
  this.name = 'number'
  this.formats = ['default', 'currency']
  this.separators = ',;$'

  return this
}

exports.NumberType.prototype =
  _.extend(
    exports.NumberType.prototype
    , exports.JSType.prototype
    , {
      castDefault(value) {
        if (this.typeCheck(value)) {
          return true
        }

        try {
          if (isFinite(+value) && isFinite(parseFloat(value))) {
            return true
          }
        } catch (e) {
          return false
        }
        return false
      }
      , castCurrency(value) {
        if (this.typeCheck(value)) {
          return true
        }

        const v = String(value)
          .replace(new RegExp(`[${this.separators}]`, 'g'), '')

        // parseFloat() parse string even if there are non-digit characters
        if ((new RegExp('[^\\d]+', 'g')).exec(v)) {
          return false
        }

        try {
          return isFinite(parseFloat(v))
        } catch (e) {
          return false
        }
      }
    })

exports.BooleanType = function (field, options) {
  exports.JSType.call(this, field, options)

  this.js = Boolean
  this.name = 'boolean'
  this.trueValues = utilities.TRUE_VALUES
  this.falseValues = utilities.FALSE_VALUES

  return this
}

exports.BooleanType.prototype =
  _.extend(exports.BooleanType.prototype,
           exports.JSType.prototype, {
             castDefault: function (value) {
               if (this.typeCheck(value)) {
                 return true
               }

               value = value.trim().toLowerCase()

               return !!_.contains(_.union(this.trueValues, this.falseValues),
                                   value)
             }
           })

exports.NullType = function (field, options) {
  exports.JSType.call(this, field, options)

  this.name = 'null'
  this.nullValues = utilities.NULL_VALUES

  return this
}

exports.NullType.prototype =
  _.extend(
    exports.NullType.prototype
    , exports.JSType.prototype
    , {
      castDefault: function (value) {
        if (_.isNull(value)) {
          return true
        }
        value = value.trim().toLowerCase()

        return !!_.contains(this.nullValues, value)
      }
    })

exports.ArrayType = function (field, options) {
  exports.JSType.call(this, field, options)

  this.js = Array
  this.name = 'array'

  return this
}

exports.ArrayType.prototype =
  _.extend(
    exports.ArrayType.prototype
    , exports.JSType.prototype
    , {
      castDefault: function (value) {
        if (this.typeCheck(value)) {
          return true
        }

        try {
          value = JSON.parse(value)
          return this.typeCheck(value)
        } catch (e) {
          return false
        }
      }
    })

exports.ObjectType = function (field, options) {
  exports.JSType.call(this, field, options);
  this.js = Object;
  this.name = 'object';
  return this;
}

exports.ObjectType.prototype =
  _.extend(exports.ObjectType.prototype, exports.JSType.prototype,
           {
             castDefault: function (value) {
               if (_.isObject(value) && !_.isArray(value) &&
                   !_.isFunction(value)) {
                 return true;
               }

               try {
                 value = JSON.parse(value);
                 return value instanceof this.js;
               } catch (E) {
                 return false;
               }
             }
           });

exports.DateType = function (field, options) {
  exports.JSType.call(this, field, options);
  this.js = Object;
  this.name = 'date';
  this.formats = ['default', 'any', 'fmt'];
  this.ISO8601 = 'YYYY-MM-DD';
  return this;
}

exports.DateType.prototype =
  _.extend(exports.DateType.prototype, exports.JSType.prototype, {
    castAny: function (value) {
      var date;

      try {
        date = moment(new Date(value));
      } catch (E) {
        return false;
      }

      if (date.isValid()) {
        return date;
      }

      return false;
    },

    castDefault: function (value) {
      var date;

      try {
        date = moment(value, this.ISO8601, true);
      } catch (E) {
        return false;
      }

      if (date.isValid()) {
        return date;
      }

      return false;
    },

    castFmt: function (value) {
      var date;

      try {
        date = moment(value, this.format.replace(/^fmt:/, ''), true);
      } catch (E) {
        return false;
      }

      if (date.isValid()) {
        return date;
      }

      return false;
    }
  });

exports.TimeType = function (field, options) {
  exports.JSType.call(this, field, options);
  this.js = Object;
  this.name = 'time';
  this.formats = ['default', 'any', 'fmt'];
  return this;
}

exports.TimeType.prototype =
  _.extend(exports.TimeType.prototype, exports.DateType.prototype,
           {
             castDefault: function (value) {
               var date;

               try {
                 date = moment(value, 'HH:mm:ss', true);
               } catch (E) {
                 return false;
               }

               if (date.isValid()) {
                 return date;
               }

               return false;
             },
           });

exports.DateTimeType = function (field, options) {
  exports.JSType.call(this, field, options);
  this.js = Object;
  this.name = 'datetime';
  this.formats = ['default', 'any', 'fmt'];
  this.ISO8601 = moment.ISO_8601;
  return this;
}

exports.DateTimeType.prototype =
  _.extend(exports.DateTimeType.prototype,
           exports.DateType.prototype);

exports.GeoPointType = function (field, options) {
  exports.JSType.call(this, field, options);
  this.name = 'geopoint';
  this.formats = ['default', 'array', 'object'];
  return this;
}

exports.GeoPointType.prototype =
  _.extend(exports.GeoPointType.prototype,
           exports.JSType.prototype, {
             castDefault: function (value) {
               if (!this.typeCheck(value)) {
                 return false
               }

               if (_.isString(value)) {
                 return value.split(',').length === 2;
               }

               if (_.isObject(value)) {
                 return value;
               }

               try {
                 return JSON.parse(value);
               } catch (E) {
                 return false;
               }

               return false;
             },

             castArray: function (value) {
               throw new Error('Not implemented');
             },
             castObject: function (value) {
               throw new Error('Not implemented');
             },

             // Geo point may be passed as string object with keys or array
             typeCheck: function (value) {
               return _.isString(value) || _.isArray(value) ||
                      _.keys(value).length;
             }
           });

exports.GeoJSONType = function (field, options) {
  exports.JSType.call(this, field, options);
  this.js = Object;
  this.name = 'geojson';
  this.formats = ['default', 'topojson'];

  this.spec = {
    'types': [
      'Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon',
      'MultiPolygon',
      'GeometryCollection', 'Feature', 'FeatureCollection'
    ]
  };

  return this;
}

exports.GeoJSONType.prototype =
  _.extend(exports.GeoJSONType.prototype,
           exports.JSType.prototype, {
             castDefault: exports.GeoPointType.prototype.castDefault,

             castTopojson: function (value) {
               throw new Error('Not implemented');
             },

             // Geo JSON is always an object
             typeCheck: function (value) {
               return _.isObject(value) && !_.isFunction(value);
             }
           });

exports.AnyType = function (field, options) {
  exports.JSType.call(this, field, options);
  this.name = 'any';
  return this;
}

exports.AnyType.prototype =
  _.extend(exports.AnyType.prototype, exports.JSType.prototype, {
    cast: function (value) {
      return true;
    }
  });

function availableTypeNames() {
  return [
    'AnyType'
    , 'StringType'
    , 'BooleanType'
    , 'NumberType'
    , 'IntegerType'
    , 'NullType'
    , 'DateType'
    , 'TimeType'
    , 'DateTimeType'
    , 'ArrayType'
    , 'ObjectType'
    , 'GeoPointType'
    , 'GeoJSONType'
  ]
}

/**
 * Return available types objects
 *
 * @returns {Array|Object|*}
 */
function availableTypes() {
  return (availableTypeNames()).map((type) => {
    return module.exports[type]
  })
}

/**
 * Guess the type for a value
 *
 * @param typeOptions - TODO add description
 *
 * @returns {object} A tuple  of ('type', 'format')
 */
exports.TypeGuesser = function (typeOptions) {
  this.typeOptions = typeOptions || {}
  return this
}

exports.TypeGuesser.prototype.suitableTypes = function (values) {
  values = _.filter(values, (value) => {
    return !(_.isUndefined(value) || _.isEmpty(value))
  })

  if (values.length === 0) {
    return ['AnyType']
  }

  let possibleTypeList = _.map(values, (function (value) {
    return _.filter(availableTypeNames().reverse(), (function (T) {
      try {
        return (
          new module.exports[T](this.typeOptions[(new module.exports[T]()).name] ||
            {})
        ).cast(value)
      } catch (e) {
        return false
      }
    }).bind(this))
  }).bind(this))

  return _.reduce(possibleTypeList, (memo, types) => {
    return _.intersection(memo, types)
  })
}

exports.TypeGuesser.prototype.multicast = function (values) {
  let types = this.suitableTypes(values)
    , suitableType = _.find(availableTypeNames().reverse(), (
    (type) => {
      return _.indexOf(types, type) >= 0
    }))
  return (new module.exports[suitableType]()).name
}

exports.TypeGuesser.prototype.cast = function (value) {
  try {
    return [
      (new (_.find(availableTypes().reverse(), (function (T) {
        return (
          new T(this.typeOptions[(new T()).name] || {})
        ).cast(value);
      }).bind(this)))()).name,
      'default'
    ];
  } catch (E) {
    return null;
  }
}

exports.TypeResolver = function () {
  return this;
}

exports.TypeResolver.prototype.get = function (results) {
  var counts = {};
  var variants = _.uniq(results);

  // Only one candidate... that's easy.
  if (variants.length == 1) {
    return { type: results[0][0], format: results[0][1] };
  }

  results.forEach(function (R) {
    counts[R] = (counts[R] || 0) + 1;
  });

  // Tuple representation of
  `counts`
  dict, sorted
  by
  values
  of
    `counts`

  sortedCounts = _.sortBy(
    _.pairs(counts),
    function (C) {
      return C[1];
    }
  ).reverse();

  return {
    type: sortedCounts[0][0].split(',')[0],
    format: sortedCounts[0][0].split(',')[1]
  };
}