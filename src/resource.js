import _ from 'lodash'
import Type from './types'

/**
 * @returns Promise
 */
export default class Resource {
  constructor(schema, data) {
    const that = this

    this.schema = schema
    this.type = new Type()
    this.data = data
  }

  /**
   * Cast value to fieldName's type
   *
   * @param fieldName
   * @param value
   * @param index
   * @param skipConstraints
   *
   * @returns {Type}
   * @throws Error if value can't be casted
   */
  cast(fieldName, value, index, skipConstraints = true) {
    const field = this.schema.getField(fieldName, index)
    return this.type.cast(field, value, skipConstraints)
  }

  /**
   * Convert the arguments given to the types of the current schema. Last
   * argument could be { failFast: true|false }.  If the option `failFast` is
   * given, it will raise the first error it encounters, otherwise an array of
   * errors thrown (if there are any errors occur)
   *
   * @param args
   * @returns {Array}
   */
  convertRow(...args) {
    let items = args
      , failFast = false
    if (_.isArray(args[0])) {
      items = args[0]
    }
    const headers = this.schema.headers()
      , result = []
      , errors = []
      , last = _.last(items)

    if (last && last.hasOwnProperty('failFast')) {
      items.pop()
      if (last.failFast === true) {
        failFast = true
      }
    }

    if (headers.length !== items.length) {
      throw new Error('The number of items to convert does not match the ' +
                      'number of fields given in the schema')
    }
    for (let i = 0, length = items.length; i < length; i++) {
      try {
        result.push(this.cast(headers[i], items[i]))
      } catch (e) {
        const error = `Wrong type for header: ${headers[i]} and value: ${items[i]}`
        if (failFast === true) {
          throw new Error(error)
        } else {
          errors.push(error)
        }
      }
    }

    if (errors.length > 0) {
      throw errors
    }
    return result
  }

  /**
   * Convert an array of rows to the types of the current schema. If the option
   * `failFast` is given, it will raise the first error it encounters,
   * otherwise an array of errors thrown (if there are any errors occur)
   *
   * @param items
   * @param failFast
   * @returns {Array}
   */
  convert(items, failFast = false) {
    const result = []
    let errors = []
    for (const item of items) {
      try {
        item.push({ failFast })
        result.push(this.convertRow(item))
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
}
