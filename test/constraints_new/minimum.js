import {assert, should} from 'chai'
import * as constraints from '../../src/constraints_new'
should()


// Constants

const TESTS = [
  [0, 1, true],
  [1, 1, true],
  [2, 1, false],
]

// Tests

describe('checkMinimum', () => {

  TESTS.forEach(test => {
    const [constraint, value, result] = test
    it(`constraint "${constraint}" should check "${value}" as "${result}"`, () => {
        assert.deepEqual(constraints.checkMinimum(constraint, value), result)
    })
  })

})
