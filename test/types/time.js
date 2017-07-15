const {assert, should} = require('chai')
const {ERROR} = require('../../src/config')
const types = require('../../src/types')
should()


// Helpers

function time(hour, minute=0, second=0) {
  return new Date(0, 0, 1, hour, minute, second)
}

// Constants

const TESTS = [
  ['default', time(6), time(6)],
  ['default', '06:00:00', time(6)],
  ['default', '09:00', ERROR],
  ['default', '3 am', ERROR],
  ['default', '3.00', ERROR],
  ['default', 'invalid', ERROR],
  ['default', true, ERROR],
  ['default', '', ERROR],
  ['any', time(6), time(6)],
  // ['any', '06:00:00', time(6)],
  // ['any', '3:00 am', time(3)],
  ['any', 'some night', ERROR],
  ['any', 'invalid', ERROR],
  ['any', true, ERROR],
  ['any', '', ERROR],
  ['%H:%M', time(6), time(6)],
  ['%H:%M', '06:00', time(6)],
  // ['%M:%H', '06:50', ERROR],
  ['%H:%M', '3:00 am', ERROR],
  ['%H:%M', 'some night', ERROR],
  ['%H:%M', 'invalid', ERROR],
  ['%H:%M', true, ERROR],
  ['%H:%M', '', ERROR],
  ['invalid', '', ERROR],
  // Deprecated
  ['fmt:%H:%M', time(6), time(6)],
  ['fmt:%H:%M', '06:00', time(6)],
  // ['fmt:%M:%H', '06:50', ERROR],
  ['fmt:%H:%M', '3:00 am', ERROR],
  ['fmt:%H:%M', 'some night', ERROR],
  ['fmt:%H:%M', 'invalid', ERROR],
  ['fmt:%H:%M', true, ERROR],
  ['fmt:%H:%M', '', ERROR],
]

// Tests

describe('castTime', () => {

  TESTS.forEach(test => {
    const [format, value, result] = test
    it(`format "${format}" should cast "${value}" to "${result}"`, () => {
      assert.deepEqual(types.castTime(format, value), result)
    })
  })

})
