const moment = require('moment')
const isString = require('lodash/isString')
const { ERROR } = require('../config')

// Module API

function castDuration(format, value) {
  if (!moment.isDuration(value)) {
    if (!isString(value)) {
      return ERROR
    }
    try {
      if (!value.startsWith('P')) {
        return ERROR
      }
      value = moment.duration(value)
      if (!value.as('milliseconds')) {
        return ERROR
      }
    } catch (error) {
      return ERROR
    }
  }
  return value
}

module.exports = {
  castDuration,
}
