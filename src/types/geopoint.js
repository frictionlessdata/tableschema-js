const isNaN = require('lodash/isNaN')
const isArray = require('lodash/isArray')
const isString = require('lodash/isString')
const toNumber = require('lodash/toNumber')
const { ERROR } = require('../config')

// Module API

function castGeopoint(format, value) {
  let lon, lat
  try {
    if (format === 'default') {
      if (isString(value)) {
        ;[lon, lat] = value.split(',')
        lon = lon.trim()
        lat = lat.trim()
      } else if (isArray(value)) {
        ;[lon, lat] = value
      }
    } else if (format === 'array') {
      if (isString(value)) {
        value = JSON.parse(value)
      }
      ;[lon, lat] = value
    } else if (format === 'object') {
      if (isString(value)) {
        value = JSON.parse(value)
      }
      lon = value.lon
      lat = value.lat
    }
    lon = toNumber(lon)
    lat = toNumber(lat)
  } catch (error) {
    return ERROR
  }
  if (isNaN(lon) || lon > 180 || lon < -180) {
    return ERROR
  }
  if (isNaN(lat) || lat > 90 || lat < -90) {
    return ERROR
  }
  return [lon, lat]
}

module.exports = {
  castGeopoint,
}
