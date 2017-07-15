/* eslint quote-props: off */
const {assert, should} = require('chai')
const {ERROR} = require('../../src/config')
const types = require('../../src/types')
should()


// Constants

const TESTS = [
  ['default', [180, 90], [180, 90]],
  ['default', '180,90', [180, 90]],
  ['default', '180, -90', [180, -90]],
  ['default', {'lon': 180, 'lat': 90}, ERROR],
  ['default', '181,90', ERROR],
  ['default', '0,91', ERROR],
  ['default', 'string', ERROR],
  ['default', 1, ERROR],
  ['default', '3.14', ERROR],
  ['default', '', ERROR],
  ['array', [180, 90], [180, 90]],
  ['array', '[180, -90]', [180, -90]],
  ['array', {'lon': 180, 'lat': 90}, ERROR],
  ['array', [181, 90], ERROR],
  ['array', [0, 91], ERROR],
  ['array', '180,90', ERROR],
  ['array', 'string', ERROR],
  ['array', 1, ERROR],
  ['array', '3.14', ERROR],
  ['array', '', ERROR],
  ['object', {'lon': 180, 'lat': 90}, [180, 90]],
  ['object', '{"lon": 180, "lat": 90}', [180, 90]],
  ['object', '[180, -90]', ERROR],
  ['object', {'lon': 181, 'lat': 90}, ERROR],
  ['object', {'lon': 180, 'lat': -91}, ERROR],
  ['object', [180, -90], ERROR],
  ['object', '180,90', ERROR],
  ['object', 'string', ERROR],
  ['object', 1, ERROR],
  ['object', '3.14', ERROR],
  ['object', '', ERROR],
]

// Tests

describe('castGeopoint', () => {

  TESTS.forEach(test => {
    const [format, value, result] = test
    it(`format "${format}" should cast "${value}" to "${result}"`, () => {
      assert.deepEqual(types.castGeopoint(format, value), result)
    })
  })

})
