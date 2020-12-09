'use strict';

var isBase64 = require('validator/lib/isBase64');
var isEmail = require('validator/lib/isEmail');
var isUUID = require('validator/lib/isUUID');
var isURL = require('validator/lib/isURL');
var isString = require('lodash/isString');

var _require = require('../config'),
    ERROR = _require.ERROR;

// Module API

function castString(format, value) {
  if (!isString(value)) {
    return ERROR;
  }
  if (format === 'uri') {
    if (!isURL(value, { require_protocol: true })) {
      return ERROR;
    }
  } else if (format === 'email') {
    if (!isEmail(value)) {
      return ERROR;
    }
  } else if (format === 'uuid') {
    if (!isUUID(value)) {
      return ERROR;
    }
  } else if (format === 'binary') {
    if (!isBase64(value)) {
      return ERROR;
    }
  }
  return value;
}

module.exports = {
  castString: castString
};