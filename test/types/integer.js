import {assert, should} from 'chai'
import {ERROR} from '../../src/config'
import * as types from '../../src/types'
should()


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
