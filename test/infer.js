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

  it('could infer formats', async () => {
    const descriptor = await infer('data/data_infer_formats.csv')
    assert.deepEqual(descriptor.fields, [
      {name: 'id', type: 'integer', format: 'default'},
      {name: 'location', type: 'geopoint', format: 'array'},
      {name: 'website', type: 'string', format: 'uri'},
      {name: 'yearmonth', type: 'yearmonth', format: 'default'},
      {name: 'date', type: 'date', format: 'default'},
      {name: 'time', type: 'time', format: 'default'},
      {name: 'datetime', type: 'datetime', format: 'default'},
    ])
  })

  it.skip('could infer date/time common patterns', async () => {
    const data = [['1995-12-25'], ['1996-01-17'], ['1997-02-03']]
    const descriptor = await infer(data, {headers: ['name']})
    assert.deepEqual(descriptor.fields, [
      {name: 'name', type: 'date', format: '%Y-%m-%d'},
    ])
  })

  it('could infer uuid', async () => {
    const data = [['0a7b330a-a736-35ea-8f7f-feaf019cdc00']]
    const descriptor = await infer(data, {headers: ['name']})
    assert.deepEqual(descriptor.fields, [
      {name: 'name', type: 'string', format: 'uuid'},
    ])
  })

  it('could infer binary', async () => {
    const data = [['dGVzdA==']]
    const descriptor = await infer(data, {headers: ['name']})
    assert.deepEqual(descriptor.fields, [
      {name: 'name', type: 'string', format: 'binary'},
    ])
  })

  it('could infer geopoint', async () => {
    const data = [['90,45']]
    const descriptor = await infer(data, {headers: ['name']})
    assert.deepEqual(descriptor.fields, [
      {name: 'name', type: 'geopoint', format: 'default'},
    ])
  })

  it('could infer email', async () => {
    const data = [['test@example.com']]
    const descriptor = await infer(data, {headers: ['name']})
    assert.deepEqual(descriptor.fields, [
      {name: 'name', type: 'string', format: 'email'},
    ])
  })

  it('could infer year', async () => {
    const data = [['1984']]
    const descriptor = await infer(data, {headers: ['name']})
    assert.deepEqual(descriptor.fields, [
      {name: 'name', type: 'year', format: 'default'},
    ])
  })

})
