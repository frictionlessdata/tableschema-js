'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// Weird mocha/karma discrepancy on this import
var ExtendableError = require('es6-error').default || require('es6-error'); // eslint-disable-line

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

var DataPackageError = function (_ExtendableError) {
  _inherits(DataPackageError, _ExtendableError);

  // Public

  /**
   * Create an error
   *
   * @param {string} message
   * @param {Error[]} errors - nested errors
   * @returns {DataPackageError}
   */
  function DataPackageError(message) {
    var errors = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

    _classCallCheck(this, DataPackageError);

    var _this = _possibleConstructorReturn(this, (DataPackageError.__proto__ || Object.getPrototypeOf(DataPackageError)).call(this, message));

    _this._errors = errors;
    return _this;
  }

  /**
   * Whether it's nested
   *
   * @returns {boolean}
   */


  _createClass(DataPackageError, [{
    key: 'multiple',
    get: function get() {
      return !!this._errors.length;
    }

    /**
     * List of errors
     *
     * @returns {Error[]}
     */

  }, {
    key: 'errors',
    get: function get() {
      return this._errors;
    }
  }]);

  return DataPackageError;
}(ExtendableError);

/**
 * Base class for the all TableSchema errors.
 */


var TableSchemaError = function (_DataPackageError) {
  _inherits(TableSchemaError, _DataPackageError);

  function TableSchemaError() {
    _classCallCheck(this, TableSchemaError);

    return _possibleConstructorReturn(this, (TableSchemaError.__proto__ || Object.getPrototypeOf(TableSchemaError)).apply(this, arguments));
  }

  return TableSchemaError;
}(DataPackageError);

// System

module.exports = {
  DataPackageError: DataPackageError,
  TableSchemaError: TableSchemaError
};