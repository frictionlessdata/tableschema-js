import lodash from 'lodash'
import Type from './types'
import * as helpers from './helpers'

// Module API

/**
 * Field representation for Table Schema.
 * @param descriptor
 */
export default class Field {

  // Public

  constructor(descriptor) {

    // Process descriptor
    descriptor = lodash.cloneDeep(descriptor)
    descriptor = helpers.expandFieldDescriptor(descriptor)

    // Set attributes
    this._descriptor = descriptor
    this._type_instance = new Type()

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
   * Cast value to fieldName's type
   *
   * @param value
   * @param skipConstraints
   *
   * @returns {Type}
   * @throws Error if value can't be casted
   */
  castValue(value, skipConstraints=true) {
    return this._type_instance.cast(this._descriptor, value, skipConstraints)
  }

  /**
   * Check if value to fieldName's type can be casted
   *
   * @param value
   * @param skipConstraints
   *
   * @returns {Boolean}
   */
  testValue(value, skipConstraints=true) {
    return this._type_instance.test(this._descriptor, value, skipConstraints)
  }

}
