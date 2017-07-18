const {assert} = require('chai')
const {ERROR} = require('../../src/config')
const types = require('../../src/types')


// Helpers

function datetime(year, month, day, hour=0, minute=0, second=0) {
  return new Date(year, month-1, day, hour, minute, second)
}

// Constants

const TESTS = [
  ['default', datetime(2014, 1, 1, 6), datetime(2014, 1, 1, 6)],
  ['default', '2014-01-01T06:00:00Z', datetime(2014, 1, 1, 6)],
  ['default', 'Mon 1st Jan 2014 9 am', ERROR],
  ['default', 'invalid', ERROR],
  ['default', true, ERROR],
  ['default', '', ERROR],
  ['any', datetime(2014, 1, 1, 6), datetime(2014, 1, 1, 6)],
  // ['any', '10th Jan 1969 9 am', datetime(1969, 1, 10, 9)],
  ['any', 'invalid', ERROR],
  ['any', true, ERROR],
  ['any', '', ERROR],
  ['%d/%m/%y %H:%M', datetime(2006, 11, 21, 16, 30), datetime(2006, 11, 21, 16, 30)],
  ['%d/%m/%y %H:%M', '21/11/06 16:30', datetime(2006, 11, 21, 16, 30)],
  ['%H:%M %d/%m/%y', '21/11/06 16:30', ERROR],
  ['%d/%m/%y %H:%M', 'invalid', ERROR],
  ['%d/%m/%y %H:%M', true, ERROR],
  ['%d/%m/%y %H:%M', '', ERROR],
  ['invalid', '21/11/06 16:30', ERROR],
  // Deprecated
  ['fmt:%d/%m/%y %H:%M', datetime(2006, 11, 21, 16, 30), datetime(2006, 11, 21, 16, 30)],
  ['fmt:%d/%m/%y %H:%M', '21/11/06 16:30', datetime(2006, 11, 21, 16, 30)],
  ['fmt:%H:%M %d/%m/%y', '21/11/06 16:30', ERROR],
  ['fmt:%d/%m/%y %H:%M', 'invalid', ERROR],
  ['fmt:%d/%m/%y %H:%M', true, ERROR],
  ['fmt:%d/%m/%y %H:%M', '', ERROR],
]

// Tests

describe('castDatetime', () => {

  TESTS.forEach(test => {
    const [format, value, result] = test
    it(`format "${format}" should cast "${value}" to "${result}"`, () => {
      assert.deepEqual(types.castDatetime(format, value), result)
    })
  })

})
