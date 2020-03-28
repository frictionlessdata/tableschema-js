/* eslint quote-props: off */
const { assert } = require('chai')
const { ERROR } = require('../../src/config')
const types = require('../../src/types')

// Constants

const TESTS = [
  // ['default',
  // {'properties': {'Ã': 'Ã'}, 'type': 'Feature', 'geometry': null},
  // {'properties': {'Ã': 'Ã'}, 'type': 'Feature', 'geometry': null}],
  // ['default',
  // '{"geometry": null, "type": "Feature", "properties": {"\\u00c3": "\\u00c3"}}',
  // {'properties': {'Ã': 'Ã'}, 'type': 'Feature', 'geometry': null}],
  ['default', { coordinates: [0, 0, 0], type: 'Point' }, ERROR],
  ['default', 'string', ERROR],
  ['default', 1, ERROR],
  ['default', '3.14', ERROR],
  ['default', '', ERROR],
  ['default', {}, ERROR],
  ['default', '{}', ERROR],
  ['topojson', { type: 'LineString', arcs: [42] }, { type: 'LineString', arcs: [42] }],
  ['topojson', '{"type": "LineString", "arcs": [42]}', { type: 'LineString', arcs: [42] }],
  ['topojson', '{"arcs": [42]}', ERROR],
  ['topojson', 'string', ERROR],
  ['topojson', 1, ERROR],
  ['topojson', '3.14', ERROR],
  ['topojson', '', ERROR],
]

// Tests

describe('castGeojson', () => {
  TESTS.forEach((test) => {
    const [format, value, result] = test
    it(`format "${format}" should cast "${value}" to "${result}"`, () => {
      assert.deepEqual(types.castGeojson(format, value), result)
    })
  })
})
