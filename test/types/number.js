/* eslint quote-props: off */
const {assert} = require('chai')
const {ERROR} = require('../../src/config')
const types = require('../../src/types')


// Constants

const TESTS = [
  ['default', 1, 1],
  ['default', 1, 1],
  ['default', 1.0, 1],
  ['default', '1', 1],
  ['default', '10.00', 10],
  ['default', '10.50', 10.5],
  ['default', '100%', 100, {'bareNumber': false}],
  ['default', '1000‰', 1000, {'bareNumber': false}],
  ['default', '-1000', -1000],
  ['default', '1,000', 1000, {'groupChar': ','}],
  ['default', '10,000.00', 10000, {'groupChar': ','}],
  ['default', '10,000,000.50', 10000000.5, {'groupChar': ','}],
  ['default', '10#000.00', 10000, {'groupChar': '#'}],
  ['default', '10#000#000.50', 10000000.5, {'groupChar': '#'}],
  ['default', '10.50', 10.5, {'groupChar': '#'}],
  ['default', '1#000', 1000, {'groupChar': '#'}],
  ['default', '10#000@00', 10000, {'groupChar': '#', 'decimalChar': '@'}],
  ['default', '10#000#000@50', 10000000.5, {'groupChar': '#', 'decimalChar': '@'}],
  ['default', '10@50', 10.5, {'groupChar': '#', 'decimalChar': '@'}],
  ['default', '1#000', 1000, {'groupChar': '#', 'decimalChar': '@'}],
  ['default', '10,000.00', 10000, {'groupChar': ',', 'bareNumber': false}],
  ['default', '10,000,000.00', 10000000, {'groupChar': ',', 'bareNumber': false}],
  ['default', '$10000.00', 10000, {'bareNumber': false}],
  ['default', '  10,000.00 €', 10000, {'groupChar': ',', 'bareNumber': false}],
  ['default', '10 000,00', 10000, {'groupChar': ' ', 'decimalChar': ','}],
  ['default', '10 000 000,00', 10000000, {'groupChar': ' ', 'decimalChar': ','}],
  // ['default', '10000,00 ₪', 10000, {'groupChar': ' ', 'decimalChar': ',', 'bareNumber': false}],
  ['default', '  10 000,00 £', 10000, {'groupChar': ' ', 'decimalChar': ',', 'bareNumber': false}],
  ['default', '10,000a.00', ERROR],
  ['default', '10+000.00', ERROR],
  ['default', '$10:000.00', ERROR],
  ['default', 'string', ERROR],
  ['default', '', ERROR],
]

// Tests

describe('castNumber', () => {

  TESTS.forEach(test => {
    const [format, value, result, options] = test
    it(`format "${format}" should cast "${value}" to "${result}"`, () => {
      assert.deepEqual(types.castNumber(format, value, options), result)
    })
  })

})
