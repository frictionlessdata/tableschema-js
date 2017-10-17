const {assert} = require('chai')
const {Schema} = require('../src')
const {catchError} = require('./helpers')


// Fixtures

const SCHEMA_MIN = {
  fields: [
    {name: 'id'},
    {name: 'height'},
  ]
}
const SCHEMA = {
  fields: [
    {name: 'id', type: 'string', constraints: {required: true}},
    {name: 'height', type: 'number'},
    {name: 'age', type: 'integer'},
    {name: 'name', type: 'string', constraints: {required: true}},
    {name: 'occupation', type: 'string'},
  ]
}


// Tests

describe('Schema', () => {

  it('have a correct number of fields', async () => {
    const schema = await Schema.load(SCHEMA)
    assert.deepEqual(schema.fields.length, 5)
  })

  it('have correct field names', async () => {
    const schema = await Schema.load(SCHEMA)
    assert.deepEqual(schema.fieldNames, ['id', 'height', 'age', 'name', 'occupation'])
  })

  it('raise exception when invalid json passed as schema in strict mode', async () => {
    const error = await catchError(Schema.load, 'bad descriptor', {strict: true})
    if (process.env.USER_ENV === 'browser') {
      assert.include(error.message, 'in browser')
    } else {
      assert.include(error.message, 'load descriptor')
    }
  })

  it('raise exception when invalid format schema passed', async () => {
    const error = await catchError(Schema.load, {}, {strict: true})
    assert.include(error.message, 'validation errors')
    assert.include(error.errors[0].message, 'fields')
  })

  it('set default types if not provided', async () => {
    const schema = await Schema.load(SCHEMA_MIN)
    assert.deepEqual(schema.fields[0].type, 'string')
    assert.deepEqual(schema.fields[1].type, 'string')
  })

  it('fields are not required by default', async () => {
    const schema = await Schema.load(SCHEMA_MIN)
    assert.deepEqual(schema.fields[0].required, false)
    assert.deepEqual(schema.fields[1].required, false)
  })

  it('initial descriptor should not be mutated', async () => {
    const descriptor = {fields: [{ name: 'id' }]}
    const schema = await Schema.load(descriptor)
    assert.notDeepEqual(schema.descriptor, descriptor)
  })

  it('should return null if field name does not exists', async () => {
    const schema = await Schema.load(SCHEMA)
    assert.deepEqual(schema.getField('non-existent'), null)
  })

  it('should load local json file', async function() {
    if (process.env.USER_ENV === 'browser') this.skip()
    const descriptor = 'data/schema.json'
    const schema = await Schema.load(descriptor)
    assert.deepEqual(schema.fieldNames, ['id', 'capital', 'url'])
  })

  it('convert row', async () => {
    const schema = await Schema.load(SCHEMA)
    const row = ['string', '10.0', '1', 'string', 'string']
    assert.deepEqual(schema.castRow(row), ['string', 10, 1, 'string', 'string'])
  })

  it('shouldn\'t convert row with less items than fields count', async () => {
    const schema = await Schema.load(SCHEMA)
    const row = ['string', '10.0', '1', 'string']
    const error = await catchError(schema.castRow.bind(schema), row)
    assert.include(error.message, '4 values does not match the 5 fields')
  })

  it('shouldn\'t convert row with too many items', async () => {
    const schema = await Schema.load(SCHEMA)
    const row = ['string', '10.0', '1', 'string', 'string', 'string']
    const error = await catchError(schema.castRow.bind(schema), row)
    assert.include(error.message, '6 values does not match the 5 fields')
  })

  it('shouldn\'t convert row with wrong type (fail fast)', async () => {
    const schema = await Schema.load(SCHEMA)
    const row = ['string', 'notdecimal', '10.6', 'string', 'string']
    const error = await catchError(schema.castRow.bind(schema), row, {failFast: true})
    assert.include(error.message, 'type')
  })

  it('shouldn\'t convert row with wrong type multiple errors', async () => {
    const schema = await Schema.load(SCHEMA)
    const row = ['string', 'notdecimal', '10.6', 'string', 'string']
    const error = await catchError(schema.castRow.bind(schema), row)
    assert.include(error.message, 'cast errors')
    assert.include(error.errors[0].message, 'type')
  })

  it('should allow pattern format for date', async () => {
    const descriptor = {fields: [{name: 'year', format: '%Y', type: 'date'}]}
    const schema = await Schema.load(descriptor)
    assert.deepEqual(schema.castRow(['2005']), [new Date(2005, 0, 1)])
  })

  it('should work in strict mode', async () => {
    const descriptor = {fields: [{name: 'name', type: 'string'}]}
    const schema = await Schema.load(descriptor, {strict: true})
    assert.deepEqual(schema.valid, true)
    assert.deepEqual(schema.errors, [])
  })

  it('should work in non-strict mode', async () => {
    const descriptor = {fields: [{name: 'name', type: 'bad'}]}
    const schema = await Schema.load(descriptor)
    assert.deepEqual(schema.valid, false)
    assert.deepEqual(schema.errors.length, 1)
  })

  it('sould infer itself from given rows', async () => {
    const schema = new Schema()
    schema.infer([['Alex', 21], ['Joe', 38]], {headers: ['name', 'age']})
    assert.deepEqual(schema.valid, true)
    assert.deepEqual(schema.fieldNames, ['name', 'age'])
    assert.deepEqual(schema.getField('name').type, 'string')
    assert.deepEqual(schema.getField('age').type, 'integer')
  })

  it('sould work with primary/foreign keys as arrays', async () => {
    const descriptor = {
      fields: [{name: 'name'}],
      primaryKey: ['name'],
      foreignKeys: [{
        fields: ['parent_id'],
        reference: {resource: 'resource', fields: ['id']}
      }]
    }
    const schema = await Schema.load(descriptor)
    assert.deepEqual(schema.primaryKey, ['name'])
    assert.deepEqual(schema.foreignKeys, [{
      fields: ['parent_id'],
      reference: {resource: 'resource', fields: ['id']}
    }])
  })

  it('sould work with primary/foreign keys as string', async () => {
    const descriptor = {
      fields: [{name: 'name'}],
      primaryKey: 'name',
      foreignKeys: [{
        fields: 'parent_id',
        reference: {resource: 'resource', fields: 'id'}
      }]
    }
    const schema = await Schema.load(descriptor)
    assert.deepEqual(schema.primaryKey, ['name'])
    assert.deepEqual(schema.foreignKeys, [{
      fields: ['parent_id'],
      reference: {resource: 'resource', fields: ['id']}
    }])
  })

})
