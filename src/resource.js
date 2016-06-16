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
   * @param failFast
   * @param skipConstraints
   * @returns {Array|*|Function}
   * @throws Array of errors if cast failed on some field
   */
  iter(failFast = false, skipConstraints = false) {
    this.schema.uniqueness = {}
    this.schema.uniqueHeaders = this.schema.getUniqueHeaders()

    return this.schema.convert(this.data, failFast, skipConstraints)
  }
}
