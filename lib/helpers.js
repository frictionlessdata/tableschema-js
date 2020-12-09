'use strict';

// Retrieve descriptor

var retrieveDescriptor = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(descriptor) {
    var res;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!isPlainObject(descriptor)) {
              _context.next = 4;
              break;
            }

            descriptor = cloneDeep(descriptor);

            // Remote
            _context.next = 24;
            break;

          case 4:
            if (!isRemotePath(descriptor)) {
              _context.next = 13;
              break;
            }

            _context.next = 7;
            return axios.get(descriptor);

          case 7:
            res = _context.sent;

            descriptor = res.data;

            // Loading error

            if (!(res.status >= 400)) {
              _context.next = 11;
              break;
            }

            throw new TableSchemaError('Can\'t load descriptor at "' + descriptor + '"');

          case 11:
            _context.next = 24;
            break;

          case 13:
            if (!config.IS_BROWSER) {
              _context.next = 15;
              break;
            }

            throw new TableSchemaError('Local paths are not supported in browser');

          case 15:
            _context.prev = 15;
            _context.next = 18;
            return new Promise(function (resolve, reject) {
              fs.readFile(descriptor, 'utf-8', function (error, data) {
                if (error) reject(error);
                try {
                  resolve(JSON.parse(data));
                } catch (error) {
                  reject(error);
                }
              });
            });

          case 18:
            descriptor = _context.sent;
            _context.next = 24;
            break;

          case 21:
            _context.prev = 21;
            _context.t0 = _context['catch'](15);
            throw new TableSchemaError('Can\'t load descriptor at "' + descriptor + '"');

          case 24:
            return _context.abrupt('return', descriptor);

          case 25:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[15, 21]]);
  }));

  return function retrieveDescriptor(_x) {
    return _ref.apply(this, arguments);
  };
}();

// Expand descriptor

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var fs = require('fs');
var axios = require('axios');
var cloneDeep = require('lodash/cloneDeep');
var isPlainObject = require('lodash/isPlainObject');

var _require = require('./errors'),
    TableSchemaError = _require.TableSchemaError;

var config = require('./config');function expandSchemaDescriptor(descriptor) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (descriptor.fields || [])[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var field = _step.value;

      expandFieldDescriptor(field);
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

  if (!descriptor.missingValues) descriptor.missingValues = config.DEFAULT_MISSING_VALUES;
  return descriptor;
}

function expandFieldDescriptor(descriptor) {
  if (descriptor instanceof Object) {
    if (!descriptor.type) descriptor.type = config.DEFAULT_FIELD_TYPE;
    if (!descriptor.format) descriptor.format = config.DEFAULT_FIELD_FORMAT;
  }
  return descriptor;
}

// Date/time conversion
// https://gist.github.com/jamesguan/5d54454c1a88f63c30cf3c5fb4d0fc20

/*
 * Description: Convert a python format string to javascript format string
 * Example:     "%m/%d/%Y" to "MM/DD/YYYY"
 * @param:  formatStr is the python format string
 * @return: the javascript format string
 */
function convertDatetimeFormatFromFDtoJS(formatStr) {
  for (var key in DATETIME_FORMATS_MAP_FROM_FD_TO_JS) {
    formatStr = formatStr.split(key).join(DATETIME_FORMATS_MAP_FROM_FD_TO_JS[key]);
  }
  return formatStr;
}

/* Key: Python format
 * Value: Javascript format
 */
var DATETIME_FORMATS_MAP_FROM_FD_TO_JS = Object.freeze({
  '%A': 'dddd', // Weekday as locale’s full name: (In English: Sunday, .., Saturday)(Auf Deutsch: Sonntag, .., Samstag)
  '%a': 'ddd', // Weekday abbreivated: (In English: Sun, .., Sat)(Auf Deutsch: So, .., Sa)
  '%B': 'MMMM', // Month name: (In English: January, .., December)(Auf Deutsch: Januar, .., Dezember)
  '%b': 'MMM', // Month name abbreviated: (In English: Jan, .., Dec)(Auf Deutsch: Jan, .., Dez)
  '%c': 'ddd MMM DD HH:mm:ss YYYY', // Locale’s appropriate date and time representation: (English: Sun Oct 13 23:30:00 1996)(Deutsch: So 13 Oct 22:30:00 1996)
  '%d': 'DD', // Day 0 padded: (01, .., 31)
  '%f': 'SSS', // Microseconds 0 padded: (000000, .., 999999)
  '%H': 'HH', // Hour (24-Hour) 0 padded: (00, .., 23)
  '%I': 'hh', // Hour (12-Hour) 0 padded: (01, .., 12)
  '%j': 'DDDD', // Day of Year 0 padded: (001, .., 366)
  '%M': 'mm', // Minute 0 padded: (01, .. 59)
  '%m': 'MM', // Month 0 padded: (01, .., 12)
  '%p': 'A', // Locale equivalent of AM/PM: (EN: AM, PM)(DE: am, pm)
  '%S': 'ss', // Second 0 padded: (00, .., 59)
  '%U': 'ww', // Week # of Year (Sunday): (00, .., 53)  All days in a new year preceding the first Sunday are considered to be in week 0.
  '%W': 'ww', // Week # of Year (Monday): (00, .., 53)  All days in a new year preceding the first Monday are considered to be in week 0.
  '%w': 'd', // Weekday as #: (0, 6)
  '%X': 'HH:mm:ss', // Locale's appropriate time representation: (EN: 23:30:00)(DE: 23:30:00)
  '%x': 'MM/DD/YYYY', // Locale's appropriate date representation: (None: 02/14/16)(EN: 02/14/16)(DE: 14.02.16)
  '%Y': 'YYYY', // Year as #: (1970, 2000, 2038, 292,277,026,596)
  '%y': 'YY', // Year without century 0 padded: (00, .., 99)
  '%Z': 'z', // Time zone name: ((empty), UTC, EST, CST) (empty string if the object is naive).
  '%z': 'ZZ', // UTC offset in the form +HHMM or -HHMM: ((empty), +0000, -0400, +1030) Empty string if the the object is naive.
  '%%': '%' // A literal '%' character: (%)
});

// Miscellaneous

function isRemotePath(path) {
  // TODO: improve implementation
  return path.startsWith('http');
}

// System

module.exports = {
  retrieveDescriptor: retrieveDescriptor,
  expandSchemaDescriptor: expandSchemaDescriptor,
  expandFieldDescriptor: expandFieldDescriptor,
  convertDatetimeFormatFromFDtoJS: convertDatetimeFormatFromFDtoJS,
  isRemotePath: isRemotePath
};