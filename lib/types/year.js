'use strict';

var isNaN = require('lodash/isNaN');
var isString = require('lodash/isString');
var isInteger = require('lodash/isInteger');

var _require = require('../config'),
    ERROR = _require.ERROR;

// Module API

function castYear(format, value) {
  if (!isInteger(value)) {
    if (!isString(value)) {
      return ERROR;
    }
    if (value.length !== 4) {
      return ERROR;
    }
    try {
      var result = parseInt(value, 10);
      if (isNaN(result) || result.toString() !== value) {
        return ERROR;
      }
      value = result;
    } catch (error) {
      return ERROR;
    }
  }
  if (value < 0 || value > 9999) {
    return ERROR;
  }
  return value;
}

module.exports = {
  castYear: castYear
};