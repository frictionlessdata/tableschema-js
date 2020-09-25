const fs = require('fs')
const axios = require('axios')
const csv = require('csv-parse/lib/es5')
const through2 = require('through2')
const { Readable, PassThrough } = require('stream')
const zip = require('lodash/zip')
const isEqual = require('lodash/isEqual')
const isArray = require('lodash/isArray')
const isMatch = require('lodash/isMatch')
const isInteger = require('lodash/isInteger')
const isFunction = require('lodash/isFunction')
const zipObject = require('lodash/zipObject')
const S2A = require('stream-to-async-iterator').default
const CSVSniffer = require('csv-sniffer')()
const { TableSchemaError } = require('./errors')
const { Schema } = require('./schema')
const helpers = require('./helpers')
const config = require('./config')

// Module API

/**
 * Table representation
 */
class Table {
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
  static async load(
    source,
    {
      schema,
      strict = false,
      headers = 1,
      format = config.DEFAULT_FORMAT,
      encoding = config.DEFAULT_ENCODING,
      ...parserOptions
    } = {}
  ) {
    // Load schema
    if (schema && !(schema instanceof Schema)) {
      schema = await Schema.load(schema, { strict })
    }

    return new Table(source, { schema, strict, headers, format, encoding, ...parserOptions })
  }

  /**
   * Headers
   *
   * @returns {string[]} data source headers
   */
  get headers() {
    return this._headers
  }

  /**
   * Schema
   *
   * @returns {Schema} table schema instance
   */
  get schema() {
    return this._schema
  }

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
  async iter({
    keyed,
    extended,
    cast = true,
    relations = false,
    stream = false,
    forceCast = false,
  } = {}) {
    const source = this._source

    // Prepare unique checks
    let uniqueFieldsCache = {}
    if (cast) {
      if (this.schema) {
        uniqueFieldsCache = createUniqueFieldsCache(this.schema)
      }
    }

    // Get row stream
    const rowStream = await createRowStream(source, this._encoding, this._parserOptions)

    // Get table row stream
    let rowNumber = 0
    const tableRowStream = rowStream.pipe(
      through2.obj((row, _encoding, done) => {
        rowNumber += 1

        // Get headers
        if (rowNumber === this._headersRow) {
          this._headers = row
          return done()
        }

        // Check headers
        if (cast) {
          if (this.schema && this.headers) {
            if (!isEqual(this.headers, this.schema.fieldNames)) {
              const error = new TableSchemaError(
                'The column header names do not match the field names in the schema'
              )
              error.rowNumber = rowNumber
              error.headerNames = this.headers
              error.fieldNames = this.fieldNames
              if (forceCast) return done(null, error)
              return done(error)
            }
          }
        }

        // Cast row
        if (cast) {
          if (this.schema) {
            try {
              row = this.schema.castRow(row, { failFast: false })
            } catch (error) {
              error.rowNumber = rowNumber
              error.errors.forEach((error) => {
                error.rowNumber = rowNumber
              })
              if (forceCast) return done(null, error)
              return done(error)
            }
          }
        }

        // Check unique
        if (cast) {
          for (const [indexes, cache] of Object.entries(uniqueFieldsCache)) {
            const splitIndexes = indexes.split(',').map((index) => parseInt(index, 10))
            const values = row.filter((value, index) => splitIndexes.includes(index))
            if (!values.every((value) => value === null)) {
              if (cache.data.has(values.toString())) {
                const error = new TableSchemaError(
                  `Row ${rowNumber} has an unique constraint ` +
                    `violation in column "${cache.name}"`
                )
                error.rowNumber = rowNumber
                if (forceCast) return done(null, error)
                return done(error)
              }
              cache.data.add(values.toString())
            }
          }
        }

        // Resolve relations
        if (relations) {
          if (this.schema) {
            for (const foreignKey of this.schema.foreignKeys) {
              row = resolveRelations(row, this.headers, relations, foreignKey)
              if (row === null) {
                const error = new TableSchemaError(
                  `Foreign key "${foreignKey.fields}" violation in row ${rowNumber}`
                )
                error.rowNumber = rowNumber
                if (forceCast) return done(null, error)
                return done(error)
              }
            }
          }
        }

        // Form row
        if (keyed) {
          row = zipObject(this.headers, row)
        } else if (extended) {
          row = [rowNumber, this.headers, row]
        }

        done(null, row)
      })
    )

    // Handle csv errors
    rowStream.on('error', () => {
      const error = new TableSchemaError('Data source parsing error')
      tableRowStream.emit('error', error)
    })

    // Return stream
    if (stream) {
      return tableRowStream
    }

    // Return iterator
    return Symbol.asyncIterator in tableRowStream ? tableRowStream : new S2A(tableRowStream)
  }

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
  async read({ keyed, extended, cast = true, relations = false, limit, forceCast = false } = {}) {
    const stream = await this.iter({ keyed, extended, cast, relations, forceCast, stream: true })
    const rows = []
    let count = 0
    return new Promise((resolve, reject) => {
      stream.on('data', (row) => {
        if (limit && count >= limit) return stream.destroy()
        rows.push(row)
        count += 1
      })
      stream.on('error', reject)
      stream.on('close', () => resolve(rows))
      stream.on('end', () => resolve(rows))
    })
  }

