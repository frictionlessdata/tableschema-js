const moment = require('moment')
const isDate = require('lodash/isDate')
const isString = require('lodash/isString')
const {timeParse} = require('d3-time-format')
const {ERROR} = require('../config')


// Module API

function castDatetime(format, value) {
  if (!isDate(value)) {
    if (!isString(value)) {
      return ERROR
    }
    try {
      if (format === 'default') {
        value = moment(timeParse(_DEFAULT_PATTERN)(value))
      } else if (format === 'any') {
        value = moment(value)
      } else {
        if (format.startsWith('fmt:')) {
          console.warn(
            `Format "fmt:<PATTERN>" is deprecated.
             Please use "<PATTERN>" without "fmt:" prefix.`)
          format = format.replace('fmt:', '')
        }
        value = moment(timeParse(format)(value))
      }
      if (!value.isValid()) {
        return ERROR
      }
      value = value.toDate()
    } catch (error) {
      return ERROR
    }
  }
  return value
}


module.exports = {
  castDatetime,
}


// Internal

const _DEFAULT_PATTERN = '%Y-%m-%dT%H:%M:%SZ'
