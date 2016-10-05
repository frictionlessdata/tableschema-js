import EventEmitter from 'events'
import url from 'url'
import fs from 'fs'
import http from 'http'
import https from 'https'
import _ from 'lodash'
import parse from 'csv-parse'
import transform from 'stream-transform'
import Schema from './schema'
import constraints from './constraints'
import utilities from './utilities'

/**
 * @returns Promise
 */
export default class Resource {
  constructor(schema, data) {
    const self = this
    this.source = data

    return new Promise((resolve, reject) => {
      if (schema instanceof Schema) {
        self.schema = schema
        resolve(self)
      } else {
        new Schema(schema).then(model => {
          self.schema = model
          resolve(self)
        }).catch(error => {
          reject(error)
        })
      }
    })
  }

  /**
   * Iter through the given dataset and create the converted dataset
   *
   * @param {Function} callback. Callback function to catch results of casting
   * @param {boolean} failFast. Default is false
   * @param {boolean} skipConstraints. Default is false
   * @throws {Array} of errors if cast failed on some field
   */
  iter(callback, failFast = false, skipConstraints = false) {
    const primaryKey = this.schema.primaryKey()
    let uniqueHeaders = getUniqueHeaders(this.schema)

    if (!_.isFunction(callback)) {
      throw new Error('Callback function is required')
    }

    if (primaryKey && primaryKey.length > 1) {
      const headers = this.schema.headers()
      uniqueHeaders = _.difference(uniqueHeaders, primaryKey)
      // using to check unique constraints for the row, because need to check
      // uniquness of the values combination (primary key for example)
      this.primaryHeaders = {}
      for (const header of primaryKey) {
        // need to know the index of the header, so later it possible to
        // combine correct values in the row
        this.primaryHeaders[header] = headers.indexOf(header)
      }
    }
    this.uniqueness = {}
    this.schema.uniqueness = this.uniqueness
    // using for regular unique constraints for every value independently
    this.schema.uniqueHeaders = uniqueHeaders

    return proceed(this, getReadStream(this.source), callback,
                   failFast,
                   skipConstraints)
  }
}

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
function proceed(instance, readStream, callback, failFast = false,
                 skipConstraints = false) {
  return new Promise((resolve, reject) => {
    const parser = parse()
      , errors = []
    let isFirst = true

    readStream.then(data => {
      if (data.isArray) {
        data.stream.on('data', items => {
          cast(instance, reject, callback, errors, items, failFast,
               skipConstraints)
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
               skipConstraints)
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
  return _.chain(schema.fields())
    .filter(field => field.constraints.unique === true)
    .map(field => field.name)
    .value()
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
    } else if (_.isArray(source)) {
      // provided array with raw data
      const transformer = transform(data => data)
      resolve({ stream: transformer, isArray: true })
      source.forEach(item => {
        transformer.write(item)
      })
      transformer.end()
    } else if (_.isString(source)) {
      // probably it is some URL or local path to the file with the data
      const protocol = url.parse(source).protocol
      if (utilities.isURL(protocol)) {
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
  return stream instanceof EventEmitter && _.isFunction(stream.read)
}

function cast(instance, reject, callback, errors, items, failFast,
              skipConstraints) {
  try {
    const values = instance.schema.castRow(items, failFast,
                                           skipConstraints)

    if (!skipConstraints && instance.primaryHeaders) {
      // unique constraints available only from Resource
      constraints.check_unique_primary(values, instance.primaryHeaders,
                                       instance.uniqueness)
    }
    callback(values)
  } catch (e) {
    if (failFast === true) {
      reject(e)
      return
    }
    for (const error of e) {
      errors.push(error)
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
