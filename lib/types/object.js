'use strict';

var isString = require('lodash/isString');
var isPlainObject = require('lodash/isPlainObject');

var _require = require('../config'),
    ERROR = _require.ERROR;

// Module API

function castObject(format, value) {
  if (!isPlainObject(value)) {
    if (!isString(value)) {
      return ERROR;
    }
    try {
      value = JSON.parse(value);
    } catch (error) {
      return ERROR;
    }
    if (!isPlainObject(value)) {
      return ERROR;
    }
  }
  return value;
}

module.exports = {
  castObject: castObject
};