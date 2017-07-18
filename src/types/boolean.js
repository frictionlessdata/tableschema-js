const lodash = require('lodash')
const {ERROR} = require('../config')


// Module API

function castBoolean(format, value) {
  if (!lodash.isBoolean(value)) {
    if (!lodash.isString(value)) {
      return ERROR
    }
    value = value.trim().toLowerCase()
    if (_TRUE_VALUES.includes(value)) {
      value = true
    } else if (_FALSE_VALUES.includes(value)) {
      value = false
    } else {
      return ERROR
    }
  }
  return value
}


module.exports = {
  castBoolean,
}


// Internal

const _TRUE_VALUES = ['yes', 'y', 'true', 't', '1']
const _FALSE_VALUES = ['no', 'n', 'false', 'f', '0']
