import axios from 'axios'
import {should} from 'chai'
const profile = require('../../src/profiles/table-schema.json')
should()

// Tests

describe('profiles', () => {

  it.skip('should be up-to-date', async () => {
    const res = await axios.get('https://specs.frictionlessdata.io/schemas/table-schema.json')
    profile.should.deep.equal(res.data)
  })

})
