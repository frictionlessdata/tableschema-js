const { castAny } = require('./any')
const { castArray } = require('./array')
const { castBoolean } = require('./boolean')
const { castDate } = require('./date')
const { castDatetime } = require('./datetime')
const { castDuration } = require('./duration')
const { castGeojson } = require('./geojson')
const { castGeopoint } = require('./geopoint')
const { castInteger } = require('./integer')
const { castNumber } = require('./number')
const { castObject } = require('./object')
const { castString } = require('./string')
const { castTime } = require('./time')
const { castYear } = require('./year')
const { castYearmonth } = require('./yearmonth')

// Module API

module.exports = {
  castAny,
  castArray,
  castBoolean,
  castDate,
  castDatetime,
  castDuration,
  castGeojson,
  castGeopoint,
  castInteger,
  castNumber,
  castObject,
  castString,
  castTime,
  castYear,
  castYearmonth,
}
