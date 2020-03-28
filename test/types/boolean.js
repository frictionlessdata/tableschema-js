const { assert } = require('chai')
const { ERROR } = require('../../src/config')
const types = require('../../src/types')

// Constants

const TESTS = [
  ['default', true, true],
  ['default', 'true', true],
  ['default', 'True', true],
  ['default', 'TRUE', true],
  ['default', '1', true],
  ['default', 'yes', true, { trueValues: ['yes'] }],
  ['default', 'Y', true, { trueValues: ['Y'] }],
  ['default', false, false],
  ['default', 'false', false],
  ['default', 'False', false],
  ['default', 'FALSE', false],
  ['default', '0', false],
  ['default', 'no', false, { falseValues: ['no'] }],
  ['default', 'N', false, { falseValues: ['N'] }],
  ['default', 'YES', ERROR],
  ['default', 'Yes', ERROR],
  ['default', 'yes', ERROR],
  ['default', 'y', ERROR],
  ['default', 't', ERROR],
  ['default', 'f', ERROR],
  ['default', 'no', ERROR],
  ['default', 'n', ERROR],
  ['default', 'NO', ERROR],
  ['default', 'No', ERROR],
  ['default', 'N', ERROR, { falseValues: ['n'] }],
  ['default', 'Y', ERROR, { trueValues: ['y'] }],
  ['default', 0, ERROR],
  ['default', 1, ERROR],
  ['default', '3.14', ERROR],
  ['default', '', ERROR],
]

// Tests

describe('castBoolean', () => {
  TESTS.forEach((test) => {
    const [format, value, result, options] = test
    it(`format "${format}" should cast "${value}" to "${result}"`, () => {
      assert.deepEqual(types.castBoolean(format, value, options), result)
    })
  })
})
