const fs = require('fs')
const csv = require('csv')
const axios = require('axios')
const {Readable} = require('stream')
const zip = require('lodash/zip')
const find = require('lodash/find')
const pick = require('lodash/pick')
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
  static async load(source, {schema, strict=false, headers=1}={}) {

    // Load schema
    if (schema && !(schema instanceof Schema)) {
      schema = await Schema.load(schema, {strict})
    }

    return new Table(source, {schema, strict, headers})
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
  async iter({keyed, extended, cast=true, references={}, stream=false}={}) {
    let rowNumber = 0
    const rowStream = await createRowStream(this._source)
    const uniqueFieldsCache = this.schema ? createUniqueFieldsCache(this.schema) : {}
    const tableRowStream = rowStream.pipe(csv.transform(row => {
      rowNumber += 1

      // Get headers
      if (rowNumber === this._headersRow) {
        this._headers = row
        return
      }

      // Check headers
      if (this.schema && this.headers) {
        if (!isEqual(this.headers, this.schema.fieldNames)) {
          const message = 'Table headers don\'t match schema field names'
          throw new TableSchemaError(message)
        }
      }

      // Cast row
      if (cast) {
        if (this.schema) {
          row = this.schema.castRow(row)
        }
      }

      // Check unique
      for (const [index, cache] of Object.entries(uniqueFieldsCache)) {
        if (cache.has(row[index])) {
          const fieldName = this.schema.fields[index].name
          const message = `Field "${fieldName}" duplicates in row "${rowNumber}"`
          throw new TableSchemaError(message)
        } else {
          cache.add(row[index])
        }
      }

      // Check foreign
      if (this.schema && !isEmpty(this.schema.foreignKeys) && !isEmpty(references)) {
        const keyedRow = zipObject(this.headers, row)
        for (const [fk, ref] of zip(this.schema.foreignKeys, references)) {
          if ([fk, ref].includes(undefined)) break
          const fields = pick(keyedRow, fk.fields)
          const found = find(ref, refFields => isMatch(refFields, fields))
          if (!found) {
            const message = `Table violates foreign key in row "${rowNumber}"`
            throw new TableSchemaError(message)
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
    return (stream) ? tableRowStream : new S2A(tableRowStream)
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#table
   */
  async read({keyed, extended, cast=true, references={}, limit}={}) {

    // Get rows
    const iterator = await this.iter({keyed, extended, cast, references})
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
      const schema = this._schema
      this._schema = null // skip schema checks on read
      const sample = await this.read({limit})
      this._schema = schema

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

  constructor(source, {schema, strict=false, headers=1}={}) {
    this._source = source
    this._schema = schema
    this._strict = strict

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
