const bind = require('lodash/bind')
const isArray = require('lodash/isArray')
const cloneDeep = require('lodash/cloneDeep')
const upperFirst = require('lodash/upperFirst')
const {TableSchemaError} = require('./errors')
const constraints = require('./constraints')
const helpers = require('./helpers')
const config = require('./config')
const types = require('./types')


// Module API

class Field {

  // Public

  /**
   * Construct field
   * https://github.com/frictionlessdata/tableschema-js#field
   */
  constructor(descriptor, {missingValues=config.DEFAULT_MISSING_VALUES}={}) {

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
   * https://github.com/frictionlessdata/tableschema-js#field
   */
  get name() {
    return this._descriptor.name
  }

  /**
   * Field type
   * https://github.com/frictionlessdata/tableschema-js#field
   */
  get type() {
    return this._descriptor.type
  }

  /**
   * Field format
   * https://github.com/frictionlessdata/tableschema-js#field
   */
  get format() {
    return this._descriptor.format
  }

  /**
   * Return true if field is required
   * https://github.com/frictionlessdata/tableschema-js#field
   */
  get required() {
    return (this._descriptor.constraints || {}).required === true
  }

  /**
   * Field constraints
   * https://github.com/frictionlessdata/tableschema-js#field
   */
  get constraints() {
    return this._descriptor.constraints || {}
  }

  /**
   * Field descriptor
   * https://github.com/frictionlessdata/tableschema-js#field
   */
  get descriptor() {
    return this._descriptor
  }

  /**
   * Cast value
   * https://github.com/frictionlessdata/tableschema-js#field
   */
  castValue(value, {constraints=true}={}) {

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
   * https://github.com/frictionlessdata/tableschema-js#field
   */
  testValue(value, {constraints=true}={}) {
    try {
      this.castValue(value, {constraints})
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
    const cast = bind(this.castValue, this, bind.placeholder, {constraints: false})
    for (const [name, constraint] of Object.entries(this.constraints)) {
      let castConstraint = constraint

      // Cast enum constraint
      if (['enum'].includes(name)) {
        castConstraint = constraint.map(cast)
      }

      // Cast maximum/minimum constraint
      if (['maximum', 'minimum'].includes(name)) {
        castConstraint = cast(constraint)
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
