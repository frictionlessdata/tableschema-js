import {assert, should} from 'chai'
import {ERROR} from '../../src/config'
import * as types from '../../src/types_new'
should()


// Constants

const TESTS = [
  ['default', 'string', 'string'],
  ['default', '', ''],
  ['default', 0, ERROR],
  ['uri', 'http://google.com', 'http://google.com'],
  ['uri', 'string', ERROR],
  ['uri', '', ERROR],
  ['uri', 0, ERROR],
  ['email', 'name@gmail.com', 'name@gmail.com'],
  ['email', 'http://google.com', ERROR],
  ['email', 'string', ERROR],
  ['email', '', ERROR],
  ['email', 0, ERROR],
  ['binary', 'dGVzdA==', 'dGVzdA=='],
  ['binary', '', ''],
  // ['binary', 'string', ERROR],
  ['binary', 0, ERROR],
]

// Tests

describe('castString', () => {

  TESTS.forEach(test => {
    const [format, value, result] = test
    it(`format "${format}" should cast "${value}" to "${result}"`, () => {
        assert.deepEqual(types.castString(format, value), result)
    })
  })

})
