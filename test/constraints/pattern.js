const { assert } = require('chai')
const constraints = require('../../src/constraints')

// Constants

const TESTS = [
  ['^test$', 'test', true],
  ['^test$', 'TEST', false],
]

// Tests

describe('checkPattern', () => {
  TESTS.forEach((test) => {
    const [constraint, value, result] = test
    it(`constraint "${constraint}" should check "${value}" as "${result}"`, () => {
      assert.deepEqual(constraints.checkPattern(constraint, value), result)
    })
  })
})
