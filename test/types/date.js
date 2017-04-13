import {assert, should} from 'chai'
import {ERROR} from '../../src/config'
import * as types from '../../src/types'
should()


// Helpers

function date(year, month, day) {
  return new Date(year, month-1, day)
}

// Constants

const TESTS = [
  ['default', date(2019, 1, 1), date(2019, 1, 1)],
  ['default', '2019-01-01', date(2019, 1, 1)],
  ['default', '10th Jan 1969', ERROR],
  ['default', 'invalid', ERROR],
  ['default', true, ERROR],
  ['default', '', ERROR],
  ['any', date(2019, 1, 1), date(2019, 1, 1)],
  ['any', '2019-01-01', date(2019, 1, 1)],
  // ['any', '10th Jan 1969', date(1969, 1, 10)],
  ['any', '10th Jan nineteen sixty nine', ERROR],
  ['any', 'invalid', ERROR],
  ['any', true, ERROR],
  ['any', '', ERROR],
  ['%d/%m/%y', date(2019, 1, 1), date(2019, 1, 1)],
  ['%d/%m/%y', '21/11/06', date(2006, 11, 21)],
  ['%y/%m/%d','21/11/06 16:30', ERROR],
  ['%d/%m/%y','invalid', ERROR],
  ['%d/%m/%y',true, ERROR],
  ['%d/%m/%y', '', ERROR],
  ['invalid','21/11/06 16:30', ERROR],
  // Deprecated
  ['fmt:%d/%m/%y', date(2019, 1, 1), date(2019, 1, 1)],
  ['fmt:%d/%m/%y', '21/11/06', date(2006, 11, 21)],
  ['fmt:%y/%m/%d','21/11/06 16:30', ERROR],
  ['fmt:%d/%m/%y','invalid', ERROR],
  ['fmt:%d/%m/%y',true, ERROR],
  ['fmt:%d/%m/%y', '', ERROR],
]

// Tests

describe('castDate', () => {

  TESTS.forEach(test => {
    const [format, value, result] = test
    it(`format "${format}" should cast "${value}" to "${result}"`, () => {
        assert.deepEqual(types.castDate(format, value), result)
    })
  })

})
