const moment = require('moment')
const { assert } = require('chai')
const { ERROR } = require('../../src/config')
const types = require('../../src/types')

// Constants

const TESTS = [
  ['default', moment.duration({ years: 1 }), moment.duration({ years: 1 })],
  [
    'default',
    'P1Y10M3DT5H11M7S',
    moment.duration({ years: 1, months: 10, days: 3, hours: 5, minutes: 11, seconds: 7 }),
  ],
  ['default', 'P1Y', moment.duration({ years: 1 })],
  ['default', 'P1M', moment.duration({ months: 1 })],
  ['default', 'P1M1Y', ERROR],
  // ['default', 'P-1Y', ERROR],
  ['default', 'year', ERROR],
  ['default', true, ERROR],
  ['default', false, ERROR],
  ['default', 1, ERROR],
  ['default', '', ERROR],
  ['default', [], ERROR],
  ['default', {}, ERROR],
]

// Tests

describe('castDuration', () => {
  TESTS.forEach((test) => {
    const [format, value, result] = test
    it(`format "${format}" should cast "${value}" to "${result}"`, () => {
      assert.deepEqual(types.castDuration(format, value), result)
    })
  })
})
