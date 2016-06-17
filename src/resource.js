import _ from 'lodash'
import Schema from './schema'
import constraints from './constraints'
/**
 * @returns Promise
 */
export default class Resource {
  constructor(schema, data) {
    const self = this

    return new Promise((resolve, reject) => {
      new Schema(schema).then(model => {
        resolve(self)
        self.schema = model
        self.data = Object.freeze(data)
      }).catch(error => {
        reject(error)
      })
    })
  }

  /**
   * Iter through the given dataset and return the converted dataset
   * @param {boolean} failFast. Default is false
   * @param {boolean} skipConstraints. Default is false
   * @returns {Array} result of casted data
   * @throws {Array} of errors if cast failed on some field
   */
  iter(failFast = false, skipConstraints = false) {
    const primaryKey = this.schema.primaryKey()
    let uniqueHeaders = getUniqueHeaders(this.schema)

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
    return convert(this, this.data, failFast, skipConstraints)
  }
}

/**
 * Convert an array of rows to the types of the current schema. If the option
 * `failFast` is given, it will raise the first error it encounters,
 * otherwise an array of errors thrown (if there are any errors occur)
 *
 * @param items
 * @param failFast
 * @param skipConstraints
 * @returns {Array}
 */
function convert(instance, items, failFast = false, skipConstraints = false) {
  const result = []
  let errors = []

  for (const item of items) {
    try {
      const values = instance.schema.castRow(item, failFast, skipConstraints)

      if (!skipConstraints && instance.primaryHeaders) {
        // unique constraints available only from Resource
        constraints.check_unique_primary(values, instance.primaryHeaders,
                                         instance.uniqueness)
      }
      result.push(values)
    } catch (e) {
      if (failFast === true) {
        throw e
      } else {
        errors = errors.concat(e)
      }
    }
  }

  if (errors.length > 0) {
    throw errors
  }
  return result
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
