const lodash = require('lodash')
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
    descriptor = lodash.cloneDeep(descriptor)
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
        throw TableSchemaError(
          `Field "${this.name}" can't cast value "${value}"
          for type "${this.type}" with format "${this.format}"`
        )
      }
    }

    // Check value
    if (constraints) {
      for (const [name, check] of Object.entries(this._checkFunctions)) {
        if (lodash.isArray(constraints)) {
          if (!constraints.includes(name)) continue
        }
        const passed = check(castValue)
        if (!passed) {
          throw TableSchemaError(
            `Field "${this.name}" has constraint "${name}"
            which is not satisfied for value "{value}"`
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
    // Get cast options for number
    if (this.type === 'number') {
      for (const key of ['decimalChar', 'groupChar', 'currency']) {
        const value = this.descriptor[key]
        if (value !== undefined) {
          options[key] = value
        }
      }
    }
    const func = types[`cast${lodash.upperFirst(this.type)}`]
    if (!func) throw new TableSchemaError(`Not supported field type "${this.type}"`)
    const cast = lodash.partial(func, this.format, lodash, options)
    return cast
  }

  _getCheckFunctions() {
    const checks = {}
    const cast = lodash.bind(this.castValue, this, lodash, {constraints: false})
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
      const func = constraints[`check${lodash.upperFirst(name)}`]
      const check = lodash.partial(func, castConstraint)
      checks[name] = check
    }
    return checks
  }

}


// System

module.exports = {
  Field,
}
