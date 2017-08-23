const tv4 = require('tv4')
const isObject = require('lodash/isObject')
const isString = require('lodash/isString')
const isPlainObject = require('lodash/isPlainObject')
const profile = require('../profiles/geojson.json')
const {ERROR} = require('../config')


// Module API

function castGeojson(format, value) {
  if (!isObject(value)) {
    if (!isString(value)) {
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
    if (!isPlainObject(value)) {
      return ERROR
    }
  }
  return value
}


module.exports = {
  castGeojson,
}
