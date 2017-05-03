import lodash from 'lodash'
import * as constraints from './constraints'
import * as helpers from './helpers'
import * as config from './config'
import * as types from './types'


// Module API

/**
 * Field representation for Table Schema.
 * @param descriptor
 */
export class Field {

  // Public

  constructor(descriptor, missingValues=config.DEFAULT_MISSING_VALUES) {

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
   * Field descriptor
   * @returns {object}
   */
  get descriptor() {
    return this._descriptor
  }

  /**
   * Field name
   * @returns {string}
   */
  get name() {
    return this._descriptor.name
  }

  /**
   * Field type
   * @returns {string}
   */
  get type() {
    return this._descriptor.type
  }

  /**
   * Field format
   * @returns {string}
   */
  get format() {
    return this._descriptor.format
  }

  /**
   * Field constraints
   * @returns {object}
   */
  get constraints() {
    return this._descriptor.constraints || {}
  }

  /**
   * Return true if field is required
   * @returns {object}
   */
  get required() {
    return (this._descriptor.constraints || {}).required === true
  }

  /**
   * Cast value
   *
   * @param {any} value
   * @param {Boolean|String[]} constraints
   *
   * @returns {any}
   * @throws Error if value can't be cast
   */
  castValue(value, constraints=true) {

    // Null value
    if (this._missingValues.includes(value)) {
      value = null
    }

    // Cast value
    let castValue = value
    if (value !== null) {
      castValue = this._castFunction(value)
      if (castValue === config.ERROR) {
        throw Error(
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
          throw Error(
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
   *
   * @param {any} value
   * @param {Boolean|String[]} constraints
   *
   * @returns {Boolean}
   */
  testValue(value, constraints=true) {
    try {
      this.castValue(value, constraints)
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
    const cast = lodash.partial(func, this.format, lodash, options)
    return cast
  }

  _getCheckFunctions() {
    const checks = {}
    const cast = lodash.partial(this.castValue, lodash, false)
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
