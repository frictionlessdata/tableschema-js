const isNaN = require('lodash/isNaN')
const isString = require('lodash/isString')
const isInteger = require('lodash/isInteger')
const { ERROR } = require('../config')

// Module API

function castInteger(format, value, options = {}) {
  if (!isInteger(value)) {
    if (!isString(value)) return ERROR
    if (options.bareNumber === false) {
      value = value.replace(new RegExp('((^\\D*)|(\\D*$))', 'g'), '')
    }
    try {
      const result = parseInt(value, 10)
      if (isNaN(result) || result.toString() !== value) return ERROR
      value = result
    } catch (error) {
      return ERROR
    }
  }
  return value
}

module.exports = {
  castInteger,
}
