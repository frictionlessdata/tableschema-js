import EventEmitter from 'events'
import url from 'url'
import fs from 'fs'
import http from 'http'
import _ from 'lodash'
import parse from 'csv-parse'
import Schema from './schema'
import constraints from './constraints'
import utilities from './utilities'

/**
 * @returns Promise
 */
export default class Resource {
  constructor(schema, source) {
    const self = this
    this.source = source

    return new Promise((resolve, reject) => {
      new Schema(schema).then(model => {
        self.schema = model
        resolve(self)
      }).catch(error => {
        reject(error)
      })
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

    proceed(this, getReadStream(this.source), callback, failFast,
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
  const parser = parse()
  let errors = []
    , isFirst = true

  readStream.then(stream => {
    stream.pipe(parser)
  })

  parser.on('readable', () => {
    let items
    while (null !== (items = parser.read())) {
      if (isFirst) {
        isFirst = false
        continue
      }
      try {
        const values = instance.schema.castRow(items, failFast, skipConstraints)

        if (!skipConstraints && instance.primaryHeaders) {
          // unique constraints available only from Resource
          constraints.check_unique_primary(values, instance.primaryHeaders,
                                           instance.uniqueness)
        }
        callback(values)
      } catch (e) {
        if (failFast === true) {
          throw e
        } else {
          errors = errors.concat(e)
        }
      }
    }
  }).on('end', () => {
    if (errors.length > 0) {
      throw errors
    }
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
 * Check if provided value is readable stream
 *
 * @param stream
 * @returns {boolean}
 */
function isReadStream(stream) {
  return stream instanceof EventEmitter && _.isFunction(stream.read)
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
    // provided array with raw data
    if (_.isArray(source)) {
      // create readable stream from the given array
    } else if (_.isString(source)) {
      // probably it is some URL or local path to the file with the data
      if (utilities.isURL(url.parse(source).protocol)) {
        // create readable stream from remote file
        http.get(url, res => {
          resolve(res)
        })
      } else {
        // assume that it is path to local file
        // create readable stream
        resolve(fs.createReadStream(source))
      }
    } else {
      // it can be readable stream by it self
      if (isReadStream(source)) {
        resolve(source)
      }
    }
  })
}
