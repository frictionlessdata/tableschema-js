import Type from './types'
import constraints from './constraints'

/**
 * @returns Promise
 */
export default class Resource {
  constructor(schema, data) {
    this.schema = schema
    this.type = new Type()
    this.data = data
    this.uniqueHeaders = this.schema.uniqueHeaders()
    this.unique = {}
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
   * Check if value to fieldName's type can be casted
   *
   * @param fieldName
   * @param value
   * @param index
   * @param skipConstraints
   *
   * @returns {Boolean}
   */
  test(fieldName, value, index, skipConstraints = true) {
    const field = this.schema.getField(fieldName, index)
    return this.type.test(field, value, skipConstraints)
  }

  /**
   * Convert the arguments given to the types of the current schema. Last
   * argument could be { failFast: true|false }.  If the option `failFast` is
   * given, it will raise the first error it encounters, otherwise an array of
   * errors thrown (if there are any errors occur)
   *
   * @param items
   * @param failFast
   * @param skipConstraints
   * @returns {Array}
   */
  convertRow(items, failFast = false, skipConstraints = false) {
    const headers = this.schema.headers()
      , result = []
      , errors = []

    if (headers.length !== items.length) {
      throw new Error('The number of items to convert does not match the ' +
                      'number of fields given in the schema')
    }

    for (let i = 0, length = items.length; i < length; i++) {
      try {
        const fieldName = headers[i]
          , value = this.cast(fieldName, items[i], i, skipConstraints)

        if (!skipConstraints) {
          constraints.check_unique(fieldName, this.uniqueHeaders, this.unique,
                                   value)
        }
        result.push(value)
      } catch (e) {
        let error
        switch (e.name) {
          case 'UniqueConstraintsError':
            error = e.message
            break
          default:
            error =
              `Wrong type for header: ${headers[i]} and value: ${items[i]}`
        }
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
   * @param skipConstraints
   * @returns {Array}
   */
  convert(items, failFast = false, skipConstraints = false) {
    const result = []
    let errors = []

    for (const item of items) {
      try {
        result.push(this.convertRow(item, failFast, skipConstraints))
      } catch (e) {
        if (failFast === true) {
          throw e
        } else {
          errors = errors.concat(e)
        }
      }
    }

    this.unique = {}

    if (errors.length > 0) {
      throw errors
    }
    return result
  }
}