  /**
   * Infer a schema for the table.
   *
   * It will infer and set Table Schema to `table.schema` based on table data.
   *
   * @param {number} limit - limit rows sample size
   * @returns {Object} Table Schema descriptor
   */
  async infer({ limit = 100 } = {}) {
    if (!this._schema || !this._headers) {
      // Headers
      const sample = await this.read({ limit, cast: false })

      // Schema
      if (!this.schema) {
        const schema = new Schema()
        schema.infer(sample, { headers: this.headers })
        this._schema = new Schema(schema.descriptor, { strict: this._strict })
      }
    }
    return this._schema.descriptor
  }

  /**
   * Save data source to file locally in CSV format with `,` (comma) delimiter
   *
   * @param {string} target  - path where to save a table data
   * @throws {TableSchemaError} an error if there is saving problem
   * @returns {Boolean} true on success
   */
  async save(target) {
    const rowStream = await this.iter({ keyed: true, stream: true })
    const textStream = rowStream.pipe(csv.stringify({ header: true }))
    textStream.pipe(fs.createWriteStream(target))
  }

  // Private

  constructor(
    source,
    {
      schema,
      strict = false,
      headers = 1,
      format = config.DEFAULT_FORMAT,
      encoding = config.DEFAULT_ENCODING,
      ...parserOptions
    } = {}
  ) {
    // Not supported formats
    if (!['csv'].includes(format)) {
      throw new TableSchemaError(`Tabular format "${format}" is not supported`)
    }

    // Set attributes
    this._source = source
    this._schema = schema
    this._strict = strict
    this._format = format
    this._encoding = encoding
    this._parserOptions = parserOptions

    // Headers
    this._headers = null
    this._headersRow = null
    if (isArray(headers)) {
      this._headers = headers
    } else if (isInteger(headers)) {
      this._headersRow = headers
    }
  }
}

// Internal

async function createRowStream(source, encoding, parserOptions) {
  const parser = csv({ ltrim: true, relax_column_count: true, ...parserOptions })
  let stream

  // Stream factory
  if (isFunction(source)) {
    stream = source()

    // Node stream
  } else if (source.readable) {
    stream = source

    // Inline source
  } else if (isArray(source)) {
    stream = new Readable({ objectMode: true })
    for (const row of source) stream.push(row)
    stream.push(null)

    // Remote source
    // For now only utf-8 encoding is supported:
    // https://github.com/axios/axios/issues/332
  } else if (helpers.isRemotePath(source)) {
    if (config.IS_BROWSER) {
      const response = await axios.get(source)
      stream = new Readable()
      stream.push(response.data)
      stream.push(null)
    } else {
      const response = await axios.get(source, { responseType: 'stream' })
      stream = response.data
    }

    // Local source
  } else {
    if (config.IS_BROWSER) {
      throw new TableSchemaError('Local paths are not supported in the browser')
    } else {
      stream = fs.createReadStream(source)
      stream.setEncoding(encoding)
    }
  }

  // Parse CSV unless it's already parsed
  if (!isArray(source)) {
    if (parserOptions.delimiter === undefined) {
      const csvDelimiterDetector = createCsvDelimiterDetector(parser)
      stream.pipe(csvDelimiterDetector)
    }
    stream = stream.pipe(parser)
  }

  return stream
}

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
function createCsvDelimiterDetector(csvParser) {
  const detector = PassThrough()
  const sniffer = new CSVSniffer()
  let done = false

  detector.on('data', (chunk) => {
    if (!done) {
      let delimiter = sniffer.sniff(chunk.toString()).delimiter || ','
      if (delimiter.match(/[a-zA-Z0-9+]/)) delimiter = ','
      csvParser.options.delimiter = Buffer.from(delimiter, 'utf-8')
      done = true
    }
  })

  return detector
}

function createUniqueFieldsCache(schema) {
  const primaryKeyIndexes = []
  const cache = {}

  // Unique
  for (const [index, field] of schema.fields.entries()) {
    if (!field) continue
    if (schema.primaryKey.includes(field.name)) {
      primaryKeyIndexes.push(index)
    }
    if (field.constraints.unique) {
      cache[index.toString()] = {
        name: field.name,
        data: new Set(),
      }
    }
  }

  // Primary key
  if (primaryKeyIndexes.length) {
    cache[primaryKeyIndexes.join(',')] = {
      name: schema.primaryKey.join(', '),
      data: new Set(),
    }
  }

  return cache
}

function resolveRelations(row, headers, relations, foreignKey) {
  // Prepare helpers - needed data structures
  const keyedRow = new Map(zip(headers, row))
  const fields = zip(foreignKey.fields, foreignKey.reference.fields)
  const reference = relations[foreignKey.reference.resource]
  if (!reference) {
    return row
  }

  // Collect values - valid if all null
  let valid = true
  const values = {}
  for (const [field, refField] of fields) {
    if (field && refField) {
      values[refField] = keyedRow.get(field)
      if (keyedRow.get(field) !== null) {
        valid = false
      }
    }
  }

  // Resolve values - valid if match found
  if (!valid) {
    for (const refValues of reference) {
      if (isMatch(refValues, values)) {
        for (const [field] of fields) keyedRow.set(field, refValues)
        valid = true
        break
      }
    }
  }

  return valid ? Array.from(keyedRow.values()) : null
}

// System

module.exports = {
  Table,
}
