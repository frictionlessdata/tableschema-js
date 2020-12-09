'use strict';

var isNaN = require('lodash/isNaN');
var isString = require('lodash/isString');
var isInteger = require('lodash/isInteger');

var _require = require('../config'),
    ERROR = _require.ERROR;

// Module API

function castInteger(format, value) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (!isInteger(value)) {
    if (!isString(value)) return ERROR;
    if (options.bareNumber === false) {
      value = value.replace(new RegExp('((^\\D*)|(\\D*$))', 'g'), '');
    }
    try {
      var result = parseInt(value, 10);
      if (isNaN(result) || result.toString() !== value) return ERROR;
      value = result;
    } catch (error) {
      return ERROR;
    }
  }
  return value;
}

module.exports = {
  castInteger: castInteger
};