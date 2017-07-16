const {assert} = require('chai')
const {ERROR} = require('../../src/config')
const types = require('../../src/types')


// Constants

const TESTS = [
  ['default', 1, 1],
  ['default', '1', 1],
  ['default', '3.14', ERROR],
  ['default', '', ERROR],
]

// Tests

describe('castInteger', () => {

  TESTS.forEach(test => {
    const [format, value, result] = test
    it(`format "${format}" should cast "${value}" to "${result}"`, () => {
      assert.deepEqual(types.castInteger(format, value), result)
    })
  })

})
