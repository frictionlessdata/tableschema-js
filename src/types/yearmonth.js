const isArray = require('lodash/isArray')
const isString = require('lodash/isString')
const { ERROR } = require('../config')

// Module API

function castYearmonth(format, value) {
  if (isArray(value)) {
    if (value.length !== 2) {
      return ERROR
    }
  } else if (isString(value)) {
    try {
      const items = value.split('-')
      if (items.length !== 2) {
        return ERROR
      }
      const year = parseInt(items[0], 10)
      const month = parseInt(items[1], 10)
      if (!year || !month) {
        return ERROR
      }
      if (month < 1 || month > 12) {
        return ERROR
      }
      value = [year, month]
    } catch (error) {
      return ERROR
    }
  } else {
    return ERROR
  }
  return value
}

module.exports = {
  castYearmonth,
}
