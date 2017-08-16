const fs = require('fs')
const csv = require('csv')
const axios = require('axios')
const lodash = require('lodash')
const {Readable} = require('stream')
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
  async iter({keyed, extended, cast=true, stream=false}={}) {
    let rowNumber = 0
    const rowStream = await createRowStream(this._source)
    const uniqueFieldsCache = this.schema ? createUniqueFieldsCache(this.schema) : {}
    const tableRowStream = rowStream.pipe(csv.transform(row => {
      rowNumber += 1

      // Headers
      if (rowNumber === this._headersRow) {
        this._headers = row
        return
      }

      // Cast
      if (cast) {
        if (this.schema) {
          row = this.schema.castRow(row)
        }
      }

      // Unique
      for (const [index, cache] of Object.entries(uniqueFieldsCache)) {
        if (cache.has(row[index])) {
          const fieldName = this.schema.fields[index].name
          const message = `Field "${fieldName}" duplicates in row "${rowNumber}"`
          throw new TableSchemaError(message)
        } else {
          cache.add(row[index])
        }
      }

      // Form
      if (keyed) {
        // TODO: schema.fieldNames to the mix!
        row = lodash.zipObject(this.headers, row)
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
  async read({keyed, extended, cast=true, limit}={}) {
    const iterator = await this.iter({keyed, extended, cast})
    const rows = []
    /* eslint-disable */
    let count = 0
    for (;;) {
      count += 1
      const iteration = await iterator.next()
      if (iteration.done) break
      rows.push(iteration.value)
      if (limit && (count => limit)) break
    }
    /* eslint-enable */
    return rows
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#table
   */
  async infer({limit=100}={}) {
    if (!this.schema) {
      const schema = new Schema()
      const sample = await this.read({limit})
      schema.infer(sample, {headers: this.headers})
      this._schema = new Schema(schema.descriptor, {strict: this._strict})
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
    if (lodash.isArray(headers)) {
      this._headers = headers
    } else if (lodash.isInteger(headers)) {
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
  if (lodash.isFunction(source)) {
    stream = source()
    stream = stream.pipe(parser)

  // Inline source
  } else if (lodash.isArray(source)) {
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
