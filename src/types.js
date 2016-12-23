import _ from 'lodash'
import moment from 'moment'
import { timeParse } from 'd3-time-format'
import utilities from './utilities'
import constraints from './constraints'

class Abstract {
  constructor(field) {
    this.format = 'default'
    this.formats = ['default']
    this.field = field || {}

    if (field && field.format) {
      this.format = field.format
    }
  }

  /**
   * Try to cast the value
   *
   * @param value
   * @param skipConstraints
   * @returns {*} casted value
   * @throws Error if value can't be casted
   */
  cast(value, skipConstraints = true) {
    let format
      , castValue

    if (utilities.isNull(value)) {
      if (!skipConstraints) {
        constraints.check_required(this.field.name, value, this.isRequired())
      }
      return null
    }

    // check some constraints before cast
    if (!skipConstraints) {
      const pattern = this.getConstraint('pattern')
      if (pattern) {
        constraints.check_pattern(this.field.name, value, pattern)
      }
    }

    // Cast with the appropriate handler, falling back to default if none
    if (this.format.indexOf('fmt') === 0) {
      format = 'fmt'
    } else {
      format = this.format
    }

    const handler = `cast${format.charAt(0).toUpperCase() +
                           format.substring(1)}`

    try {
      if (this.hasFormat(format) && this[handler]) {
        castValue = this[handler](value)
      } else {
        castValue = this.castDefault(value)
      }
    } catch (e) {
      throw new Error('Invalid Cast Error')
    }

    if (!skipConstraints) {
      _.forEach(_.keys(this.field.constraints), constraint => {
        switch (constraint) {
          case 'unique':
          case 'pattern':
          case 'required':
            return
          default:
            if (this.constraints.indexOf(constraint) === -1) {
              throw new Error(`Field type '${this.field.type}' does ` +
                              `not support the '${constraint}' constraint`)
            }
            constraints[`check_${constraint}`](this.field.name, castValue,
                                               this.field.constraints[constraint])
        }
      })
    }
    return castValue
  }

