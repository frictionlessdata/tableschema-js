const uuidValidate = require('uuid-validate')
const isString = require('lodash/isString')
const {ERROR} = require('../config')


// Module API

function castString(format, value) {
  if (!isString(value)) {
    return ERROR
  }
  if (format === 'uri') {
    if (!_URI_PATTERN.exec(value)) {
      return ERROR
    }
  } else if (format === 'email') {
    if (!_EMAIL_PATTERN.exec(value)) {
      return ERROR
    }
  } else if (format === 'uuid') {
    if (!uuidValidate(value)) {
      return ERROR
    }
  } else if (format === 'binary') {
    // TODO: implement validation
  }
  return value
}


module.exports = {
  castString,
}

// Internal

const _URI_PATTERN = new RegExp('^http[s]?://')
const _EMAIL_PATTERN = new RegExp('[^@]+@[^@]+\\.[^@]+')
