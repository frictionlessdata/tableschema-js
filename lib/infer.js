'use strict';

// Module API

/**
 * This function is async so it has to be used with `await` keyword or as a `Promise`.
 *
 * @param {string|Array[]|Stream|Function} source - data source (one of):
 *   - local CSV file (path)
 *   - remote CSV file (url)
 *   - array of arrays representing the rows
 *   - readable stream with CSV file contents
 *   - function returning readable stream with CSV file contents
 * @param {string[]} headers - array of headers
 * @param {Object} options - any `Table.load` options
 * @throws {TableSchemaError} raises any error occured in the process
 * @returns {Object} returns schema descriptor
 */
var infer = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(source) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var table, descriptor;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return Table.load(source, options);

          case 2:
            table = _context.sent;
            _context.next = 5;
            return table.infer({ limit: options.limit });

          case 5:
            descriptor = _context.sent;
            return _context.abrupt('return', descriptor);

          case 7:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function infer(_x) {
    return _ref.apply(this, arguments);
  };
}();

// System

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var _require = require('./table'),
    Table = _require.Table;

module.exports = {
  infer: infer
};