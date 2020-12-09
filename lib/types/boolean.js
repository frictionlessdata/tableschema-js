'use strict';

var isString = require('lodash/isString');
var isBoolean = require('lodash/isBoolean');

var _require = require('../config'),
    ERROR = _require.ERROR;

// Module API

function castBoolean(format, value) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (!isBoolean(value)) {
    if (!isString(value)) {
      return ERROR;
    }
    value = value.trim();
    if ((options.trueValues || _TRUE_VALUES).includes(value)) {
      value = true;
    } else if ((options.falseValues || _FALSE_VALUES).includes(value)) {
      value = false;
    } else {
      return ERROR;
    }
  }
  return value;
}

module.exports = {
  castBoolean: castBoolean

  // Internal

};var _TRUE_VALUES = ['true', 'True', 'TRUE', '1'];
var _FALSE_VALUES = ['false', 'False', 'FALSE', '0'];