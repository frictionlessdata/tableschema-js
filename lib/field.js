'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var bind = require('lodash/bind');
var isArray = require('lodash/isArray');
var cloneDeep = require('lodash/cloneDeep');
var upperFirst = require('lodash/upperFirst');

var _require = require('./errors'),
    TableSchemaError = _require.TableSchemaError;

var constraints = require('./constraints');
var helpers = require('./helpers');
var config = require('./config');
var types = require('./types');

// Module API

/**
 * Field representation
 */

var Field = function () {
  // Public

  /**
   * Constructor to instantiate `Field` class.
    * @param {Object} descriptor - schema field descriptor
   * @param {string[]} missingValues - an array with string representing missing values
   * @throws {TableSchemaError} raises any error occured in the process
   * @returns {Field} returns field class instance
   */
  function Field(descriptor) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref$missingValues = _ref.missingValues,
        missingValues = _ref$missingValues === undefined ? config.DEFAULT_MISSING_VALUES : _ref$missingValues;

    _classCallCheck(this, Field);

    // Process descriptor
    descriptor = cloneDeep(descriptor);
    descriptor = helpers.expandFieldDescriptor(descriptor);

    // Set attributes
    this._descriptor = descriptor;
    this._missingValues = missingValues;
    this._castFunction = this._getCastFunction();
    this._checkFunctions = this._getCheckFunctions();
  }

  /**
   * Field name
   *
   * @returns {string}
   */


  _createClass(Field, [{
    key: 'castValue',


    /**
     * Cast value
     *
     * @param {any} value - value to cast
     * @param {Object|false} constraints
     * @returns {any} cast value
     */
    value: function castValue(value) {
      var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          _ref2$constraints = _ref2.constraints,
          constraints = _ref2$constraints === undefined ? true : _ref2$constraints;

      // Null value
      if (this._missingValues.includes(value)) {
        value = null;
      }

      // Cast value
      var castValue = value;
      if (value !== null) {
        castValue = this._castFunction(value);
        if (castValue === config.ERROR) {
          throw new TableSchemaError('The value "' + value + '" in column "' + this.name + '" ' + ('is not type "' + this.type + '" and format "' + this.format + '"'));
        }
      }

      // Check value
      if (constraints) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = Object.entries(this._checkFunctions)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var _step$value = _slicedToArray(_step.value, 2),
                name = _step$value[0],
                check = _step$value[1];

            if (isArray(constraints)) {
              if (!constraints.includes(name)) continue;
            }
            var passed = check(castValue);
            if (!passed) {
              throw new TableSchemaError('The value "' + value + '" does not conform ' + ('to the "' + name + '" constraint for column "' + this.name + '"'));
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }

      return castValue;
    }

    /**
     * Check if value can be cast
     *
     * @param {any} value - value to test
     * @param {Object|false} constraints
     * @returns {boolean}
     */

  }, {
    key: 'testValue',
    value: function testValue(value) {
      var _ref3 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          _ref3$constraints = _ref3.constraints,
          constraints = _ref3$constraints === undefined ? true : _ref3$constraints;

      try {
        this.castValue(value, { constraints: constraints });
      } catch (error) {
        return false;
      }
      return true;
    }

    // Private

  }, {
    key: '_getCastFunction',
    value: function _getCastFunction() {
      var options = {};

      // Get cast options
      var _arr = ['decimalChar', 'groupChar', 'bareNumber', 'trueValues', 'falseValues'];
      for (var _i = 0; _i < _arr.length; _i++) {
        var key = _arr[_i];
        var value = this.descriptor[key];
        if (value !== undefined) {
          options[key] = value;
        }
      }

      // Get cast function
      var func = types['cast' + upperFirst(this.type)];
      if (!func) throw new TableSchemaError('Not supported field type "' + this.type + '"');
      var cast = bind(func, null, this.format, bind.placeholder, options);

      return cast;
    }
  }, {
    key: '_getCheckFunctions',
    value: function _getCheckFunctions() {
      var checks = {};
      var cast = bind(this.castValue, this, bind.placeholder, { constraints: false });
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = Object.entries(this.constraints)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _step2$value = _slicedToArray(_step2.value, 2),
              name = _step2$value[0],
              constraint = _step2$value[1];

          var castConstraint = constraint;

          // Cast enum constraint
          if (['enum'].includes(name)) {
            try {
              if (!Array.isArray(constraint)) throw new TableSchemaError('Array is required');
              castConstraint = constraint.map(cast);
            } catch (error) {
              throw new TableSchemaError('Enum constraint "' + constraint + '" is not valid: ' + error.message);
            }
          }

          // Cast maximum/minimum constraint
          if (['maximum', 'minimum'].includes(name)) {
            try {
              castConstraint = cast(constraint);
            } catch (error) {
              throw new TableSchemaError('Maximum/minimum constraint "' + constraint + '" is not valid: ' + error.message);
            }
          }

          // Get check function
          var func = constraints['check' + upperFirst(name)];
          if (func) checks[name] = bind(func, null, castConstraint);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      return checks;
    }
  }, {
    key: 'name',
    get: function get() {
      return this._descriptor.name;
    }

    /**
     * Field type
     *
     * @returns {string}
     */

  }, {
    key: 'type',
    get: function get() {
      return this._descriptor.type;
    }

    /**
     * Field format
     *
     * @returns {string}
     */

  }, {
    key: 'format',
    get: function get() {
      return this._descriptor.format;
    }

    /**
     * Return true if field is required
     *
     * @returns {boolean}
     */

  }, {
    key: 'required',
    get: function get() {
      return (this._descriptor.constraints || {}).required === true;
    }

    /**
     * Field constraints
     *
     * @returns {Object}
     */

  }, {
    key: 'constraints',
    get: function get() {
      return this._descriptor.constraints || {};
    }

    /**
     * Field descriptor
     *
     * @returns {Object}
     */

  }, {
    key: 'descriptor',
    get: function get() {
      return this._descriptor;
    }
  }]);

  return Field;
}();

// System

module.exports = {
  Field: Field
};