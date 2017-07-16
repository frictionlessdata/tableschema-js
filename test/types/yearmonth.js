const {assert} = require('chai')
const {ERROR} = require('../../src/config')
const types = require('../../src/types')


// Constants

const TESTS = [
  ['default', [2000, 10], [2000, 10]],
  ['default', '2000-10', [2000, 10]],
  ['default', [2000, 10, 20], ERROR],
  ['default', '2000-13-20', ERROR],
  ['default', '2000-13', ERROR],
  ['default', '2000-0', ERROR],
  ['default', '13', ERROR],
  ['default', -10, ERROR],
  ['default', 20, ERROR],
  ['default', '3.14', ERROR],
  ['default', '', ERROR],
]

// Tests

describe('castYearmonth', () => {

  TESTS.forEach(test => {
    const [format, value, result] = test
    it(`format "${format}" should cast "${value}" to "${result}"`, () => {
      assert.deepEqual(types.castYearmonth(format, value), result)
    })
  })

})
