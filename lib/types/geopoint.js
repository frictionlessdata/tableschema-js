'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var isNaN = require('lodash/isNaN');
var isArray = require('lodash/isArray');
var isString = require('lodash/isString');
var toNumber = require('lodash/toNumber');

var _require = require('../config'),
    ERROR = _require.ERROR;

// Module API

function castGeopoint(format, value) {
  var lon = void 0,
      lat = void 0;
  try {
    if (format === 'default') {
      if (isString(value)) {
        ;
        var _value$split = value.split(',');

        var _value$split2 = _slicedToArray(_value$split, 2);

        lon = _value$split2[0];
        lat = _value$split2[1];

        lon = lon.trim();
        lat = lat.trim();
      } else if (isArray(value)) {
        ;var _value = value;

        var _value2 = _slicedToArray(_value, 2);

        lon = _value2[0];
        lat = _value2[1];
      }
    } else if (format === 'array') {
      if (isString(value)) {
        value = JSON.parse(value);
      }
      ;var _value3 = value;

      var _value4 = _slicedToArray(_value3, 2);

      lon = _value4[0];
      lat = _value4[1];
    } else if (format === 'object') {
      if (isString(value)) {
        value = JSON.parse(value);
      }
      lon = value.lon;
      lat = value.lat;
    }
    lon = toNumber(lon);
    lat = toNumber(lat);
  } catch (error) {
    return ERROR;
  }
  if (isNaN(lon) || lon > 180 || lon < -180) {
    return ERROR;
  }
  if (isNaN(lat) || lat > 90 || lat < -90) {
    return ERROR;
  }
  return [lon, lat];
}

module.exports = {
  castGeopoint: castGeopoint
};