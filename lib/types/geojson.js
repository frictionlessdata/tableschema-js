'use strict';

var tv4 = require('tv4');
var isObject = require('lodash/isObject');
var isString = require('lodash/isString');
var isPlainObject = require('lodash/isPlainObject');
var geojsonProfile = require('../profiles/geojson.json');
var topojsonProfile = require('../profiles/topojson.json');

var _require = require('../config'),
    ERROR = _require.ERROR;

// Module API

function castGeojson(format, value) {
  if (!isObject(value)) {
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
  if (format === 'default') {
    try {
      var valid = tv4.validate(value, geojsonProfile);
      if (!valid) {
        return ERROR;
      }
    } catch (error) {
      return ERROR;
    }
  } else if (format === 'topojson') {
    try {
      var _valid = tv4.validate(value, topojsonProfile);
      if (!_valid) {
        return ERROR;
      }
    } catch (error) {
      return ERROR;
    }
  }
  return value;
}

module.exports = {
  castGeojson: castGeojson
};