import {assert, should} from 'chai'
import * as constraints from '../../src/constraints_new'
should()


// Constants

const TESTS = [
  [[1, 2], 1, true],
  [[0, 2], 1, false],
  [[], 1, false],
]

// Tests

describe('checkEnum', () => {

  TESTS.forEach(test => {
    const [constraint, value, result] = test
    it(`constraint "${constraint}" should check "${value}" as "${result}"`, () => {
        assert.deepEqual(constraints.checkEnum(constraint, value), result)
    })
  })

})
