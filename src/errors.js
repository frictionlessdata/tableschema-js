// Weird mocha/karma discrepancy on this import
const ExtendableError = require('es6-error').default || require('es6-error') // eslint-disable-line

// Module API

/**
 * Base class for the all DataPackage/TableSchema errors.
 *
 * If there are more than one error you could get an additional information
 * from the error object:
 *
 * ```javascript
 * try {
 *   // some lib action
 * } catch (error) {
 *   console.log(error) // you have N cast errors (see error.errors)
 *   if (error.multiple) {
 *     for (const error of error.errors) {
 *         console.log(error) // cast error M is ...
 *     }
 *   }
 * }
 * ```
 */
class DataPackageError extends ExtendableError {
  // Public

  /**
   * Create an error
   *
   * @param {string} message
   * @param {Error[]} errors - nested errors
   * @returns {DataPackageError}
   */
  constructor(message, errors = []) {
    super(message)
    this._errors = errors
  }

  /**
   * Whether it's nested
   *
   * @returns {boolean}
   */
  get multiple() {
    return !!this._errors.length
  }

  /**
   * List of errors
   *
   * @returns {Error[]}
   */
  get errors() {
    return this._errors
  }
}

/**
 * Base class for the all TableSchema errors.
 */
class TableSchemaError extends DataPackageError {}

// System

module.exports = {
  DataPackageError,
  TableSchemaError,
}
