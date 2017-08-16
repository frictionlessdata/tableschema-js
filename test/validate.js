const lodash = require('lodash')
const {assert} = require('chai')
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
    const validation = await validate({})
    assert.deepEqual(validation.valid, false)
    assert.deepEqual(validation.errors.length, 1)
  })

  it('ensure schema has fields and fields are array', async () => {
    const validation = await validate({fields: ['1', '2']})
    assert.deepEqual(validation.valid, false)
    assert.deepEqual(validation.errors.length, 2)
  })

  it('ensure schema fields has required properties', async () => {
    const descriptor = {fields: [{name: 'id'}, {type: 'number'}]}
    const validation = await validate(descriptor)
    assert.deepEqual(validation.valid, false)
    assert.deepEqual(validation.errors.length, 1)
  })

  it('ensure schema fields constraints must be an object', async () => {
    const descriptor = {fields: [{name: 'id', constraints: 'string'}]}
    const validation = await validate(descriptor)
    assert.deepEqual(validation.valid, false)
    assert.deepEqual(validation.errors.length, 1)
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
    const validation = await validate(descriptor)
    assert.deepEqual(validation.valid, false)
    assert.deepEqual(validation.errors.length, 1)
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
    const validation = await validate(descriptor)
    assert.deepEqual(validation.valid, true)
    assert.deepEqual(validation.errors.length, 0)
  })

  it('primary key should be by type one of the allowed by schema', async () => {
    const descriptor = lodash.clone(SCHEMA)
    descriptor.primaryKey = {some: 'thing'}
    const validation = await validate(descriptor)
    assert.deepEqual(validation.valid, false)
    assert.deepEqual(validation.errors.length, 1)
  })

  it('primary key should match field names', async () => {
    const descriptor = lodash.clone(SCHEMA)
    descriptor.primaryKey = ['unknown']
    const validation = await validate(descriptor)
    assert.deepEqual(validation.valid, false)
    assert.deepEqual(validation.errors.length, 1)
  })

  it('ensure primary key as array match field names', async () => {
    const descriptor = lodash.clone(SCHEMA)
    descriptor.primaryKey = ['id', 'unknown']
    const validation = await validate(descriptor)
    assert.deepEqual(validation.valid, false)
    assert.deepEqual(validation.errors.length, 1)
  })

  it('ensure foreign keys is an array', async () => {
    const descriptor = lodash.clone(SCHEMA)
    descriptor.foreignKeys = 'keys'
    const validation = await validate(descriptor)
    assert.deepEqual(validation.valid, false)
    assert.deepEqual(validation.errors.length, 1)
  })

  it('ensure every foreign key has fields', async () => {
    const descriptor = lodash.clone(SCHEMA)
    descriptor.foreignKeys = ['key1', 'key2']
    const validation = await validate(descriptor)
    assert.deepEqual(validation.valid, false)
    assert.deepEqual(validation.errors.length, 2)
  })

  it('ensure fields in keys a string or an array', async () => {
    const descriptor = lodash.clone(SCHEMA)
    descriptor.foreignKeys = [{fields: {name: 'id'}}]
    const validation = await validate(descriptor)
    assert.deepEqual(validation.valid, false)
    assert.deepEqual(validation.errors.length, 2)
  })

  it('ensure fields exists in schema', async () => {
    const descriptor = lodash.clone(SCHEMA)
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
    const validation = await validate(descriptor)
    assert.deepEqual(validation.valid, false)
    assert.deepEqual(validation.errors.length, 2)
  })

  it('reference.fields should be same type as key.fields', async () => {
    const descriptor = lodash.clone(SCHEMA)
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
    const validation = await validate(descriptor)
    assert.deepEqual(validation.valid, false)
    assert.deepEqual(validation.errors.length, 3)
  })

  it('fields in keys a string or an array and resource is present', async () => {
    const descriptor = lodash.clone(SCHEMA)
    descriptor.foreignKeys = [
      {
        fields: ['id'],
        reference: {fields: ['fk_id'], resource: 'resource'},
      }, {
        fields: ['id', 'name'],
        reference: {resource: 'the-resource', fields: ['fk_id', 'fk_name']},
      }
    ]
    const validation = await validate(descriptor)
    assert.deepEqual(validation.valid, true)
    assert.deepEqual(validation.errors.length, 0)
  })

  it('empty resource should reference to the self fields', async () => {
    const descriptor = lodash.clone(SCHEMA)
    descriptor.foreignKeys = [
      {
        fields: ['id'],
        reference: {fields: ['fk_id'], resource: ''},
      }, {
        fields: ['id', 'name'],
        reference: {fields: ['fk_id', 'fk_name'], resource: ''},
      }
    ]
    const validation = await validate(descriptor)
    assert.deepEqual(validation.valid, false)
    assert.deepEqual(validation.errors.length, 3)
  })

  it('should support local descriptors', async function() {
    if (process.env.USER_ENV === 'browser') this.skip()
    const validation = await validate('data/schema.json')
    assert.deepEqual(validation.valid, true)
    assert.deepEqual(validation.errors.length, 0)
  })

})
