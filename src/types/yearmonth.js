const lodash = require('lodash')
const {ERROR} = require('../config')


// Module API

function castYearmonth(format, value) {
  if (lodash.isArray(value)) {
    if (value.length !== 2) {
      return ERROR
    }
  } else if (lodash.isString(value)) {
    try {
      let [year, month] = value.split('-')
      year = parseInt(year, 10)
      month = parseInt(month, 10)
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
