const lodash = require('lodash')
const {ERROR} = require('../config')


// Module API

function castBoolean(format, value, options={}) {
  if (!lodash.isBoolean(value)) {
    if (!lodash.isString(value)) {
      return ERROR
    }
    value = value.trim().toLowerCase()
    if ((options.trueValues || _TRUE_VALUES).includes(value)) {
      value = true
    } else if ((options.falseValues || _FALSE_VALUES).includes(value)) {
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

const _TRUE_VALUES = ['true', 'True', 'TRUE', '1']
const _FALSE_VALUES = ['false', 'False', 'FALSE', '0']
