const tv4 = require('tv4')
const lodash = require('lodash')
const {ERROR} = require('../config')
const profile = require('../profiles/geojson.json')


// Module API

function castGeojson(format, value) {
  if (!lodash.isObject(value)) {
    if (!lodash.isString(value)) {
      return ERROR
    }
    try {
      value = JSON.parse(value)
    } catch (error) {
      return ERROR
    }
  }
  if (format === 'default') {
    try {
      const valid = tv4.validate(value, profile)
      if (!valid) {
        return ERROR
      }
    } catch (error) {
      return ERROR
    }
  } else if (format === 'topojson') {
    if (!lodash.isPlainObject(value)) {
      return ERROR
    }
  }
  return value
}


module.exports = {
  castGeojson,
}
