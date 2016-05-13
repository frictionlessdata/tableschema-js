'use strict'

const _ = require('underscore')
  , moment = require('moment')
  , utilities = require('./utilities')
// FIXME: the order is manner, why? probably need to find better way to chek
// what type of the current value is
  , typeNames = [
  , 'BooleanType'
  , 'IntegerType'
  , 'NullType'
  , 'DateType'
  , 'TimeType'
  , 'DateTimeType'
  , 'ArrayType'
  , 'ObjectType'
  , 'GeoPointType'
  , 'GeoJSONType'
  , 'NumberType'
  , 'StringType'
  , 'AnyType'
]

exports = module.exports = {
  AnyType
  , StringType
  , IntegerType
  , NumberType
  , BooleanType
  , NullType
  , ArrayType
  , ObjectType
  , DateType
  , TimeType
  , DateTimeType
  , GeoPointType
  , GeoJSONType
  , TypeGuesser
}

function AbstractType(field) {
  this.js = typeof null
  this.name = ''
  this.format = 'default'
  this.required = true
  this.formats = ['default']

  // `field` is the field schema.
  this.field = field

  if (this.field) {
    this.format = this.field.format
    this.required = _.result(this.field.constraints, 'required') || false
  }
  return this
}

AbstractType.prototype = {
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
      if (this.format.indexOf('fmt') === 0) {
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
  , hasFormat(format) {
    return !!_.contains(this.formats, format)
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

function StringType(field) {
  AbstractType.call(this, field)

  this.js = 'string'
  this.name = 'string'
  this.formats = ['default', 'email', 'uri', 'binary']
  this.emailPattern = new RegExp('[^@]+@[^@]+\\.[^@]+')
  this.uriPattern = new RegExp('^http[s]?://')

  return this
}

StringType.prototype = _.extend(
  {}
  , AbstractType.prototype
  , {
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

function IntegerType(field) {
  AbstractType.call(this, field)

  this.js = Number
  this.name = 'integer'

  return this
}

IntegerType.prototype = _.extend(
  {}
  , AbstractType.prototype
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

function NumberType(field) {
  AbstractType.call(this, field)

  this.js = Number
  this.name = 'number'
  this.formats = ['default', 'currency']
  this.separators = '.,;$'

  return this
}

NumberType.prototype = _.extend(
  {}
  , AbstractType.prototype
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

function BooleanType(field) {
  AbstractType.call(this, field)

  this.js = Boolean
  this.name = 'boolean'
  this.trueValues = utilities.TRUE_VALUES
  this.falseValues = utilities.FALSE_VALUES

  return this
}

BooleanType.prototype = _.extend(
  {}
  , AbstractType.prototype
  , {
    castDefault(value) {
      if (this.typeCheck(value)) {
        return true
      }

      const v = value.trim().toLowerCase()

      return !!_.contains(_.union(this.trueValues, this.falseValues), v)
    }
  })

function NullType(field) {
  AbstractType.call(this, field)

  this.name = 'null'
  this.nullValues = utilities.NULL_VALUES

  return this
}

NullType.prototype = _.extend(
  {}
  , AbstractType.prototype
  , {
    castDefault(value) {
      if (_.isNull(value)) {
        return true
      }
      const v = value.trim().toLowerCase()
      return !!_.contains(this.nullValues, v)
    }
  })

function ArrayType(field) {
  AbstractType.call(this, field)

  this.js = Array
  this.name = 'array'

  return this
}

ArrayType.prototype = _.extend(
  {}
  , AbstractType.prototype
  , {
    castDefault(value) {
      if (this.typeCheck(value)) {
        return true
      }

      try {
        return this.typeCheck(JSON.parse(value))
      } catch (e) {
        return false
      }
    }
  })

function ObjectType(field) {
  AbstractType.call(this, field)

  this.js = Object
  this.name = 'object'

  return this
}

ObjectType.prototype = _.extend(
  {}
  , AbstractType.prototype
  , {
    castDefault(value) {
      if (_.isObject(value) && !_.isArray(value) && !_.isFunction(value)) {
        return true
      }

      try {
        return JSON.parse(value) instanceof this.js
      } catch (e) {
        return false
      }
    }
  })

function DateType(field) {
  AbstractType.call(this, field)

  this.js = Object
  this.name = 'date'
  this.formats = ['default', 'any', 'fmt']
  this.ISO8601 = 'YYYY-MM-DD'

  return this
}

DateType.prototype = _.extend(
  {}
  , AbstractType.prototype
  , {
    castAny(value) {
      let date

      try {
        date = moment(new Date(value))
      } catch (e) {
        return false
      }

      if (date.isValid()) {
        return date
      }

      return false
    }

    , castDefault(value) {
      let date

      try {
        date = moment(value, this.ISO8601, true)
      } catch (e) {
        return false
      }

      if (date.isValid()) {
        return date
      }

      return false
    }

    , castFmt(value) {
      let date

      try {
        date = moment(value, this.format.replace(/^fmt:/, ''), true)
      } catch (e) {
        return false
      }

      if (date.isValid()) {
        return date
      }

      return false
    }
  })

function TimeType(field) {
  AbstractType.call(this, field)

  this.js = Object
  this.name = 'time'
  this.formats = ['default', 'any', 'fmt']

  return this
}

TimeType.prototype = _.extend(
  {}
  , DateType.prototype
  , {
    castDefault(value) {
      let date

      try {
        date = moment(value, 'HH:mm:ss', true)
      } catch (e) {
        return false
      }

      if (date.isValid()) {
        return date
      }

      return false
    }
  })

function DateTimeType(field) {
  AbstractType.call(this, field)

  this.js = Object
  this.name = 'datetime'
  this.formats = ['default', 'any', 'fmt']
  this.ISO8601 = moment.ISO_8601

  return this
}

DateTimeType.prototype = _.extend({}, DateType.prototype)

function GeoPointType(field) {
  AbstractType.call(this, field)

  this.name = 'geopoint'
  this.formats = ['default', 'array', 'object']

  return this
}

GeoPointType.prototype = _.extend(
  {}
  , AbstractType.prototype
  , {
    castDefault(value) {
      if (!this.typeCheck(value)) {
        return false
      }

      if (_.isString(value)) {
        return value.split(',').length === 2
      }

      if (_.isObject(value)) {
        return value
      }

      try {
        return JSON.parse(value)
      } catch (e) {
        return false
      }
    }

    , castArray() {
      throw new Error('Not implemented')
    }
    , castObject() {
      throw new Error('Not implemented')
    }

    // Geo point may be passed as string object with keys or array
    , typeCheck(value) {
      return _.isString(value) || _.isArray(value) || _.keys(value).length
    }
  })

function GeoJSONType(field) {
  AbstractType.call(this, field)

  this.js = Object
  this.name = 'geojson'
  this.formats = ['default', 'topojson']

  this.spec = {
    types: [
      'Point'
      , 'MultiPoint'
      , 'LineString'
      , 'MultiLineString'
      , 'Polygon'
      , 'MultiPolygon'
      , 'GeometryCollection'
      , 'Feature'
      , 'FeatureCollection'
    ]
  }

  return this
}

GeoJSONType.prototype = _.extend(
  {}
  , AbstractType.prototype
  , {
    castDefault: GeoPointType.prototype.castDefault

    , castTopojson() {
      throw new Error('Not implemented');
    }

    // Geo JSON is always an object
    , typeCheck(value) {
      return _.isObject(value) && !_.isFunction(value)
    }
  })

function AnyType(field) {
  AbstractType.call(this, field)

  this.name = 'any'

  return this
}

AnyType.prototype = _.extend(
  {}
  , AbstractType.prototype
  , {
    cast() {
      return true
    }
  })

/**
 * Guess the type for a value
 *
 * @param options - TODO add description
 */
function TypeGuesser(options) {
  const typeOptions = options || {}

  this.multiCast = function multiCast(values) {
    const types = suitableTypes(values)
      , suitableType = _.find(typeNames, type => _.indexOf(types, type) !== -1)
    return (new exports[suitableType]()).name
  }

  this.cast = function cast(value) {
    try {
      return [
        (new (_.find(availableTypes(), (T =>
            new exports[T](typeOptions[(new exports[T]()).name] || {})
              .cast(value)
        )))()).name
        , 'default'
      ]
    } catch (e) {
      return null
    }
  }

  return this

  /**
   * Return available types objects
   *
   * @returns {Array}
   */
  function availableTypes() {
    return typeNames.map(type => exports[type])
  }

  /**
   * Return types suitable to the provided multiple values
   *
   * @param values
   * @returns {Array}
   */
  function suitableTypes(values) {
    const filtered = values.filter(v => !_.isUndefined(v) || _.isEmpty(v))

    if (filtered.length === 0) {
      return ['AnyType']
    }

    const typeList = filtered.map(value => typeNames.filter(
      T => {
        const typeName = (new exports[T]()).name
        return (new exports[T](typeOptions[typeName] || {})).cast(value)
      }, this))
    return _.reduce(typeList, (memo, types) => _.intersection(memo, types))
  }
}

function TypeResolver() {
  return this
}

TypeResolver.prototype = {
  get(results) {
    const counts = {}
      , variants = _.uniq(results)

    // Only one candidate... that's easy.
    if (variants.length === 1) {
      return { type: results[0][0], format: results[0][1] }
    }

    results.forEach((result) => {
      counts[result] = (counts[result] || 0) + 1
    })

    // Tuple representation of  `counts`  dict, sorted  by  values  of
    // `counts`
    const sortedCounts = _.sortBy(_.pairs(counts), (cnt) => cnt[1]).reverse()

    return {
      type: sortedCounts[0][0].split(',')[0]
      , format: sortedCounts[0][0].split(',')[1]
    }
  }
}
