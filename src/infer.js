import _ from 'lodash'
import {ERROR} from './config'
import * as types from './types'


// Module API

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
export function infer(headers, values, options = {}) {
  // Set up default options
  const opts = _.extend(
    {
      rowLimit: null
      , explicit: false
      , primaryKey: null
      , cast: {}
    }, options)
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

    field.type = _guessType(columnValues)

    if (opts.cast && opts.cast.hasOwnProperty.call(opts.cast, field.type)) {
      field.format = opts.cast[field.type].format
    }

    if (!field.format) {
      field.format = 'default'
    }
  })

  return descriptor
}


// Internal

const _TYPE_ORDER = [
  'duration',
  'geojson',
  'geopoint',
  'object',
  'array',
  'datetime',
  'time',
  'date',
  'integer',
  'number',
  'boolean',
  'string',
  'any',
]


function _guessType(values) {

  // Get matching types
  const matches = []
  for (const value of values) {
    for (const type of _TYPE_ORDER) {
      const cast = types[`cast${_.upperFirst(type)}`]
      const result = cast('default', value)
      if (result !== ERROR) {
        matches.push(type)
        break
      }
    }
  }

  // Get winner type
  let winner = 'any'
  let count = 0
  for (const [itemType, itemCount] of Object.entries(_.countBy(matches))) {
    if (itemCount > count) {
      winner = itemType
      count = itemCount
    }
  }

  return winner
}
