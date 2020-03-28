const isArray = require('lodash/isArray')
const isString = require('lodash/isString')
const { ERROR } = require('../config')

// Module API

function castArray(format, value) {
  if (!isArray(value)) {
    if (!isString(value)) {
      return ERROR
    }
    try {
      value = JSON.parse(value)
    } catch (error) {
      return ERROR
    }
    if (!isArray(value)) {
      return ERROR
    }
  }
  return value
}

module.exports = {
  castArray,
}
