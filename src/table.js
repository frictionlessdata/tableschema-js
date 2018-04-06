const fs = require('fs')
const csv = require('csv')
const axios = require('axios')
const {Readable, PassThrough} = require('stream')
const zip = require('lodash/zip')
const isEqual = require('lodash/isEqual')
const isArray = require('lodash/isArray')
const isMatch = require('lodash/isMatch')
const isInteger = require('lodash/isInteger')
const isFunction = require('lodash/isFunction')
const zipObject = require('lodash/zipObject')
const S2A = require('stream-to-async-iterator').default
const CSVSniffer = require('csv-sniffer')()
const {TableSchemaError} = require('./errors')
const {Schema} = require('./schema')
const helpers = require('./helpers')
const config = require('./config')


// Module API

class Table {

  // Public

  /**
   * https://github.com/frictionlessdata/tableschema-js#table
   */
  static async load(source, {
    schema,
    strict=false,
    headers=1,
    format=config.DEFAULT_FORMAT,
    encoding=config.DEFAULT_ENCODING,
    ...parserOptions
  }={}) {

    // Load schema
    if (schema && !(schema instanceof Schema)) {
      schema = await Schema.load(schema, {strict})
    }

    return new Table(source, {schema, strict, headers, format, encoding, ...parserOptions})
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#table
   */
  get headers() {
    return this._headers
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#table
   */
  get schema() {
    return this._schema
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#table
   */
  async iter({keyed, extended, cast=true, relations=false, stream=false, forceCast=false}={}) {
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
    const tableRowStream = rowStream.pipe(csv.transform(row => {
      rowNumber += 1

      // Get headers
      if (rowNumber === this._headersRow) {
        this._headers = row
        return
      }

      // Check headers
      if (cast) {
        if (this.schema && this.headers) {
          if (!isEqual(this.headers, this.schema.fieldNames)) {
            const error = new TableSchemaError(
              'The column header names do not match the field names in the schema')
            error.rowNumber = rowNumber
            if (forceCast) return error
            throw error
          }
        }
      }

      // Cast row
      if (cast) {
        if (this.schema) {
          try {
            row = this.schema.castRow(row, {failFast: false})
          } catch (error) {
            error.rowNumber = rowNumber
            error.errors.forEach(error => {error.rowNumber = rowNumber})
            if (forceCast) return error
            throw error
          }
        }
      }

      // Check unique
      if (cast) {
        for (const [indexes, cache] of Object.entries(uniqueFieldsCache)) {
          const splitIndexes = indexes.split(',').map(index => parseInt(index, 10))
          const values = row.filter((value, index) => splitIndexes.includes(index))
          if (!values.every(value => value === null)) {
            if (cache.data.has(values.toString())) {
              const error = new TableSchemaError(
                `Row ${rowNumber} has an unique constraint ` +
                `violation in column "${cache.name}"`)
              error.rowNumber = rowNumber
              if (forceCast) return error
              throw error
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
                `Foreign key "${foreignKey.fields}" violation in row ${rowNumber}`)
              error.rowNumber = rowNumber
              if (forceCast) return error
              throw error
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

      return row
    }))

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
    return new S2A(tableRowStream)

  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#table
   */
  async read({keyed, extended, cast=true, relations=false, limit, forceCast=false}={}) {

    // Get rows
    const iterator = await this.iter({keyed, extended, cast, relations, forceCast})
    const rows = []
    let count = 0
    for (;;) {
      count += 1
      const iteration = await iterator.next()
      if (iteration.done) break
      rows.push(iteration.value)
      if (limit && (count >= limit)) break
    }

    return rows
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#table
   */
  async infer({limit=100}={}) {
    if (!this._schema || !this._headers) {

      // Headers
      const sample = await this.read({limit, cast: false})

      // Schema
      if (!this.schema) {
        const schema = new Schema()
        schema.infer(sample, {headers: this.headers})
        this._schema = new Schema(schema.descriptor, {strict: this._strict})
      }

    }
    return this._schema.descriptor
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#table
   */
  async save(target) {
    const rowStream = await this.iter({keyed: true, stream: true})
    const textStream = rowStream.pipe(csv.stringify({header: true}))
    textStream.pipe(fs.createWriteStream(target))
  }

  // Private

  constructor(source, {
    schema,
    strict=false,
    headers=1,
    format=config.DEFAULT_FORMAT,
    encoding=config.DEFAULT_ENCODING,
    ...parserOptions
  }={}) {

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
  const parser = csv.parse({ltrim: true, relax_column_count: true, ...parserOptions})
  let stream

  // Stream factory
  if (isFunction(source)) {
    stream = source()

  // Node stream
  } else if (source.readable) {
    stream = source

  // Inline source
  } else if (isArray(source)) {
    stream = new Readable({objectMode: true})
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
      const response = await axios.get(source, {responseType: 'stream'})
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
 * Detects the CSV delimiter, updating the received `csvParser` options.
 *
 * It will use the first chunk to detect the CSV delimiter, and update it on
 * `csvParser.options.delimiter`. After this is finished, no further processing
 * will be done.
 *
 * @param {module:csv/parse} csvParser - The csv.parse() instance
 * @return {module:stream/PassThrough}
 */
function createCsvDelimiterDetector(csvParser) {
  const detector = PassThrough()
  const sniffer = new CSVSniffer()
  let done = false

  detector.on('data', (chunk) => {
    if (!done) {
      const result = sniffer.sniff(chunk.toString())
      csvParser.options.delimiter = result.delimiter
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
