'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var tv4 = require('tv4');
var isArray = require('lodash/isArray');
var isString = require('lodash/isString');

var _require = require('./errors'),
    TableSchemaError = _require.TableSchemaError;

// Module API

var Profile = function () {
  _createClass(Profile, [{
    key: 'validate',
    value: function validate(descriptor) {
      var errors = [];

      // Basic validation
      var validation = tv4.validateMultiple(descriptor, this._jsonschema);
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = validation.errors[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var validationError = _step.value;

          errors.push(new Error('Descriptor validation error:\n        ' + validationError.message + '\n        at "' + validationError.dataPath + '" in descriptor and\n        at "' + validationError.schemaPath + '" in profile'));
        }

        // Extra validation
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

      if (!errors.length) {
        // PrimaryKey validation
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = validatePrimaryKey(descriptor)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var message = _step2.value;

            errors.push(new Error(message));
          }

          // ForeignKeys validation
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

        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = validateForeignKeys(descriptor)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var _message = _step3.value;

            errors.push(new Error(_message));
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }
      }

      return {
        valid: !errors.length,
        errors: errors
      };
    }

    // Private

  }, {
    key: 'name',
    get: function get() {
      if (!this._jsonschema.title) return null;
      return this._jsonschema.title.replace(' ', '-').toLowerCase();
    }
  }, {
    key: 'jsonschema',
    get: function get() {
      return this._jsonschema;
    }
  }], [{
    key: 'load',

    // Public

    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(profile) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                return _context.abrupt('return', new Profile(profile));

              case 1:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function load(_x) {
        return _ref.apply(this, arguments);
      }

      return load;
    }()
  }]);

  function Profile(profile) {
    _classCallCheck(this, Profile);

    this._profile = profile;
    try {
      this._jsonschema = require('./profiles/' + profile + '.json'); // eslint-disable-line
    } catch (error) {
      throw new TableSchemaError('Can\'t load profile "' + profile + '"');
    }
  }

  return Profile;
}();

// Internal

function validatePrimaryKey(descriptor) {
  var messages = [];
  var fieldNames = (descriptor.fields || []).map(function (field) {
    return field.name;
  });
  if (descriptor.primaryKey) {
    var primaryKey = descriptor.primaryKey;
    if (isString(primaryKey)) {
      if (!fieldNames.includes(primaryKey)) {
        messages.push('primary key ' + primaryKey + ' must match schema field names');
      }
    } else if (isArray(primaryKey)) {
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = primaryKey[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var pk = _step4.value;

          if (!fieldNames.includes(pk)) {
            messages.push('primary key ' + pk + ' must match schema field names');
          }
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }
  }
  return messages;
}

function validateForeignKeys(descriptor) {
  var messages = [];
  var fieldNames = (descriptor.fields || []).map(function (field) {
    return field.name;
  });
  if (descriptor.foreignKeys) {
    var foreignKeys = descriptor.foreignKeys;
    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
      for (var _iterator5 = foreignKeys[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
        var fk = _step5.value;

        if (isString(fk.fields)) {
          if (!fieldNames.includes(fk.fields)) {
            messages.push('foreign key ' + fk.fields + ' must match schema field names');
          }
          if (!isString(fk.reference.fields)) {
            messages.push('foreign key ' + fk.reference.fields + ' must be same type as ' + fk.fields);
          }
        } else if (isArray(fk.fields)) {
          var _iteratorNormalCompletion6 = true;
          var _didIteratorError6 = false;
          var _iteratorError6 = undefined;

          try {
            for (var _iterator6 = fk.fields[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
              var field = _step6.value;

              if (!fieldNames.includes(field)) {
                messages.push('foreign key ' + field + ' must match schema field names');
              }
            }
          } catch (err) {
            _didIteratorError6 = true;
            _iteratorError6 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion6 && _iterator6.return) {
                _iterator6.return();
              }
            } finally {
              if (_didIteratorError6) {
                throw _iteratorError6;
              }
            }
          }

          if (!isArray(fk.reference.fields)) {
            messages.push('foreign key ' + fk.reference.fields + ' must be same type as ' + fk.fields);
          } else if (fk.reference.fields.length !== fk.fields.length) {
            messages.push('foreign key fields must have the same length as reference.fields');
          }
        }
        if (fk.reference.resource === '') {
          if (isString(fk.reference.fields)) {
            if (!fieldNames.includes(fk.reference.fields)) {
              messages.push('foreign key ' + fk.fields + ' must be found in the schema field names');
            }
          } else if (isArray(fk.reference.fields)) {
            var _iteratorNormalCompletion7 = true;
            var _didIteratorError7 = false;
            var _iteratorError7 = undefined;

            try {
              for (var _iterator7 = fk.reference.fields[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                var _field = _step7.value;

                if (!fieldNames.includes(_field)) {
                  messages.push('foreign key ' + _field + ' must be found in the schema field names');
                }
              }
            } catch (err) {
              _didIteratorError7 = true;
              _iteratorError7 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion7 && _iterator7.return) {
                  _iterator7.return();
                }
              } finally {
                if (_didIteratorError7) {
                  throw _iteratorError7;
                }
              }
            }
          }
        }
      }
    } catch (err) {
      _didIteratorError5 = true;
      _iteratorError5 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion5 && _iterator5.return) {
          _iterator5.return();
        }
      } finally {
        if (_didIteratorError5) {
          throw _iteratorError5;
        }
      }
    }
  }
  return messages;
}

// System

module.exports = {
  Profile: Profile
};