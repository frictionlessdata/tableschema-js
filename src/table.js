const fs = require('fs')
const csv = require('csv')
const axios = require('axios')
const {Readable} = require('stream')
const zip = require('lodash/zip')
const find = require('lodash/find')
const isEqual = require('lodash/isEqual')
const isArray = require('lodash/isArray')
const isEmpty = require('lodash/isEmpty')
const isMatch = require('lodash/isMatch')
const isInteger = require('lodash/isInteger')
const isFunction = require('lodash/isFunction')
const zipObject = require('lodash/zipObject')
const S2A = require('stream-to-async-iterator').default
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
  static async load(source, {schema, strict=false, headers=1, references={}}={}) {

    // Load schema
    if (schema && !(schema instanceof Schema)) {
      schema = await Schema.load(schema, {strict})
    }

    return new Table(source, {schema, strict, headers, references})
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
  async iter({keyed, extended, cast=true, check=true, stream=false}={}) {

    // Get row stream
    const rowStream = await createRowStream(this._source)

    // Resolve references
    if (check) {
      if (isFunction(this._references)) {
        this._references = await this._references()
      }
    }

    // Prepare unique checks
    let uniqueFieldsCache = {}
    if (check) {
      if (this.schema) {
        uniqueFieldsCache = createUniqueFieldsCache(this.schema)
      }
    }

    // Get table row stream
    let rowNumber = 0
    let tableRowStream = rowStream.pipe(csv.transform(row => {
      rowNumber += 1

      // Get headers
      if (rowNumber === this._headersRow) {
        this._headers = row
        return
      }

      // Check headers
      if (check) {
        if (this.schema && this.headers) {
          if (!isEqual(this.headers, this.schema.fieldNames)) {
            const message = 'Table headers don\'t match schema field names'
            throw new TableSchemaError(message)
          }
        }
      }

      // Cast row
      if (cast) {
        if (this.schema) {
          row = this.schema.castRow(row)
        }
      }

      // Check unique
      if (check) {
        for (const [index, cache] of Object.entries(uniqueFieldsCache)) {
          if (cache.has(row[index])) {
            const fieldName = this.schema.fields[index].name
            const message = `Field "${fieldName}" duplicates in row "${rowNumber}"`
            throw new TableSchemaError(message)
          } else {
            cache.add(row[index])
          }
        }
      }

      // Check foreign
      if (check) {
        if (this.schema && !isEmpty(this.schema.foreignKeys)) {
          const keyedRow = zipObject(this.headers, row)
          for (const fk of this.schema.foreignKeys) {
            const reference = this._references[fk.reference.resource]
            if (reference) {
              const values = {}
              for (const [field, refField] of zip(fk.fields, fk.reference.fields)) {
                if (field && refField) values[refField] = keyedRow[field]
              }
              const empty = Object.values(values).every(value => value === null)
              const valid = find(reference, refValues => isMatch(refValues, values))
              if (!empty && !valid) {
                const message = `Foreign key "${fk.fields}" violation in row "${rowNumber}"`
                throw new TableSchemaError(message)
              }
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

    // Form stream
    if (!stream) {
      tableRowStream = new S2A(tableRowStream)
    }

    return tableRowStream
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#table
   */
  async read({keyed, extended, cast=true, check=true, limit}={}) {

    // Get rows
    const iterator = await this.iter({keyed, extended, cast, check})
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
      const sample = await this.read({limit, check: false})

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
    const rowStream = await createRowStream(this._source)
    const textStream = rowStream.pipe(csv.stringify())
    textStream.pipe(fs.createWriteStream(target))
  }

  // Private

  constructor(source, {schema, strict=false, headers=1, references={}}={}) {

    // Set attributes
    this._source = source
    this._schema = schema
    this._strict = strict
    this._references = references

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

async function createRowStream(source) {
  const parseOptions = {
    ltrim: true
  }
  const parser = csv.parse(parseOptions)
  let stream

  // Stream factory
  if (isFunction(source)) {
    stream = source()
    stream = stream.pipe(parser)

  // Inline source
  } else if (isArray(source)) {
    stream = new Readable({objectMode: true})
    for (const row of source) stream.push(row)
    stream.push(null)

  // Remote source
  } else if (helpers.isRemotePath(source)) {
    if (config.IS_BROWSER) {
      const response = await axios.get(source)
      stream = new Readable()
      stream.push(response.data)
      stream.push(null)
      stream = stream.pipe(parser)
    } else {
      const response = await axios.get(source, {responseType: 'stream'})
      stream = response.data
      stream = stream.pipe(parser)
    }

  // Local source
  } else {
    if (config.IS_BROWSER) {
      throw new TableSchemaError('Local paths are not supported in the browser')
    } else {
      stream = fs.createReadStream(source)
      stream = stream.pipe(parser)
    }
  }

  return stream
}


function createUniqueFieldsCache(schema) {
  const cache = {}
  for (const [index, field] of schema.fields.entries()) {
    if (field.constraints.unique || schema.primaryKey.includes(field.name)) {
      cache[index] = new Set()
    }
  }
  return cache
}


// System

module.exports = {
  Table,
}
