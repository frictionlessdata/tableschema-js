const { assert } = require('chai')
const constraints = require('../../src/constraints')

// Constants

const TESTS = [
  [false, 1, true],
  [true, 0, true],
  [true, null, false],
  [true, undefined, false],
]

// Tests

describe('checkRequired', () => {
  TESTS.forEach((test) => {
    const [constraint, value, result] = test
    it(`constraint "${constraint}" should check "${value}" as "${result}"`, () => {
      assert.deepEqual(constraints.checkRequired(constraint, value), result)
    })
  })
})
