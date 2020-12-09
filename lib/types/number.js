'use strict';

var isNaN = require('lodash/isNaN');
var isString = require('lodash/isString');
var isNumber = require('lodash/isNumber');
var toNumber = require('lodash/toNumber');

var _require = require('../config'),
    ERROR = _require.ERROR;

// Module API

function castNumber(format, value) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (!isNumber(value)) {
    if (!isString(value)) return ERROR;
    if (!value.length) return ERROR;
    if (value === 'NaN') return NaN;
    if (value === 'INF') return Infinity;
    if (value === '-INF') return -Infinity;
    var decimalChar = options.decimalChar || _DEFAULT_DECIMAL_CHAR;
    var groupChar = options.groupChar || _DEFAULT_GROUP_CHAR;
    value = value.replace(new RegExp('\\s', 'g'), '');
    value = value.replace(new RegExp('[' + decimalChar + ']', 'g'), '.');
    value = value.replace(new RegExp('[' + groupChar + ']', 'g'), '');
    if (options.bareNumber === false) {
      value = value.replace(new RegExp('((^\\D*)|(\\D*$))', 'g'), '');
    }
    try {
      value = toNumber(value);
    } catch (error) {
      return ERROR;
    }
    if (isNaN(value)) {
      return ERROR;
    }
  }
  return value;
}

module.exports = {
  castNumber: castNumber

  // Internal

};var _DEFAULT_DECIMAL_CHAR = '.';
var _DEFAULT_GROUP_CHAR = '';