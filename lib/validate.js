'use strict';

// Module API

/**
 * This function is async so it has to be used with `await` keyword or as a `Promise`.
 *
 * @param {(string|Object)} descriptor - schema descriptor (one of):
 *   - local path
 *   - remote url
 *   - object
 * @returns {Object} returns `{valid, errors}` object
 */
var validate = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(descriptor) {
    var _ref2, valid, errors;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return Schema.load(descriptor);

          case 2:
            _ref2 = _context.sent;
            valid = _ref2.valid;
            errors = _ref2.errors;
            return _context.abrupt('return', { valid: valid, errors: errors });

          case 6:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function validate(_x) {
    return _ref.apply(this, arguments);
  };
}();

// System

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var _require = require('./schema'),
    Schema = _require.Schema;

module.exports = {
  validate: validate
};