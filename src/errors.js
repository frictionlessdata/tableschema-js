const ExtendableError = require('es6-error')


// Module API

class DataPackageError extends ExtendableError {

  // Public

  /**
   * https://github.com/frictionlessdata/tableschema-js#errors
   */
  constructor(message, errors=[]) {
    super(message)
    this._errors = errors
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#errors
   */
  get multiple() {
    return !!this._errors.length
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#errors
   */
  get errors() {
    return this._errors
  }

}


class TableSchemaError extends DataPackageError {}


// System

module.exports = {
  DataPackageError,
  TableSchemaError,
}
