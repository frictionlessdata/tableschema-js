const isNaN = require('lodash/isNaN')
const isString = require('lodash/isString')
const isNumber = require('lodash/isNumber')
const toNumber = require('lodash/toNumber')
const { ERROR } = require('../config')

// Module API

function castNumber(format, value, options = {}) {
  if (!isNumber(value)) {
    if (!isString(value)) return ERROR
    if (!value.length) return ERROR
    if (value === 'NaN') return NaN
    if (value === 'INF') return Infinity
    if (value === '-INF') return -Infinity
    const decimalChar = options.decimalChar || _DEFAULT_DECIMAL_CHAR
    const groupChar = options.groupChar || _DEFAULT_GROUP_CHAR
    value = value.replace(new RegExp('\\s', 'g'), '')
    value = value.replace(new RegExp(`[${decimalChar}]`, 'g'), '.')
    value = value.replace(new RegExp(`[${groupChar}]`, 'g'), '')
    if (options.bareNumber === false) {
      value = value.replace(new RegExp('((^\\D*)|(\\D*$))', 'g'), '')
    }
    try {
      value = toNumber(value)
    } catch (error) {
      return ERROR
    }
    if (isNaN(value)) {
      return ERROR
    }
  }
  return value
}

module.exports = {
  castNumber,
}

// Internal

const _DEFAULT_DECIMAL_CHAR = '.'
const _DEFAULT_GROUP_CHAR = ''
