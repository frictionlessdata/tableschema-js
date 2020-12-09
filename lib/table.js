'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

// Internal

var createRowStream = function () {
  var _ref11 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(source, encoding, parserOptions) {
    var parser, stream, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, row, response, _response, csvDelimiterDetector;

    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            parser = csv(_extends({ ltrim: true, relax_column_count: true }, parserOptions));
            stream = void 0;

            // Stream factory

            if (!isFunction(source)) {
              _context6.next = 6;
              break;
            }

            stream = source();

            // Node stream
            _context6.next = 56;
            break;

          case 6:
            if (!source.readable) {
              _context6.next = 10;
              break;
            }

            stream = source;

            // Inline source
            _context6.next = 56;
            break;

          case 10:
            if (!isArray(source)) {
              _context6.next = 34;
              break;
            }

            stream = new Readable({ objectMode: true });
            _iteratorNormalCompletion3 = true;
            _didIteratorError3 = false;
            _iteratorError3 = undefined;
            _context6.prev = 15;
            for (_iterator3 = source[Symbol.iterator](); !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              row = _step3.value;
              stream.push(row);
            }_context6.next = 23;
            break;

          case 19:
            _context6.prev = 19;
            _context6.t0 = _context6['catch'](15);
            _didIteratorError3 = true;
            _iteratorError3 = _context6.t0;

          case 23:
            _context6.prev = 23;
            _context6.prev = 24;

            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }

          case 26:
            _context6.prev = 26;

            if (!_didIteratorError3) {
              _context6.next = 29;
              break;
            }

            throw _iteratorError3;

          case 29:
            return _context6.finish(26);

          case 30:
            return _context6.finish(23);

          case 31:
            stream.push(null);

            // Remote source
            // For now only utf-8 encoding is supported:
            // https://github.com/axios/axios/issues/332
            _context6.next = 56;
            break;

          case 34:
            if (!helpers.isRemotePath(source)) {
              _context6.next = 50;
              break;
            }

            if (!config.IS_BROWSER) {
              _context6.next = 44;
              break;
            }

            _context6.next = 38;
            return axios.get(source);

          case 38:
            response = _context6.sent;

            stream = new Readable();
            stream.push(response.data);
            stream.push(null);
            _context6.next = 48;
            break;

          case 44:
            _context6.next = 46;
            return axios.get(source, { responseType: 'stream' });

          case 46:
            _response = _context6.sent;

            stream = _response.data;

          case 48:
            _context6.next = 56;
            break;

          case 50:
            if (!config.IS_BROWSER) {
              _context6.next = 54;
              break;
            }

            throw new TableSchemaError('Local paths are not supported in the browser');

          case 54:
            stream = fs.createReadStream(source);
            stream.setEncoding(encoding);

          case 56:

            // Parse CSV unless it's already parsed
            if (!isArray(source)) {
              if (parserOptions.delimiter === undefined) {
                csvDelimiterDetector = createCsvDelimiterDetector(parser);

                stream.pipe(csvDelimiterDetector);
              }
              stream = stream.pipe(parser);
            }

            return _context6.abrupt('return', stream);

          case 58:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this, [[15, 19, 23, 31], [24,, 26, 30]]);
  }));

  return function createRowStream(_x8, _x9, _x10) {
    return _ref11.apply(this, arguments);
  };
}();

/**
 * @ignore
 * Detects the CSV delimiter, updating the received `csvParser` options.
 *
 * It will use the first chunk to detect the CSV delimiter, and update it on
 * `csvParser.options.delimiter`. After this is finished, no further processing
 * will be done.
 *
 * @param {module:csv/parse} csvParser - The csv.parse() instance
 * @returns {module:stream/PassThrough}
 */


function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fs = require('fs');
var axios = require('axios');
var csv = require('csv-parse/lib/es5');
var through2 = require('through2');

var _require = require('stream'),
    Readable = _require.Readable,
    PassThrough = _require.PassThrough;

var zip = require('lodash/zip');
var isEqual = require('lodash/isEqual');
var isArray = require('lodash/isArray');
var isMatch = require('lodash/isMatch');
var isInteger = require('lodash/isInteger');
var isFunction = require('lodash/isFunction');
var zipObject = require('lodash/zipObject');
var S2A = require('stream-to-async-iterator').default;
var CSVSniffer = require('csv-sniffer')();

