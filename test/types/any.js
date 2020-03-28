const { assert } = require('chai')
const types = require('../../src/types')

// Constants

const TESTS = [
  ['default', 1, 1],
  ['default', '1', '1'],
  ['default', '3.14', '3.14'],
  ['default', true, true],
  ['default', '', ''],
]

// Tests

describe('castAny', () => {
  TESTS.forEach((test) => {
    const [format, value, result] = test
    it(`format "${format}" should cast "${value}" to "${result}"`, () => {
      assert.deepEqual(types.castAny(format, value), result)
    })
  })
})
