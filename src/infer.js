import * as _ from 'underscore'
import types from './types'

/**
 * Return a schema from the passed headers and values.
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
 * @returns {object} a JSON Table Schema as a Python dict
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
    , schema = { fields: [] }

  if (opts.primaryKey) {
    schema.primaryKey = opts.primaryKey
  }

  schema.fields = headers.map(header => {
    const constraints = {}
      , descriptor = {
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
      descriptor.constraints = constraints
    }

    return descriptor
  })

  headers.forEach((header, index) => {
    let columnValues = _.pluck(values, index)

    if (opts.rowLimit) {
      columnValues = _.first(columnValues, opts.rowLimit)
    }

    schema.fields[index] = _.extend(schema.fields[index], {
      type: guesser.multiCast(columnValues)
      , format: 'default'
    })
  })

  return schema
}
