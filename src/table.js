import fs from 'fs'
import url from 'url'
import http from 'http'
import https from 'https'
import lodash from 'lodash'
import EventEmitter from 'events'
import parse from 'csv-parse'
import transform from 'stream-transform'
import * as helpers from './helpers'
import {Schema} from './schema'


// Module API

export class Table {

  // Public

  /**
   * Load table
   * https://github.com/frictionlessdata/tableschema-js#table
   */
  static async load(source, {schema}) {
    if (!(schema instanceof Schema)) {
      schema = await Schema.load(schema)
    }
    return new Table(source, {schema})
  }

  /**
   * Table schema
   * https://github.com/frictionlessdata/tableschema-js#table
   */
  get schema() {
    return this._schema
  }

  /**
   * Table headers
   * https://github.com/frictionlessdata/tableschema-js#table
   */
  get headers() {
    // For now we use here fieldNames from schema
    // but it should be headers from data source
    return this._schema.fieldNames
  }

  /**
   * Iter table data
   * https://github.com/frictionlessdata/tableschema-js#table
   */
  iter({cast, callback}={cast: true}) {
    const primaryKey = this.schema.primaryKey
    let uniqueHeaders = getUniqueHeaders(this.schema)
    if (primaryKey && primaryKey.length > 1) {
      const headers = this.schema.fieldNames
      uniqueHeaders = lodash.difference(uniqueHeaders, primaryKey)
      // using to check unique constraints for the row, because need to check
      // uniquness of the values combination (primary key for example)
      this.primaryHeaders = {}
      lodash.forEach(primaryKey, header => {
        // need to know the index of the header, so later it possible to
        // combine correct values in the row
        this.primaryHeaders[header] = headers.indexOf(header)
      })
    }
    // TODO: reimplement
    // That's very wrong - this method must not update the schema
    this.uniqueness = {}
    this.schema.uniqueness = this.uniqueness
    // using for regular unique constraints for every value independently
    this.schema.uniqueHeaders = uniqueHeaders
    // TODO: remove callback
    if (!callback) callback = row => row
    const failFast = false
    const skipConstraints = false
    const stream = getReadStream(this.source)
    return proceed(this, stream, callback, failFast, skipConstraints, cast)
  }

  /**
   * Read table data
   * https://github.com/frictionlessdata/tableschema-js#table
   */
  read({keyed, extended, cast, limit}={keyed: false, extended: false, cast: true}) {
    const self = this
      , headers = this.schema.fieldNames
      , result = []
    return new Promise((resolve, reject) => {
      let index = 1
      const callback = items => {
        if (!(limit && index > limit)) {
          if (keyed) {
            result.push(lodash.zipObject(headers, items))
          } else if (extended) {
            const object = {}
            object[index] = lodash.zipObject(headers, items)
            result.push(object)
          } else {
            result.push(items)
          }
          index += 1
        }
      }
      self.iter({cast, callback}).then(() => {
        resolve(result)
      }, errors => {
        reject(errors)
      })
    })
  }

  /**
   * Save table data
   * https://github.com/frictionlessdata/tableschema-js#table
   */
  save(path) {
    const self = this
    return new Promise((resolve, reject) => {
      getReadStream(self.source).then(data => {
        const writableStream = fs.createWriteStream(path, { encoding: 'utf8' })
        writableStream.write(`${self.schema.fieldNames.join(',')}\r\n`)

        data.stream.on('data', chunk => {
          if (data.isArray) {
            chunk = chunk.join(',')
            chunk += '\r\n'
          }
          writableStream.write(chunk)
        }).on('end', () => {
          writableStream.end()
          resolve()
        })
      }).catch(error => {
        reject(error)
      })
    })
  }

  // Private

  constructor(source, {schema}) {
    this.source = source
    this._schema = schema
  }

}


// Internal

/**
 * Convert provided data to the types of the current schema. If the option
 * `failFast` is given, it will raise the first error it encounters,
 * otherwise an array of errors thrown (if there are any errors occur).
 *
 * @param readStream
 * @param callback
 * @param failFast
 * @param skipConstraints
 */
function proceed(instance, readStream, callback, failFast = false
               , skipConstraints = false, doCast = true) {
  return new Promise((resolve, reject) => {
    const parser = parse()
      , errors = []
    let isFirst = true

    readStream.then(data => {
      if (data.isArray) {
        data.stream.on('data', items => {
          cast(instance, reject, callback, errors, items, failFast,
               skipConstraints, doCast)
        }).on('end', () => {
          end(resolve, reject, errors)
        })
      } else {
        data.stream.pipe(parser)
      }
    }, error => {
      reject(error)
    })

    parser.on('readable', () => {
      let items
      while ((items = parser.read()) !== null) {
        if (isFirst) {
          isFirst = false
        } else {
          cast(instance, reject, callback, errors, items, failFast,
               skipConstraints, doCast)
        }
      }
    }).on('end', () => {
      end(resolve, reject, errors)
    })
  })
}

/**
 * Get all headers with unique constraints set to true
 * @returns {Array}
 */
function getUniqueHeaders(schema) {
  const filtered = []
  lodash.forEach(schema.fields, F => {
    if (F.constraints.unique === true) {
      filtered.push(F.name)
    }
  })
  return filtered
}

/**
 * Create reabale stream accordingly to the type of the source
 *
 * @param source. Can be:
 * array
 * stream
 * path to local file
 * path to remote file
 * @param callback - receive readable stream
 *
 * @returns Promise with readable stream object on resolve
 */
function getReadStream(source) {
  return new Promise((resolve, reject) => {
    if (isReadStream(source)) {
      // it can be readable stream by it self
      resolve({ stream: source })
    } else if (lodash.isArray(source)) {
      // provided array with raw data
      const transformer = transform(data => data)
      resolve({ stream: transformer, isArray: true })
      source.forEach(item => {
        transformer.write(item)
      })
      transformer.end()
    } else if (lodash.isString(source)) {
      // probably it is some URL or local path to the file with the data
      const protocol = url.parse(source).protocol
      if (helpers.isURL(protocol)) {
        const processor = protocol.indexOf('https') !== -1 ? https : http
        // create readable stream from remote file
        processor.get(source, res => {
          resolve({ stream: res })
        }, error => {
          reject(error)
        })
      } else {
        // assume that it is path to local file
        // create readable stream
        resolve({ stream: fs.createReadStream(source) })
      }
    } else {
      reject('Unsupported format of source')
    }
  })
}

/**
 * Check if provided value is readable stream
 *
 * @param stream
 * @returns {boolean}
 */
function isReadStream(stream) {
  return stream instanceof EventEmitter && lodash.isFunction(stream.read)
}

function cast(instance, reject, callback, errors, items, failFast
            , skipConstraints, doCast) {
  try {
    let values = items
    if (doCast) {
      values = instance.schema.castRow(values, {failFast, skipConstraints})
      if (!skipConstraints && instance.primaryHeaders) {
        // unique constraints available only from Resource
        helpers.checkUniquePrimary(values, instance.primaryHeaders,
                                         instance.uniqueness)
      }
    }
    callback(values)
  } catch (e) {
    if (failFast === true) {
      reject(e)
      return
    }
    if (lodash.isArray(e)) {
      lodash.forEach(e, error => {
        errors.push(error)
      })
    } else {
      errors.push(e)
    }
  }
}

function end(resolve, reject, errors) {
  if (errors.length > 0) {
    reject(errors)
  } else {
    resolve()
  }
}
