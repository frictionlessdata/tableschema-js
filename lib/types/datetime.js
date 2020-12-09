'use strict';

var moment = require('moment');
var isDate = require('lodash/isDate');
var isString = require('lodash/isString');

var _require = require('../config'),
    ERROR = _require.ERROR;

var helpers = require('../helpers');

// Module API

function castDatetime(format, value) {
  if (!isDate(value)) {
    if (!isString(value)) {
      return ERROR;
    }
    try {
      if (format === 'default') {
        value = moment(value, _DEFAULT_PATTERN, true);
      } else if (format === 'any') {
        try {
          moment.suppressDeprecationWarnings = true;
          value = moment(value);
        } finally {
          moment.suppressDeprecationWarnings = false;
        }
      } else {
        if (format.startsWith('fmt:')) {
          console.warn('Format "fmt:<PATTERN>" is deprecated.\n             Please use "<PATTERN>" without "fmt:" prefix.');
          format = format.replace('fmt:', '');
        }
        value = moment(value, helpers.convertDatetimeFormatFromFDtoJS(format), true);
      }
      if (!value.isValid()) {
        return ERROR;
      }
      value = value.toDate();
    } catch (error) {
      return ERROR;
    }
  }
  return value;
}

module.exports = {
  castDatetime: castDatetime

  // Internal

};var _DEFAULT_PATTERN = 'YYYY-MM-DDTHH:mm:ss[Z]';