const isNaN = require('lodash/isNaN')
const isString = require('lodash/isString')
const isInteger = require('lodash/isInteger')
const { ERROR } = require('../config')

// Module API

function castYear(format, value) {
  if (!isInteger(value)) {
    if (!isString(value)) {
      return ERROR
    }
    if (value.length !== 4) {
      return ERROR
    }
    try {
      const result = parseInt(value, 10)
      if (isNaN(result) || result.toString() !== value) {
        return ERROR
      }
      value = result
    } catch (error) {
      return ERROR
    }
  }
  if (value < 0 || value > 9999) {
    return ERROR
  }
  return value
}

module.exports = {
  castYear,
}
