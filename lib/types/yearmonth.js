'use strict';

var isArray = require('lodash/isArray');
var isString = require('lodash/isString');

var _require = require('../config'),
    ERROR = _require.ERROR;

// Module API

function castYearmonth(format, value) {
  if (isArray(value)) {
    if (value.length !== 2) {
      return ERROR;
    }
  } else if (isString(value)) {
    try {
      var items = value.split('-');
      if (items.length !== 2) {
        return ERROR;
      }
      var year = parseInt(items[0], 10);
      var month = parseInt(items[1], 10);
      if (!year || !month) {
        return ERROR;
      }
      if (month < 1 || month > 12) {
        return ERROR;
      }
      value = [year, month];
    } catch (error) {
      return ERROR;
    }
  } else {
    return ERROR;
  }
  return value;
}

module.exports = {
  castYearmonth: castYearmonth
};