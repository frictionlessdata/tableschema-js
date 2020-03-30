const moment = require('moment')
const isDate = require('lodash/isDate')
const isString = require('lodash/isString')
const { ERROR } = require('../config')
const helpers = require('../helpers')

// Module API

function castTime(format, value) {
  if (!isDate(value)) {
    if (!isString(value)) {
      return ERROR
    }
    try {
      if (format === 'default') {
        value = moment(value, _DEFAULT_PATTERN, true)
      } else if (format === 'any') {
        try {
          if (!value) return ERROR
          moment.suppressDeprecationWarnings = true
          const today = moment().format('YYYY-MM-DD')
          value = moment(`${today} ${value}`)
        } finally {
          moment.suppressDeprecationWarnings = false
        }
      } else {
        if (format.startsWith('fmt:')) {
          console.warn(
            `Format "fmt:<PATTERN>" is deprecated.
             Please use "<PATTERN>" without "fmt:" prefix.`
          )
          format = format.replace('fmt:', '')
        }
        value = moment(value, helpers.convertDatetimeFormatFromFDtoJS(format), true)
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
  castTime,
}

// Internal

const _DEFAULT_PATTERN = 'HH:mm:ss'
