const {assert} = require('chai')
const constraints = require('../../src/constraints')


// Constants

const TESTS = [
  [0, 1, false],
  [1, 1, true],
  [2, 1, true],
]

// Tests

describe('checkMaximum', () => {

  TESTS.forEach(test => {
    const [constraint, value, result] = test
    it(`constraint "${constraint}" should check "${value}" as "${result}"`, () => {
      assert.deepEqual(constraints.checkMaximum(constraint, value), result)
    })
  })

})
