import _ from 'lodash'
import types from './types'

/**
 * Return a descriptor from the passed headers and values.
 *
 * @param headers {Array} - a list of header names
 * @param values {Array} - a reader over data, yielding each row as a list of
 *   values
 * @param options {Object}:
 *  - {integer} rowLimit - limit amount of rows to be proceed
 *  - {boolean} explicit - be explicit
 *  - {string} primaryKey - pass in a primary key or iterable of keys
 *  - {object} cast - TODO add description
 *
 * @returns {object} a JSON Table Schema as a JSON
 */
export default (headers, values, options = {}) => {
  // Set up default options
  const opts = _.extend(
    {
      rowLimit: null
      , explicit: false
      , primaryKey: null
      , cast: {}
    }, options)
    , guesser = new types.TypeGuesser(opts.cast)
    , descriptor = { fields: [] }

  if (opts.primaryKey) {
    descriptor.primaryKey = opts.primaryKey
  }

  descriptor.fields = headers.map(header => {
    const constraints = {}
      , field = {
        name: header
      , title: ''
      , description: ''
      }

    if (opts.explicit) {
      constraints.required = true
    }

    if (header === opts.primaryKey) {
      constraints.unique = true
    }

    if (!_.isEmpty(constraints)) {
      field.constraints = constraints
    }

    return field
  })

  headers.forEach((header, index) => {
    let columnValues = _.map(values, (value) => value[index])
    const field = descriptor.fields[index]

    if (opts.rowLimit) {
      columnValues = _.take(columnValues, opts.rowLimit)
    }
    field.type = guesser.multiCast(columnValues)
    field.format = 'default'
  })

  return descriptor
}
