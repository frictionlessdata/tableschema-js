import * as _ from 'underscore'
import utilities from './utilities'

const moment = require('moment')
// FIXME: the order is matter, why? probably need to find better way to check
// what type of the current value is
  , typeNames = [
  'BooleanType'
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

function AbstractType(field) {
  this.js = typeof null
  this.name = ''
  this.format = 'default'
  this.required = true
  this.formats = ['default']

  // `field` is the field schema.
  this.field = field

  if (field) {
    this.format = field.format
    this.required = !!_.result(field.constraints, 'required')
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

class Abstract {
  constructor(field) {
    this.js = typeof null
    this.name = ''
    this.format = 'default'
    this.required = true
    this.formats = ['default']

    // `field` is the field schema.
    this.field = field

    if (field) {
      this.format = field.format
      this.required = !!_.result(field.constraints, 'required')
    }
  }

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
  castDefault(value) {
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

  hasFormat(format) {
    return !!_.contains(this.formats, format)
  }

  /**
   * Type check of value
   *
   * @param value
   * @returns {boolean}
   */
  typeCheck(value) {
    return !!(value instanceof this.js)
  }
}

class StringType extends Abstract {
  constructor(field) {
    super(field)

    this.js = 'string'
    this.name = 'string'
    this.formats = ['default', 'email', 'uri', 'binary']
    this.emailPattern = new RegExp('[^@]+@[^@]+\\.[^@]+')
    this.uriPattern = new RegExp('^http[s]?://')
  }

  castEmail(value) {
    if (!this.typeCheck(value)) {
      return false
    }

    if (!this.emailPattern.exec(value)) {
      return false
    }
    return value
  }

  castUri(value) {
    if (!this.typeCheck(value)) {
      return false
    }

    if (!this.uriPattern.exec(value)) {
      return false
    }

    return value
  }

  castBinary(value) {
    if (!this.typeCheck(value)) {
      return false
    }

    try {
      return (new Buffer(value, 'base64')).toString()
    } catch (e) {
      return false
    }
  }

  typeCheck(value) {
    return typeof value === 'string'
  }
}

class IntegerType extends Abstract {
  constructor(field) {
    super(field)

    this.js = Number
    this.name = 'integer'
  }

  castDefault(value) {
    return Number(value) == value && value % 1 === 0
  }
}

class NumberType extends Abstract {
  constructor(field) {
    super(field)

    this.js = Number
    this.name = 'number'
    this.formats = ['default', 'currency']
  }

  castDefault(value) {
    return Number(value) == value && value % 1 !== 0
  }

  castCurrency(value) {
    const v = String(value).replace(new RegExp('[.,;$€]', 'g'), '')

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
}

class BooleanType extends Abstract {
  constructor(field) {
    super(field)

    this.js = Boolean
    this.name = 'boolean'
    this.trueValues = utilities.TRUE_VALUES
    this.falseValues = utilities.FALSE_VALUES
  }

  castDefault(value) {
    if (this.typeCheck(value)) {
      return true
    }

    const v = String(value).trim().toLowerCase()

    return !!_.contains(_.union(this.trueValues, this.falseValues), v)
  }
}

class NullType extends Abstract {
  constructor(field) {
    super(field)

    this.name = 'null'
    this.nullValues = utilities.NULL_VALUES
  }

  castDefault(value) {
    if (_.isNull(value)) {
      return true
    }
    const v = value.trim().toLowerCase()
    return !!_.contains(this.nullValues, v)
  }
}

class ArrayType extends Abstract {
  constructor(field) {
    super(field)

    this.js = Array
    this.name = 'array'
  }

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
}

class ObjectType extends Abstract {
  constructor(field) {
    super(field)

    this.js = Object
    this.name = 'object'
  }

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
}

class DateType extends Abstract {
  constructor(field) {
    super(field)

    this.js = Object
    this.name = 'date'
    this.formats = ['default', 'any', 'fmt']
    this.ISO8601 = 'YYYY-MM-DD'
  }

  castAny(value) {
    let date

    try {
      date = moment(new Date(value))

      if (date.isValid()) {
        return date
      }
    } catch (e) {
      return false
    }
    return false
  }

  castDefault(value) {
    let date

    try {
      date = moment(value, this.ISO8601, true)

      if (date.isValid()) {
        return date
      }
    } catch (e) {
      return false
    }
    return false
  }

  castFmt(value) {
    let date

    try {
      date = moment(value, this.format.replace(/^fmt:/, ''), true)

      if (date.isValid()) {
        return date
      }
    } catch (e) {
      return false
    }
    return false
  }
}

class TimeType extends DateType {
  constructor(field) {
    super(field)

    this.js = Object
    this.name = 'time'
    this.formats = ['default', 'any', 'fmt']
  }

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
}

class DateTimeType extends DateType {
  constructor(field) {
    super(field)

    this.js = Object
    this.name = 'datetime'
    this.formats = ['default', 'any', 'fmt']
    this.ISO8601 = moment.ISO_8601
  }
}

class GeoPointType extends Abstract {
  constructor(field) {
    super(field)

    this.name = 'geopoint'
    this.formats = ['default', 'array', 'object']
  }

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

  castArray() {
    throw new Error('Not implemented')
  }

  castObject() {
    throw new Error('Not implemented')
  }

  // Geo point may be passed as string object with keys or array
  typeCheck(value) {
    return _.isString(value) || _.isArray(value) || _.keys(value).length
  }
}

class GeoJSONType extends GeoPointType {
  constructor(field) {
    super(field)

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
  }

  castDefault(value) {
    return super.castDefault(value)
  }

  castTopojson() {
    throw new Error('Not implemented')
  }

  // Geo JSON is always an object
  typeCheck(value) {
    return _.isObject(value) && !_.isFunction(value)
  }
}

class AnyType extends Abstract {
  constructor(field) {
    super(field)

    this.name = 'any'
  }

  cast() {
    return true
  }
}

const Types = {
  IntegerType
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
  , AnyType
  , StringType
}

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
    return (new Types[suitableType]()).name
  }

  this.cast = function cast(value) {
    try {
      return [
        (new (_.find(availableTypes(), (T =>
            new Types[T](typeOptions[(new Types[T]()).name] || {})
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
    return typeNames.map(type => Types[type])
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
        const typeName = (new Types[T]()).name
        return (new Types[T](typeOptions[typeName] || {})).cast(value)
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

export default Types
