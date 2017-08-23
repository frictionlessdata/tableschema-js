const {assert} = require('chai')
const cloneDeep = require('lodash/cloneDeep')
const {validate} = require('../src')


// Fixtures

const SCHEMA = {
  fields: [
    {name: 'id', type: 'string', constraints: { required: true }},
    {name: 'height', type: 'number'},
    {name: 'age', type: 'integer'},
    {name: 'name', type: 'string', constraints: {required: true}},
    {name: 'occupation', type: 'string'},
  ],
  primaryKey: ['id']
}


// Tests

describe('validate', () => {

  it('ensure schema has fields', async () => {
    const {valid, errors} = await validate({})
    assert.deepEqual(valid, false)
    assert.deepEqual(errors.length, 1)
  })

  it('ensure schema has fields and fields are array', async () => {
    const {valid, errors} = await validate({fields: ['1', '2']})
    assert.deepEqual(valid, false)
    assert.deepEqual(errors.length, 2)
  })

  it('ensure schema fields has required properties', async () => {
    const descriptor = {fields: [{name: 'id'}, {type: 'number'}]}
    const {valid, errors} = await validate(descriptor)
    assert.deepEqual(valid, false)
    assert.deepEqual(errors.length, 1)
  })

  it('ensure schema fields constraints must be an object', async () => {
    const descriptor = {fields: [{name: 'id', constraints: 'string'}]}
    const {valid, errors} = await validate(descriptor)
    assert.deepEqual(valid, false)
    assert.deepEqual(errors.length, 1)
  })

  it('ensure constraints properties have correct type', async () => {
    const descriptor = {fields: [
      {
        name: 'age',
        type: 'integer',
        constraints: {
          required: 'string',
          unique: 'string',
          minLength: true,
          maxLength: true,
          minimum: 'string',
          maximum: 'string'
        }
      }
    ]}
    const {valid, errors} = await validate(descriptor)
    assert.deepEqual(valid, false)
    assert.deepEqual(errors.length, 1)
  })

  it('ensure constraints properties with correct type is valid', async () => {
    const descriptor = {fields: [{
      name: 'id',
      type: 'string',
      constraints: {
        required: true,
        pattern: '/.*/',
        unique: true
      }
    }, {
      name: 'age',
      type: 'integer',
      constraints: {
        required: true,
        unique: true,
        minimum: '10',
        maximum: '20'
      }
    }]}
    const {valid, errors} = await validate(descriptor)
    assert.deepEqual(valid, true)
    assert.deepEqual(errors.length, 0)
  })

  it('primary key should be by type one of the allowed by schema', async () => {
    const descriptor = cloneDeep(SCHEMA)
    descriptor.primaryKey = {some: 'thing'}
    const {valid, errors} = await validate(descriptor)
    assert.deepEqual(valid, false)
    assert.deepEqual(errors.length, 1)
  })

  it('primary key should match field names', async () => {
    const descriptor = cloneDeep(SCHEMA)
    descriptor.primaryKey = ['unknown']
    const {valid, errors} = await validate(descriptor)
    assert.deepEqual(valid, false)
    assert.deepEqual(errors.length, 1)
  })

  it('ensure primary key as array match field names', async () => {
    const descriptor = cloneDeep(SCHEMA)
    descriptor.primaryKey = ['id', 'unknown']
    const {valid, errors} = await validate(descriptor)
    assert.deepEqual(valid, false)
    assert.deepEqual(errors.length, 1)
  })

  it('ensure foreign keys is an array', async () => {
    const descriptor = cloneDeep(SCHEMA)
    descriptor.foreignKeys = 'keys'
    const {valid, errors} = await validate(descriptor)
    assert.deepEqual(valid, false)
    assert.deepEqual(errors.length, 1)
  })

  it('ensure every foreign key has fields', async () => {
    const descriptor = cloneDeep(SCHEMA)
    descriptor.foreignKeys = ['key1', 'key2']
    const {valid, errors} = await validate(descriptor)
    assert.deepEqual(valid, false)
    assert.deepEqual(errors.length, 2)
  })

  it('ensure fields in keys a string or an array', async () => {
    const descriptor = cloneDeep(SCHEMA)
    descriptor.foreignKeys = [{fields: {name: 'id'}}]
    const {valid, errors} = await validate(descriptor)
    assert.deepEqual(valid, false)
    assert.deepEqual(errors.length, 2)
  })

  it('ensure fields exists in schema', async () => {
    const descriptor = cloneDeep(SCHEMA)
    descriptor.foreignKeys = [
      {
        fields: ['unknown'],
        reference: {fields: ['fk_id'], resource: 'resource'},
      },
      {
        fields: ['id', 'unknown'],
        reference: {resource: 'the-resource', fields: ['fk_id', 'fk_name']},
      }
    ]
    const {valid, errors} = await validate(descriptor)
    assert.deepEqual(valid, false)
    assert.deepEqual(errors.length, 2)
  })

  it('reference.fields should be same type as key.fields', async () => {
    const descriptor = cloneDeep(SCHEMA)
    descriptor.foreignKeys = [
      {
        fields: ['id'],
        reference: {fields: ['id', 'name'], resource: 'resource'},
      },
      {
        fields: ['id', 'name'],
        reference: {resource: 'resource', fields: ['id']},
      },
      {
        fields: ['id', 'name'],
        reference: {resource: 'resource', fields: ['id']},
      }
    ]
    const {valid, errors} = await validate(descriptor)
    assert.deepEqual(valid, false)
    assert.deepEqual(errors.length, 3)
  })

  it('fields in keys a string or an array and resource is present', async () => {
    const descriptor = cloneDeep(SCHEMA)
    descriptor.foreignKeys = [
      {
        fields: ['id'],
        reference: {fields: ['fk_id'], resource: 'resource'},
      }, {
        fields: ['id', 'name'],
        reference: {resource: 'the-resource', fields: ['fk_id', 'fk_name']},
      }
    ]
    const {valid, errors} = await validate(descriptor)
    assert.deepEqual(valid, true)
    assert.deepEqual(errors.length, 0)
  })

  it('empty resource should reference to the self fields', async () => {
    const descriptor = cloneDeep(SCHEMA)
    descriptor.foreignKeys = [
      {
        fields: ['id'],
        reference: {fields: ['fk_id'], resource: ''},
      }, {
        fields: ['id', 'name'],
        reference: {fields: ['fk_id', 'fk_name'], resource: ''},
      }
    ]
    const {valid, errors} = await validate(descriptor)
    assert.deepEqual(valid, false)
    assert.deepEqual(errors.length, 3)
  })

  it('should support local descriptors', async function() {
    if (process.env.USER_ENV === 'browser') this.skip()
    const {valid, errors} = await validate('data/schema.json')
    assert.deepEqual(valid, true)
    assert.deepEqual(errors.length, 0)
  })

})
