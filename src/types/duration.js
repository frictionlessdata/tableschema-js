const lodash = require('lodash')
const moment = require('moment')
const {ERROR} = require('../config')


// Module API

function castDuration(format, value) {
  if (!moment.isDuration(value)) {
    if (!lodash.isString(value)) {
      return ERROR
    }
    try {
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
