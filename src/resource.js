import _ from 'lodash'
import Schema from './schema'
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

    let uniqueHeaders = this.schema.getUniqueHeaders()
      , primaryHeaders

    if (primaryKey && primaryKey.length > 1) {
      const headers = this.schema.headers()
      uniqueHeaders = _.difference(uniqueHeaders, primaryKey)
      primaryHeaders = {}
      for (const header of primaryKey) {
        // need to know the index of the header, so later it possible to
        // combine correct values in the row
        primaryHeaders[header] = headers.indexOf(header)
      }
    }
    this.schema.uniqueness = {}
    // using for regular unique constraints for every value independently
    this.schema.uniqueHeaders = uniqueHeaders
    // using to check unique constraints for the row, because need to check
    // uniquness of the values combination (primary key for example)
    this.schema.primaryHeaders = primaryHeaders

    return this.schema.convert(this.data, failFast, skipConstraints)
  }
}
