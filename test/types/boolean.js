import {assert, should} from 'chai'
import {ERROR} from '../../src/config'
import * as types from '../../src/types'
should()


// Constants

const TESTS = [
  ['default', true, true],
  ['default', 'yes', true],
  ['default', 'y', true],
  ['default', 'true', true],
  ['default', 't', true],
  ['default', '1', true],
  ['default', 'YES', true],
  ['default', 'Yes', true],
  ['default', false, false],
  ['default', 'no', false],
  ['default', 'n', false],
  ['default', 'false', false],
  ['default', 'f', false],
  ['default', '0', false],
  ['default', 'NO', false],
  ['default', 'No', false],
  ['default', 0, ERROR],
  ['default', 1, ERROR],
  ['default', '3.14', ERROR],
  ['default', '', ERROR],
]

// Tests

describe('castBoolean', () => {

  TESTS.forEach(test => {
    const [format, value, result] = test
    it(`format "${format}" should cast "${value}" to "${result}"`, () => {
        assert.deepEqual(types.castBoolean(format, value), result)
    })
  })

})
