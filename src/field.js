const bind = require('lodash/bind')
const isArray = require('lodash/isArray')
const cloneDeep = require('lodash/cloneDeep')
const upperFirst = require('lodash/upperFirst')
const { TableSchemaError } = require('./errors')
const constraints = require('./constraints')
const helpers = require('./helpers')
const config = require('./config')
const types = require('./types')

// Module API

/**
 * Field representation
 */
class Field {
  // Public

  /**
   * Constructor to instantiate `Field` class.

   * @param {Object} descriptor - schema field descriptor
   * @param {string[]} missingValues - an array with string representing missing values
   * @throws {TableSchemaError} raises any error occured in the process
   * @returns {Field} returns field class instance
   */
  constructor(descriptor, { missingValues = config.DEFAULT_MISSING_VALUES } = {}) {
    // Process descriptor
    descriptor = cloneDeep(descriptor)
    descriptor = helpers.expandFieldDescriptor(descriptor)

    // Set attributes
    this._descriptor = descriptor
    this._missingValues = missingValues
    this._castFunction = this._getCastFunction()
    this._checkFunctions = this._getCheckFunctions()
  }

  /**
   * Field name
   *
   * @returns {string}
   */
  get name() {
    return this._descriptor.name
  }

  /**
   * Field type
   *
   * @returns {string}
   */
  get type() {
    return this._descriptor.type
  }

  /**
   * Field format
   *
   * @returns {string}
   */
  get format() {
    return this._descriptor.format
  }

  /**
   * Return true if field is required
   *
   * @returns {boolean}
   */
  get required() {
    return (this._descriptor.constraints || {}).required === true
  }

  /**
   * Field constraints
   *
   * @returns {Object}
   */
  get constraints() {
    return this._descriptor.constraints || {}
  }

  /**
   * Field descriptor
   *
   * @returns {Object}
   */
  get descriptor() {
    return this._descriptor
  }

  /**
   * Cast value
   *
   * @param {any} value - value to cast
   * @param {Object|false} constraints
   * @returns {any} cast value
   */
  castValue(value, { constraints = true } = {}) {
    // Null value
    if (this._missingValues.includes(value)) {
      value = null
    }

    // Cast value
    let castValue = value
    if (value !== null) {
      castValue = this._castFunction(value)
      if (castValue === config.ERROR) {
        throw new TableSchemaError(
          `The value "${value}" in column "${this.name}" ` +
            `is not type "${this.type}" and format "${this.format}"`
        )
      }
    }

    // Check value
    if (constraints) {
      for (const [name, check] of Object.entries(this._checkFunctions)) {
        if (isArray(constraints)) {
          if (!constraints.includes(name)) continue
        }
        const passed = check(castValue)
        if (!passed) {
          throw new TableSchemaError(
            `The value "${value}" does not conform ` +
              `to the "${name}" constraint for column "${this.name}"`
          )
        }
      }
    }

    return castValue
  }

  /**
   * Check if value can be cast
   *
   * @param {any} value - value to test
   * @param {Object|false} constraints
   * @returns {boolean}
   */
  testValue(value, { constraints = true } = {}) {
    try {
      this.castValue(value, { constraints })
    } catch (error) {
      return false
    }
    return true
  }

  // Private

  _getCastFunction() {
    const options = {}

    // Get cast options
    for (const key of ['decimalChar', 'groupChar', 'bareNumber', 'trueValues', 'falseValues']) {
      const value = this.descriptor[key]
      if (value !== undefined) {
        options[key] = value
      }
    }

    // Get cast function
    const func = types[`cast${upperFirst(this.type)}`]
    if (!func) throw new TableSchemaError(`Not supported field type "${this.type}"`)
    const cast = bind(func, null, this.format, bind.placeholder, options)

    return cast
  }

  _getCheckFunctions() {
    const checks = {}
    const cast = bind(this.castValue, this, bind.placeholder, { constraints: false })
    for (const [name, constraint] of Object.entries(this.constraints)) {
      let castConstraint = constraint

      // Cast enum constraint
      if (['enum'].includes(name)) {
        try {
          if (!Array.isArray(constraint)) throw new TableSchemaError('Array is required')
          castConstraint = constraint.map(cast)
        } catch (error) {
          throw new TableSchemaError(
            `Enum constraint "${constraint}" is not valid: ${error.message}`
          )
        }
      }

      // Cast maximum/minimum constraint
      if (['maximum', 'minimum'].includes(name)) {
        try {
          castConstraint = cast(constraint)
        } catch (error) {
          throw new TableSchemaError(
            `Maximum/minimum constraint "${constraint}" is not valid: ${error.message}`
          )
        }
      }

      // Get check function
      const func = constraints[`check${upperFirst(name)}`]
      if (func) checks[name] = bind(func, null, castConstraint)
    }
    return checks
  }
}

// System

module.exports = {
  Field,
}
