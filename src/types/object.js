const isString = require('lodash/isString')
const isPlainObject = require('lodash/isPlainObject')
const { ERROR } = require('../config')

// Module API

function castObject(format, value) {
  if (!isPlainObject(value)) {
    if (!isString(value)) {
      return ERROR
    }
    try {
      value = JSON.parse(value)
    } catch (error) {
      return ERROR
    }
    if (!isPlainObject(value)) {
      return ERROR
    }
  }
  return value
}

module.exports = {
  castObject,
}
