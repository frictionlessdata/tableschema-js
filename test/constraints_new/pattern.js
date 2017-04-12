import {assert, should} from 'chai'
import * as constraints from '../../src/constraints_new'
should()


// Constants

const TESTS = [
  ['^test$', 'test', true],
  ['^test$', 'TEST', false],
]

// Tests

describe('checkPattern', () => {

  TESTS.forEach(test => {
    const [constraint, value, result] = test
    it(`constraint "${constraint}" should check "${value}" as "${result}"`, () => {
        assert.deepEqual(constraints.checkPattern(constraint, value), result)
    })
  })

})
