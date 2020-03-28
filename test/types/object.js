/* eslint quote-props: off */
const { assert } = require('chai')
const { ERROR } = require('../../src/config')
const types = require('../../src/types')

// Constants

const TESTS = [
  ['default', {}, {}],
  ['default', '{}', {}],
  ['default', { key: 'value' }, { key: 'value' }],
  ['default', '{"key": "value"}', { key: 'value' }],
  ['default', '["key", "value"]', ERROR],
  ['default', 'string', ERROR],
  ['default', 1, ERROR],
  ['default', '3.14', ERROR],
  ['default', '', ERROR],
]

// Tests

describe('castObject', () => {
  TESTS.forEach((test) => {
    const [format, value, result] = test
    it(`format "${format}" should cast "${value}" to "${result}"`, () => {
      assert.deepEqual(types.castObject(format, value), result)
    })
  })
})