  /**
   * Test if it possible to cast the value
   *
   * @param value
   * @param skipConstraints
   * @returns {boolean}
   */
  test(value, skipConstraints = true) {
    try {
      this.cast(value, skipConstraints)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Method should be implemented by every type
   * @throws Error
   */
  castDefault() {
    throw new Error()
  }

  hasFormat(format) {
    return !!_.includes(this.formats, format)
  }

  getConstraint(value) {
    return this.field.constraints[value]
  }

  isRequired() {
    return !!this.getConstraint('required')
  }
}

class StringType extends Abstract {
  static get name() {
    return 'string'
  }

  constructor(field) {
    super(field)

    this.constraints = ['required', 'pattern', 'enum', 'minLength', 'maxLength']
    this.formats = ['default', 'email', 'uri', 'binary']
    this.emailPattern = new RegExp('[^@]+@[^@]+\\.[^@]+')
    this.uriPattern = new RegExp('^http[s]?://')
  }

  castDefault(value) {
    this.typeCheck(value)
    return value
  }

  castEmail(value) {
    this.typeCheck(value)

    if (!this.emailPattern.exec(value)) {
      throw new Error()
    }
    return value
  }

  castUri(value) {
    this.typeCheck(value)

    if (!this.uriPattern.exec(value)) {
      throw new Error()
    }
    return value
  }

  castBinary(value) {
    try {
      this.typeCheck(value)
    } catch (e) {
      if (!Buffer.isBuffer(value)) {
        throw new Error()
      }
    }
    return (new Buffer(value)).toString()
  }

  typeCheck(value) {
    if (utilities.isNumeric(value) || typeof value !== 'string') {
      throw new Error()
    }
    return true
  }
}

class IntegerType extends Abstract {
  static get name() {
    return 'integer'
  }

  constructor(field) {
    super(field)

    const groupChar = (field || {}).groupChar || ','
      , decimalChar = (field || {}).decimalChar || '.'

    this.constraints = ['required', 'pattern', 'enum', 'minimum', 'maximum']
    this.regex = {
      group: new RegExp(`[${groupChar}]`, 'g')
      , decimal: new RegExp(`[${decimalChar}]`, 'g')
      , percent: new RegExp('[%‰‱％﹪٪]', 'g')
      , currency: new RegExp('[$£€]', 'g')
    }
  }

  castDefault(value) {
    const newValue = this.beforeCast(value)
    // probably it is float number
    if (newValue.indexOf('.') !== -1) {
      throw new Error()
    }
    if (utilities.isInteger(newValue)) {
      return Number(newValue)
    }
    throw new Error()
  }

  beforeCast(value) {
    return String(value)
      .replace(this.regex.group, '')
      .replace(this.regex.percent, '')
      .replace(this.regex.currency, '')
      .replace(this.regex.decimal, '.')
  }
}

class NumberType extends IntegerType {
  static get name() {
    return 'number'
  }

  constructor(field) {
    super(field)
    this.formats = ['default', 'currency']
  }

  castDefault(value) {
    const newValue = this.beforeCast(value)

    if (!utilities.isNumeric(newValue)) {
      throw new Error()
    }

    // need to cover the case then number has .00 format
    if (newValue.indexOf('.') !== -1 && utilities.isInteger(newValue)) {
      const toFixed = newValue.split('.')[1].length
      return Number(newValue).toFixed(toFixed)
    }
    // here probably normal float number
    if (!isNaN(newValue)) {
      return Number(newValue)
    }
    throw new Error()
  }

  castCurrency(value) {
    return this.castDefault(this.beforeCast(value))
  }
}

class BooleanType extends Abstract {
  static get name() {
    return 'boolean'
  }

  constructor(field) {
    super(field)

    this.constraints = ['required', 'pattern', 'enum']
  }

  castDefault(value) {
    try {
      this.typeCheck(value)
      return value
    } catch (e) {

    }

    const v = String(value).trim().toLowerCase()
    if (utilities.isTrue(v)) {
      return true
    } else if (utilities.isFalse(v)) {
      return false
    }
    throw new Error()
  }

  typeCheck(value) {
    if (typeof value === 'boolean') {
      return true
    }
    throw new Error()
  }
}

class ArrayType extends Abstract {
  static get name() {
    return 'array'
  }

  constructor(field) {
    super(field)
    this.constraints = ['required', 'pattern', 'enum', 'minLength', 'maxLength']
  }

  castDefault(value) {
    if (this.typeCheck(value)) {
      return value
    }
    const val = JSON.parse(value)
    if (this.typeCheck(val)) {
      return val
    }
    throw new Error()
  }

  /**
   * Type check of value
   *
   * @param value
   * @returns {boolean}
   */
  typeCheck(value) {
    if (_.isArray(value)) {
      return true
    }
    throw new Error()
  }
}

class ObjectType extends Abstract {
  static get name() {
    return 'object'
  }

  constructor(field) {
    super(field)
    this.constraints = ['required', 'pattern', 'enum', 'minimum', 'maximum']
  }

  castDefault(value) {
    if (_.isObject(value) && !_.isArray(value) && !_.isFunction(value)) {
      return value
    }
    const v = JSON.parse(value)
    if (!(v instanceof Object)) {
      throw new Error()
    }
    return v
  }
}

class DateType extends Abstract {
  static get name() {
    return 'date'
  }

  constructor(field) {
    super(field)

    this.formats = ['default', 'any', 'fmt']
    this.ISO8601 = 'YYYY-MM-DD'
    this.constraints = ['required', 'pattern', 'enum', 'minimum', 'maximum']
  }

  castAny(value) {
    const date = moment(new Date(value))
    if (!date.isValid()) {
      throw new Error()
    }
    return date.toDate()
  }

  castDefault(value) {
    const date = moment(value, this.ISO8601, true)
    if (!date.isValid()) {
      throw new Error()
    }
    return date.toDate()
  }

  castFmt(value) {
    const date = timeParse(this.format.replace(/^fmt:/, ''))(value)
    if (date == null) {
      throw new Error()
    }
    return date
  }
}

class TimeType extends DateType {
  static get name() {
    return 'time'
  }

  constructor(field) {
    super(field)
    this.formats = ['default', 'any', 'fmt']
  }

  castDefault(value) {
    const date = moment(value, 'HH:mm:ss', true)

    if (!date.isValid()) {
      throw new Error()
    }
    return date.toDate()
  }
}

class DateTimeType extends DateType {
  static get name() {
    return 'datetime'
  }

  constructor(field) {
    super(field)
    this.formats = ['default', 'any', 'fmt']
    this.ISO8601 = moment.ISO_8601
  }
}

class GeoPointType extends Abstract {
  static get name() {
    return 'geopoint'
  }

  constructor(field) {
    super(field)
    this.formats = ['default', 'array', 'object']
    this.constraints = ['required', 'pattern', 'enum']
  }

  castDefault(value) {
    try {
      return this.castString(value)
    } catch (e) {

    }

    try {
      return this.castArray(value)
    } catch (e) {

    }

    try {
      return this.castObject(value)
    } catch (e) {

    }
    throw new Error()
  }

  /**
   * Cast string of format "latitude, longitude"
   * @param value
   * @returns {*}
   * @throws Error in case String has incorrect format or wrong values
   * for latitude or longitude
   */
  castString(value) {
    if (_.isString(value)) {
      let geoPoint = value.split(',')
      if (geoPoint.length === 2) {
        geoPoint = [geoPoint[0].trim(), geoPoint[1].trim()]
        this.checkRange(geoPoint)
        return this.reFormat(geoPoint)
      }
    }
    throw new Error()
  }

  castArray(value) {
    if (_.isArray(value) && value.length === 2) {
      const longitude = String(value[0]).trim()
        , latitude = String(value[1]).trim()
        , geoPoint = [longitude, latitude]

      this.checkRange(geoPoint)
      return this.reFormat(geoPoint)
    }
    throw new Error()
  }

  castObject(value) {
    if (value &&
        (_.isUndefined(value.longitude) || _.isUndefined(value.latitude))) {
      throw new Error('Invalid Geo Point format')
    }
    const longitude = String(value.longitude).trim()
      , latitude = String(value.latitude).trim()
      , geoPoint = [longitude, latitude]

    this.checkRange(geoPoint)
    return this.reFormat(geoPoint)
  }

  /**
   * Geo point may be passed as a string, an object with keys or an array
   * @param value
   * @returns {boolean}
   */
  typeCheck(value) {
    if (_.isString(value) || _.isArray(value) || _.keys(value).length) {
      return true
    }
    throw new Error()
  }

  /**
   * Check the range of geo points
   *
   * @param geoPoint
   * @throws Error
   */
  checkRange(geoPoint = []) {
    const longitude = Number(geoPoint[0])
      , latitude = Number(geoPoint[1])

    if (isNaN(longitude) || isNaN(latitude)) {
      throw new Error('longtitude and latitude should be number')
    }

    if (longitude >= 180 || longitude <= -180) {
      throw new Error('longtitude should be between -180 and 180, ' +
                      `found: ${longitude}`)
    }

    if (latitude >= 90 || latitude <= -90) {
      throw new Error('latitude should be between -90 and 90, ' +
                      `found: ${latitude}`)
    }
  }

  /**
   * Bring array values to the same format
   * @param geoPoint
   * @returns {Array}
   */
  reFormat(geoPoint) {
    const result = []
    _.forEach(geoPoint, point => {
      point = String(point)
      if (point.indexOf('.') === -1) {
        point = Number(point).toFixed(1)
      }
      result.push(point)
    })
    return result
  }
}

// TODO copy functionality from Python lib
class GeoJSONType extends GeoPointType {
  static get name() {
    return 'geojson'
  }

  constructor(field) {
    super(field)
    this.formats = ['default', 'topojson']
    this.constraints = ['required', 'pattern', 'enum']

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
    if (_.isObject(value) && !_.isFunction(value)) {
      return true
    }
    throw new Error()
  }
}

class AnyType extends Abstract {
  static get name() {
    return 'any'
  }

  constructor(field) {
    super(field)
    this.constraints = ['required', 'pattern', 'enum']
  }

  cast(value) {
    return value
  }

  test() {
    return true
  }
}

const Types = {
  IntegerType
  , NumberType
  , BooleanType
  , ArrayType
  , ObjectType
  , DateType
  , TimeType
  , DateTimeType
  , GeoPointType
  , GeoJSONType
  , StringType
  , AnyType
}

/**
 * Guess the type for a value
 *
 * @param options - TODO add description
 */
export default class Type {
  constructor(options) {
    this.typeOptions = options || {}
  }

  /**
   * Try to find the best suited Type for provided values
   *
   * @param values
   * @returns String - name of the type
   */
  multiCast(values) {
    const types = suitableTypes(values, this.typeOptions)
      , typeNames = _.keys(Types)
      , suitableType = _.find(typeNames, type => _.indexOf(types, type) !== -1)
    return Types[suitableType].name
  }

  /**
   * Cast the value of the field accordingly to the field type
   * @param field
   * @param value
   * @param skipConstraints
   * @returns any
   * @throws Error if cast failed
   */
  cast(field, value, skipConstraints = true) {
    return getType(field).cast(value, skipConstraints)
  }

  /**
   * Test the value if it can be casted for this field type
   * @param field
   * @param value
   * @param skipConstraints
   * @returns boolean
   */
  test(field, value, skipConstraints = true) {
    return getType(field).test(value, skipConstraints)
  }
}

/**
 * Return types suitable to the provided multiple values
 *
 * @param values
 * @returns {Array}
 */
function suitableTypes(values, options) {
  const filtered = values.filter(v => !_.isUndefined(v) || _.isEmpty(v))
    , typeNames = _.keys(Types)

  if (filtered.length === 0) {
    return ['AnyType']
  }

  const typeList = filtered.map(value => typeNames.filter(
    T => (new Types[T](options[Types[T].name])).test(value)))
  return _.reduce(typeList, (memo, types) => _.intersection(memo, types))
}

function getType(field) {
  const MatchingType = _.find(Types, T => T.name === field.type)
  if (MatchingType) return new MatchingType(field)

  throw new Error('Unsupported field type')
}
