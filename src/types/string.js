const isBase64 = require('validator/lib/isBase64')
const isEmail = require('validator/lib/isEmail')
const isUUID = require('validator/lib/isUUID')
const isURL = require('validator/lib/isURL')
const isString = require('lodash/isString')
const { ERROR } = require('../config')

// Module API

function castString(format, value) {
  if (!isString(value)) {
    return ERROR
  }
  if (format === 'uri') {
    if (!isURL(value, { require_protocol: true })) {
      return ERROR
    }
  } else if (format === 'email') {
    if (!isEmail(value)) {
      return ERROR
    }
  } else if (format === 'uuid') {
    if (!isUUID(value)) {
      return ERROR
    }
  } else if (format === 'binary') {
    if (!isBase64(value)) {
      return ERROR
    }
  }
  return value
}

module.exports = {
  castString,
}
