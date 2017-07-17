const {assert} = require('chai')
const {infer} = require('../src')


// Tests

describe('infer', () => {

  before(function() {
    // Skip infer tests for browser
    if (process.env.USER_ENV === 'browser') {
      this.skip()
    }
  })

  it('produce schema from a generic .csv', async () => {
    const descriptor = await infer('data/data_infer.csv')
    assert.deepEqual(descriptor.fields, [
      {name: 'id', type: 'integer', format: 'default'},
      {name: 'age', type: 'integer', format: 'default'},
      {name: 'name', type: 'string', format: 'default'},
    ])
  })

  it('produce schema from a generic .csv UTF-8 encoded', async () => {
    const descriptor = await infer('data/data_infer_utf8.csv')
    assert.deepEqual(descriptor.fields, [
      {name: 'id', type: 'integer', format: 'default'},
      {name: 'age', type: 'integer', format: 'default'},
      {name: 'name', type: 'string', format: 'default'},
    ])
  })

  it('respect row limit parameter', async () => {
    const descriptor = await infer('data/data_infer_row_limit.csv', {limit: 4})
    assert.deepEqual(descriptor.fields, [
      {name: 'id', type: 'integer', format: 'default'},
      {name: 'age', type: 'integer', format: 'default'},
      {name: 'name', type: 'string', format: 'default'},
    ])
  })

})
