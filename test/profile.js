require('babel-polyfill')
const axios = require('axios')
const {assert} = require('chai')
const {Profile} = require('../src/profile')


// Tests

describe('profile', () => {

  it('table-schema is up-to-date', async () => {
    const res = await axios.get('https://specs.frictionlessdata.io/schemas/table-schema.json')
    const profile = await Profile.load('table-schema')
    assert.deepEqual(res.data, profile.jsonschema)
  })

  it('geo-json is available', async () => {
    const profile = await Profile.load('geojson')
    assert.ok(profile.jsonschema)
  })

})
