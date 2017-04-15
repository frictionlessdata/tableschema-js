import {assert, should} from 'chai'
import * as constraints from '../../src/constraints'
should()


// Constants

const TESTS = [
  [0, [1], false],
  [1, [1], true],
  [2, [1], true],
]

// Tests

describe('checkMaxLength', () => {

  TESTS.forEach(test => {
    const [constraint, value, result] = test
    it(`constraint "${constraint}" should check "${value}" as "${result}"`, () => {
      assert.deepEqual(constraints.checkMaxLength(constraint, value), result)
    })
  })

})
