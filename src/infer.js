import _ from 'lodash'
import Type from './types'

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
 *  - {object} cast - object with cast instructions for types in the schema:
 *  {
 *  string : { format : 'email' },
 *  number : { format : 'currency' },
 *  date: { format : 'any'}
 *  }
 *
 * @returns {object} a Table Schema as a JSON
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
    , type = new Type(opts.cast)
    , descriptor = { fields: [] }

  if (opts.primaryKey) {
    if (_.isString(opts.primaryKey)) {
      opts.primaryKey = [opts.primaryKey]
    }
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

    if (_.includes(opts.primaryKey, header)) {
      constraints.unique = true
    }

    if (!_.isEmpty(constraints)) {
      field.constraints = constraints
    }

    return field
  })

  headers.forEach((header, index) => {
    let columnValues = _.map(values, value => value[index])
    const field = descriptor.fields[index]

    if (opts.rowLimit) {
      columnValues = _.take(columnValues, opts.rowLimit)
    }

    field.type = type.multiCast(columnValues)

    if (opts.cast && opts.cast.hasOwnProperty.call(opts.cast, field.type)) {
      field.format = opts.cast[field.type].format
    }

    if (!field.format) {
      field.format = 'default'
    }
  })

  return descriptor
}
