'use strict';

var isArray = require('lodash/isArray');
var isString = require('lodash/isString');

var _require = require('../config'),
    ERROR = _require.ERROR;

// Module API

function castArray(format, value) {
  if (!isArray(value)) {
    if (!isString(value)) {
      return ERROR;
    }
    try {
      value = JSON.parse(value);
    } catch (error) {
      return ERROR;
    }
    if (!isArray(value)) {
      return ERROR;
    }
  }
  return value;
}

module.exports = {
  castArray: castArray
};