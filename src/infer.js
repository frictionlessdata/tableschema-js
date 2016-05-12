let _ = require('underscore')
  , types = require('./types')

/**
 * Return a schema from the passed headers and values.
 *
 * @param {array} headers - a list of header names
 * @param {array} values - a reader over data, yielding each row as a list of
 *   values
 * @param {object} options:
 *  - {integer} rowLimit - limit amount of rows to be proceed
 *  - {boolean} explicit - be explicit
 *  - {string} primaryKey - pass in a primary key or iterable of keys
 *  - {object} cast - TODO add description
 *
 * @returns {object} a JSON Table Schema as a Python dict
 */
module.exports = (headers, values, options) => {
  // Set up default options
  options = _.extend(
    {
      rowLimit: null
      , explicit: false
      , primaryKey: null
      , cast: {}
    }, options
  )

  let guesser = new types.TypeGuesser(options.cast)
    , schema = {fields: []}

  if (options.primaryKey) {
    schema['primaryKey'] = options.primaryKey
  }

  schema['fields'] = headers.map((header) => {
    let constraints = {}
      , descriptor = {
        name: header
        , title: ''
        , description: ''
      }

    if (options.explicit) {
      constraints.required = true
    }

    if (header === options.primaryKey) {
      constraints.unique = true
    }

    if (!_.isEmpty(constraints)) {
      descriptor.constraints = constraints
    }

    return descriptor
  })

  for (let index in headers) {
    if (headers.hasOwnProperty(index)) {
      index = parseInt(index, 10)

      let columnValues = _.pluck(values, index)

      if (options.rowLimit) {
        columnValues = _.first(columnValues, options.rowLimit)
      }

      schema.fields[index] = _.extend(schema.fields[index], {
        type: guesser.multicast(columnValues)
        , format: 'default'
      })
    }
  }
  return schema
}