var _require2 = require('./errors'),
    TableSchemaError = _require2.TableSchemaError;

var _require3 = require('./schema'),
    Schema = _require3.Schema;

var helpers = require('./helpers');
var config = require('./config');

// Module API

/**
 * Table representation
 */

var Table = function () {
  _createClass(Table, [{
    key: 'iter',


    /**
     * Iterate through the table data
     *
     * And emits rows cast based on table schema (async for loop).
     * With a `stream` flag instead of async iterator a Node stream will be returned.
     * Data casting can be disabled.
     *
     * @param {boolean} keyed - iter keyed rows
     * @param {boolean} extended - iter extended rows
     * @param {boolean} cast - disable data casting if false
     * @param {boolean} forceCast - instead of raising on the first row with cast error
     *   return an error object to replace failed row. It will allow
     *   to iterate over the whole data file even if it's not compliant to the schema.
     *   Example of output stream:
     *     `[['val1', 'val2'], TableSchemaError, ['val3', 'val4'], ...]`
     * @param {Object} relations - object of foreign key references in a form of
     *   `{resource1: [{field1: value1, field2: value2}, ...], ...}`.
     *   If provided foreign key fields will checked and resolved to its references
     * @param {boolean} stream - return Node Readable Stream of table rows
     * @throws {TableSchemaError} raises any error occurred in this process
     * @returns {(AsyncIterator|Stream)} async iterator/stream of rows:
     *  - `[value1, value2]` - base
     *  - `{header1: value1, header2: value2}` - keyed
     *  - `[rowNumber, [header1, header2], [value1, value2]]` - extended
     */
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var _this = this;

        var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            keyed = _ref2.keyed,
            extended = _ref2.extended,
            _ref2$cast = _ref2.cast,
            cast = _ref2$cast === undefined ? true : _ref2$cast,
            _ref2$relations = _ref2.relations,
            relations = _ref2$relations === undefined ? false : _ref2$relations,
            _ref2$stream = _ref2.stream,
            stream = _ref2$stream === undefined ? false : _ref2$stream,
            _ref2$forceCast = _ref2.forceCast,
            forceCast = _ref2$forceCast === undefined ? false : _ref2$forceCast;

        var source, uniqueFieldsCache, rowStream, rowNumber, tableRowStream;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                source = this._source;

                // Prepare unique checks

                uniqueFieldsCache = {};

                if (cast) {
                  if (this.schema) {
                    uniqueFieldsCache = createUniqueFieldsCache(this.schema);
                  }
                }

                // Get row stream
                _context.next = 5;
                return createRowStream(source, this._encoding, this._parserOptions);

              case 5:
                rowStream = _context.sent;

                this._detectedParserOptions = {
                  delimiter: rowStream.options ? rowStream.options.delimiter.toString() : null
                  // Get table row stream
                };rowNumber = 0;
                tableRowStream = rowStream.pipe(through2.obj(function (row, _encoding, done) {
                  rowNumber += 1;

                  // Get headers
                  if (rowNumber === _this._headersRow) {
                    _this._headers = row;
                    return done();
                  }

                  // Check headers
                  if (cast) {
                    if (_this.schema && _this.headers) {
                      if (!isEqual(_this.headers, _this.schema.fieldNames)) {
                        var error = new TableSchemaError('The column header names do not match the field names in the schema');
                        error.rowNumber = rowNumber;
                        error.headerNames = _this.headers;
                        error.fieldNames = _this.fieldNames;
                        if (forceCast) return done(null, error);
                        return done(error);
                      }
                    }
                  }

                  // Cast row
                  if (cast) {
                    if (_this.schema) {
                      try {
                        row = _this.schema.castRow(row, { failFast: false });
                      } catch (error) {
                        error.rowNumber = rowNumber;
                        error.errors.forEach(function (error) {
                          error.rowNumber = rowNumber;
                        });
                        if (forceCast) return done(null, error);
                        return done(error);
                      }
                    }
                  }

                  // Check unique
                  if (cast) {
                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                      var _loop = function _loop() {
                        var _step$value = _slicedToArray(_step.value, 2),
                            indexes = _step$value[0],
                            cache = _step$value[1];

                        var splitIndexes = indexes.split(',').map(function (index) {
                          return parseInt(index, 10);
                        });
                        var values = row.filter(function (value, index) {
                          return splitIndexes.includes(index);
                        });
                        if (!values.every(function (value) {
                          return value === null;
                        })) {
                          if (cache.data.has(values.toString())) {
                            var _error = new TableSchemaError('Row ' + rowNumber + ' has an unique constraint ' + ('violation in column "' + cache.name + '"'));
                            _error.rowNumber = rowNumber;
                            if (forceCast) return {
                                v: done(null, _error)
                              };
                            return {
                              v: done(_error)
                            };
                          }
                          cache.data.add(values.toString());
                        }
                      };

                      for (var _iterator = Object.entries(uniqueFieldsCache)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var _ret = _loop();

                        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
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

                  // Resolve relations
                  if (relations) {
                    if (_this.schema) {
                      var _iteratorNormalCompletion2 = true;
                      var _didIteratorError2 = false;
                      var _iteratorError2 = undefined;

                      try {
                        for (var _iterator2 = _this.schema.foreignKeys[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                          var foreignKey = _step2.value;

                          row = resolveRelations(row, _this.headers, relations, foreignKey);
                          if (row === null) {
                            var _error2 = new TableSchemaError('Foreign key "' + foreignKey.fields + '" violation in row ' + rowNumber);
                            _error2.rowNumber = rowNumber;
                            if (forceCast) return done(null, _error2);
                            return done(_error2);
                          }
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
                    }
                  }

                  // Form row
                  if (keyed) {
                    row = zipObject(_this.headers, row);
                  } else if (extended) {
                    row = [rowNumber, _this.headers, row];
                  }

                  done(null, row);
                }));

                // Handle csv errors

                rowStream.on('error', function () {
                  var error = new TableSchemaError('Data source parsing error');
                  tableRowStream.emit('error', error);
                });

                // Return stream

                if (!stream) {
                  _context.next = 12;
                  break;
                }

                return _context.abrupt('return', tableRowStream);

              case 12:
                return _context.abrupt('return', Symbol.asyncIterator in tableRowStream ? tableRowStream : new S2A(tableRowStream));

              case 13:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function iter() {
        return _ref.apply(this, arguments);
      }

      return iter;
    }()

    /**
     * Read the table data into memory
     *
     * > The API is the same as `table.iter` has except for:
     *
     * @param {integer} limit - limit of rows to read
     * @returns {(Array[]|Object[])} list of rows:
     *  - `[value1, value2]` - base
     *  - `{header1: value1, header2: value2}` - keyed
     *  - `[rowNumber, [header1, header2], [value1, value2]]` - extended
     */

  }, {
    key: 'read',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            keyed = _ref4.keyed,
            extended = _ref4.extended,
            _ref4$cast = _ref4.cast,
            cast = _ref4$cast === undefined ? true : _ref4$cast,
            _ref4$relations = _ref4.relations,
            relations = _ref4$relations === undefined ? false : _ref4$relations,
            limit = _ref4.limit,
            _ref4$forceCast = _ref4.forceCast,
            forceCast = _ref4$forceCast === undefined ? false : _ref4$forceCast;

        var stream, rows, count;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.iter({ keyed: keyed, extended: extended, cast: cast, relations: relations, forceCast: forceCast, stream: true });

              case 2:
                stream = _context2.sent;
                rows = [];
                count = 0;
                return _context2.abrupt('return', new Promise(function (resolve, reject) {
                  stream.on('data', function (row) {
                    if (limit && count >= limit) return stream.destroy();
                    rows.push(row);
                    count += 1;
                  });
                  stream.on('error', reject);
                  stream.on('close', function () {
                    return resolve(rows);
                  });
                  stream.on('end', function () {
                    return resolve(rows);
                  });
                }));

              case 6:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function read() {
        return _ref3.apply(this, arguments);
      }

      return read;
    }()

    /**
     * Infer a schema for the table.
     *
     * It will infer and set Table Schema to `table.schema` based on table data.
     *
     * @param {number} limit - limit rows sample size
     * @returns {Object} Table Schema descriptor
     */

  }, {
    key: 'infer',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
        var _ref6 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            _ref6$limit = _ref6.limit,
            limit = _ref6$limit === undefined ? 100 : _ref6$limit;

        var sample, schema;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (!(!this._schema || !this._headers)) {
                  _context3.next = 5;
                  break;
                }

                _context3.next = 3;
                return this.read({ limit: limit, cast: false });

              case 3:
                sample = _context3.sent;


                // Schema
                if (!this.schema) {
                  schema = new Schema();

                  schema.infer(sample, { headers: this.headers });
                  this._schema = new Schema(schema.descriptor, { strict: this._strict });
                }

              case 5:
                return _context3.abrupt('return', this._schema.descriptor);

              case 6:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function infer() {
        return _ref5.apply(this, arguments);
      }

      return infer;
    }()

    /**
     * Save data source to file locally in CSV format with `,` (comma) delimiter
     *
     * @param {string} target  - path where to save a table data
     * @throws {TableSchemaError} an error if there is saving problem
     * @returns {Boolean} true on success
     */

  }, {
    key: 'save',
    value: function () {
      var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(target) {
        var rowStream, textStream;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this.iter({ keyed: true, stream: true });

              case 2:
                rowStream = _context4.sent;
                textStream = rowStream.pipe(csv.stringify({ header: true }));

                textStream.pipe(fs.createWriteStream(target));

              case 5:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function save(_x4) {
        return _ref7.apply(this, arguments);
      }

      return save;
    }()

    // Private

  }, {
    key: 'headers',


    /**
     * Headers
     *
     * @returns {string[]} data source headers
     */
    get: function get() {
      return this._headers;
    }

    /**
     * Schema
     *
     * @returns {Schema} table schema instance
     */

  }, {
    key: 'schema',
    get: function get() {
      return this._schema;
    }

    /**
     * Schema
     *
     * @returns {Schema} table schema instance
     */

  }, {
    key: 'detectedParserOptions',
    get: function get() {
      return this._detectedParserOptions;
    }
  }], [{
    key: 'load',

    // Public

    /**
     * Factory method to instantiate `Table` class.
     *
     * This method is async and it should be used with await keyword or as a `Promise`.
     * If `references` argument is provided foreign keys will be checked
     * on any reading operation.
     *
     * @param {(string|Array[]|Stream|Function)} source - data source (one of):
     *   - local CSV file (path)
     *   - remote CSV file (url)
     *   - array of arrays representing the rows
     *   - readable stream with CSV file contents
     *   - function returning readable stream with CSV file contents
     * @param {(string|Object)} schema - data schema
     *   in all forms supported by `Schema` class
     * @param {boolean} strict - strictness option to pass to `Schema` constructor
     * @param {(number|string[])} headers - data source headers (one of):
     *   - row number containing headers (`source` should contain headers rows)
     *   - array of headers (`source` should NOT contain headers rows)
     * @param {Object} parserOptions - options to be used by CSV parser.
     *   All options listed at <http://csv.adaltas.com/parse/#parser-options>.
     *   By default `ltrim` is true according to the CSV Dialect spec.
     * @throws {TableSchemaError} raises any error occurred in table creation process
     * @returns {Table} data table class instance
     *
     */
    value: function () {
      var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(source) {
        var _ref9 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var schema = _ref9.schema,
            _ref9$strict = _ref9.strict,
            strict = _ref9$strict === undefined ? false : _ref9$strict,
            _ref9$headers = _ref9.headers,
            headers = _ref9$headers === undefined ? 1 : _ref9$headers,
            _ref9$format = _ref9.format,
            format = _ref9$format === undefined ? config.DEFAULT_FORMAT : _ref9$format,
            _ref9$encoding = _ref9.encoding,
            encoding = _ref9$encoding === undefined ? config.DEFAULT_ENCODING : _ref9$encoding,
            parserOptions = _objectWithoutProperties(_ref9, ['schema', 'strict', 'headers', 'format', 'encoding']);

        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (!(schema && !(schema instanceof Schema))) {
                  _context5.next = 4;
                  break;
                }

                _context5.next = 3;
                return Schema.load(schema, { strict: strict });

              case 3:
                schema = _context5.sent;

              case 4:
                return _context5.abrupt('return', new Table(source, _extends({ schema: schema, strict: strict, headers: headers, format: format, encoding: encoding }, parserOptions)));

              case 5:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function load(_x5) {
        return _ref8.apply(this, arguments);
      }

      return load;
    }()
  }]);

  function Table(source) {
    var _ref10 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var schema = _ref10.schema,
        _ref10$strict = _ref10.strict,
        strict = _ref10$strict === undefined ? false : _ref10$strict,
        _ref10$headers = _ref10.headers,
        headers = _ref10$headers === undefined ? 1 : _ref10$headers,
        _ref10$format = _ref10.format,
        format = _ref10$format === undefined ? config.DEFAULT_FORMAT : _ref10$format,
        _ref10$encoding = _ref10.encoding,
        encoding = _ref10$encoding === undefined ? config.DEFAULT_ENCODING : _ref10$encoding,
        parserOptions = _objectWithoutProperties(_ref10, ['schema', 'strict', 'headers', 'format', 'encoding']);

    _classCallCheck(this, Table);

    // Not supported formats
    if (!['csv'].includes(format)) {
      throw new TableSchemaError('Tabular format "' + format + '" is not supported');
    }

    // Set attributes
    this._source = source;
    this._schema = schema;
    this._strict = strict;
    this._format = format;
    this._encoding = encoding;
    this._parserOptions = parserOptions;
    this._detectedParserOptions = null;

    // Headers
    this._headers = null;
    this._headersRow = null;
    if (isArray(headers)) {
      this._headers = headers;
    } else if (isInteger(headers)) {
      this._headersRow = headers;
    }
  }

  return Table;
}();

function createCsvDelimiterDetector(csvParser) {
  var detector = PassThrough();
  var sniffer = new CSVSniffer();
  var done = false;

  detector.on('data', function (chunk) {
    if (!done) {
      var delimiter = sniffer.sniff(chunk.toString()).delimiter || ',';
      if (delimiter.match(/[a-zA-Z0-9+]/)) delimiter = ',';
      csvParser.options.delimiter = Buffer.from(delimiter, 'utf-8');
      done = true;
    }
  });

  return detector;
}

function createUniqueFieldsCache(schema) {
  var primaryKeyIndexes = [];
  var cache = {};

  // Unique
  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = schema.fields.entries()[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var _step4$value = _slicedToArray(_step4.value, 2),
          index = _step4$value[0],
          field = _step4$value[1];

      if (!field) continue;
      if (schema.primaryKey.includes(field.name)) {
        primaryKeyIndexes.push(index);
      }
      if (field.constraints.unique) {
        cache[index.toString()] = {
          name: field.name,
          data: new Set()
        };
      }
    }

    // Primary key
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

  if (primaryKeyIndexes.length) {
    cache[primaryKeyIndexes.join(',')] = {
      name: schema.primaryKey.join(', '),
      data: new Set()
    };
  }

  return cache;
}

function resolveRelations(row, headers, relations, foreignKey) {
  // Prepare helpers - needed data structures
  var keyedRow = new Map(zip(headers, row));
  var fields = zip(foreignKey.fields, foreignKey.reference.fields);
  var reference = relations[foreignKey.reference.resource];
  if (!reference) {
    return row;
  }

  // Collect values - valid if all null
  var valid = true;
  var values = {};
  var _iteratorNormalCompletion5 = true;
  var _didIteratorError5 = false;
  var _iteratorError5 = undefined;

  try {
    for (var _iterator5 = fields[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
      var _step5$value = _slicedToArray(_step5.value, 2),
          field = _step5$value[0],
          refField = _step5$value[1];

      if (field && refField) {
        values[refField] = keyedRow.get(field);
        if (keyedRow.get(field) !== null) {
          valid = false;
        }
      }
    }

    // Resolve values - valid if match found
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

  if (!valid) {
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
      for (var _iterator6 = reference[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
        var refValues = _step6.value;

        if (isMatch(refValues, values)) {
          var _iteratorNormalCompletion7 = true;
          var _didIteratorError7 = false;
          var _iteratorError7 = undefined;

          try {
            for (var _iterator7 = fields[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
              var _step7$value = _slicedToArray(_step7.value, 1),
                  field = _step7$value[0];

              keyedRow.set(field, refValues);
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

          valid = true;
          break;
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
  }

  return valid ? Array.from(keyedRow.values()) : null;
}

// System

module.exports = {
  Table: Table
};