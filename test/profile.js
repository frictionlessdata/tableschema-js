const axios = require('axios')
const {should} = require('chai')
const profile = require('../src/profiles/table-schema.json')
should()

// Tests

describe('profile', () => {

  it('should be up-to-date', async () => {
    const res = await axios.get('https://specs.frictionlessdata.io/schemas/table-schema.json')
    profile.should.deep.equal(res.data)
  })

})
