const {assert} = require('chai')
const constraints = require('../../src/constraints')


// Constants

const TESTS = [
  [false, 'any', true],
  [true, 'any', true],
]

// Tests

describe('checkUnique', () => {

  TESTS.forEach(test => {
    const [constraint, value, result] = test
    it(`constraint "${constraint}" should check "${value}" as "${result}"`, () => {
      assert.deepEqual(constraints.checkUnique(constraint, value), result)
    })
  })

})
