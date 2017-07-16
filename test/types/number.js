/* eslint quote-props: off */
const {assert} = require('chai')
const {ERROR} = require('../../src/config')
const types = require('../../src/types')


// Constants

const TESTS = [
  ['default', 1, {}, 1],
  ['default', 1, {}, 1],
  ['default', 1.0, {}, 1],
  ['default', '1', {}, 1],
  ['default', '10.00', {}, 10],
  ['default', '10.50', {}, 10.5],
  ['default', '100%', {}, 1],
  ['default', '1000‰', {}, 10],
  ['default', '-1000', {}, -1000],
  ['default', '1,000', {'groupChar': ','}, 1000],
  ['default', '10,000.00', {'groupChar': ','}, 10000],
  ['default', '10,000,000.50', {'groupChar': ','}, 10000000.5],
  ['default', '10#000.00', {'groupChar': '#'}, 10000],
  ['default', '10#000#000.50', {'groupChar': '#'}, 10000000.5],
  ['default', '10.50', {'groupChar': '#'}, 10.5],
  ['default', '1#000', {'groupChar': '#'}, 1000],
  ['default', '10#000@00', {'groupChar': '#', 'decimalChar': '@'}, 10000],
  ['default', '10#000#000@50', {'groupChar': '#', 'decimalChar': '@'}, 10000000.5],
  ['default', '10@50', {'groupChar': '#', 'decimalChar': '@'}, 10.5],
  ['default', '1#000', {'groupChar': '#', 'decimalChar': '@'}, 1000],
  ['default', '10,000.00', {'groupChar': ',', 'currency': true}, 10000],
  ['default', '10,000,000.00', {'groupChar': ',', 'currency': true}, 10000000],
  ['default', '$10000.00', {'currency': true}, 10000],
  ['default', '  10,000.00 €', {'groupChar': ',', 'currency': true}, 10000],
  ['default', '10 000,00', {'groupChar': ' ', 'decimalChar': ','}, 10000],
  ['default', '10 000 000,00', {'groupChar': ' ', 'decimalChar': ','}, 10000000],
  // ['default', '10000,00 ₪', {'groupChar': ' ', 'decimalChar': ',', 'currency': true}, 10000],
  ['default', '  10 000,00 £', {'groupChar': ' ', 'decimalChar': ',', 'currency': true}, 10000],
  ['default', '10,000a.00', {}, ERROR],
  ['default', '10+000.00', {}, ERROR],
  ['default', '$10:000.00', {}, ERROR],
  ['default', 'string', {}, ERROR],
  ['default', '', {}, ERROR],
]

// Tests

describe('castNumber', () => {

  TESTS.forEach(test => {
    const [format, value, options, result] = test
    it(`format "${format}" should cast "${value}" to "${result}"`, () => {
      assert.deepEqual(types.castNumber(format, value, options), result)
    })
  })

})
