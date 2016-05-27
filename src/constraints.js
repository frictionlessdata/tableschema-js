import _ from 'lodash'
import utilities from './utilities'
import moment from 'moment'

export default {
  /**
   * Required value constraint. Supported types: all.
   * @param name
   * @param value
   * @param required
   * @returns {boolean}
   */
  check_required(name, value, required) {
    if (required === true) {
      if (_.isUndefined(value) || utilities.isNull(value) === true) {
        throw new Error(`The field "${name}" requires a value`)
      }
    }
    return true
  }

  /**
   * Min length constraint. Supported types: sting, array, object.Args
   * @param name
   * @param value
   * @param minLength
   * @returns {boolean}
   * @throws Error
   */
  , check_minLength(name, value, minLength) {
    if (value.length < minLength) {
      throw new Error(`The field '${name}' must have a minimum length of ${minLength}`)
    }
    return true
  }

  /**
   * Max length constraint. Supported types: sting, array, object.Args
   * @param name
   * @param value
   * @param maxLength
   * @returns {boolean}
   */
  , check_maxLength(name, value, maxLength) {
    if (value.length > maxLength) {
      throw new Error(`The field '${name}' must have a maximum length of ${maxLength}`)
    }
    return true
  }

  /**
   * Minimum constraint. Supported types: integer, number, datetime, date, time
   * @param name
   * @param value
   * @param minimum
   * @returns {boolean}
   */
  , check_minimum(name, value, minimum) {
    let result = false
    if (utilities.isNumeric(value)) {
      result = value < minimum
    } else if (moment.isMoment(value) === true) {
      result = value.isBefore(minimum)
    } else {
      throw new Error('Unsupported type of value')
    }

    if (result) {
      throw new Error(`The field '${name}' must not be less than ${minimum}`)
    }
    return true
  }

  /**
   * Maximum constraint. Supported types: integer, number, datetime, date, time
   * @param name
   * @param value
   * @param maximum
   * @returns {boolean}
   */
  , check_maximum(name, value, maximum) {
    let result = false
    if (utilities.isNumeric(value)) {
      result = value > maximum
    } else if (moment.isMoment(value) === true) {
      result = value.isAfter(maximum)
    } else {
      throw new Error('Unsupported type of value')
    }

    if (result) {
      throw new Error(`The field '${name}' must not be more than ${maximum}`)
    }
    return true
  }
  /**
   * Pattern constraint for a string value. Supported types: all.
   * Input arguments should NOT be casted to type. Pattern constraint should be
   * checked as a string value before the value is cast. `value` is treated
   * as a string and must match the XML Schema Reg
   * @param name
   * @param value
   * @param pattern
   * @returns {boolean}
   */
  , check_pattern(name, value, pattern) {
    const v = String(value)
      , match = pattern.match(new RegExp('^/(.*?)/([gimy]*)$'))
      , regex = new RegExp(match[1], match[2])
      , matches = regex.exec(v)

    if (!matches || matches.length === 0) {
      throw new Error(`The value '${pattern}' for field '${name}' must match the pattern`)
    }
    return true
  }

  , check_enum(name, value, enumerator) {
    let result
    if (_.isArray(enumerator)) {
      result = enumerator
    } else if (_.isObject(enumerator)) {
      result = Object.keys(enumerator)
    }

    if (result && result.indexOf(value) !== -1) {
      return true
    }
    throw new Error(`The value for field '${name}' must be in the enum array`)
  }

  , check_unique() {
    throw new Error('Unique constraint is not supported')
  }
}
