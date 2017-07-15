const lodash = require('lodash')
const {ERROR} = require('../config')


// Module API

function castString(format, value) {
  if (!lodash.isString(value)) {
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
    // TODO: implement validation
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
