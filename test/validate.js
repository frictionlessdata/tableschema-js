const lodash = require('lodash')
const {assert} = require('chai')
const {validate} = require('../src')
const {catchError} = require('./helpers')


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
    const errors = await catchError(validate, {})
    assert.deepEqual(errors.length, 1)
  })

  it('ensure schema has fields and fields are array', async () => {
    const errors = await catchError(validate, {fields: ['1', '2']})
    assert.deepEqual(errors.length, 2)
  })

  it('ensure schema fields has required properties', async () => {
    const descriptor = {fields: [{name: 'id'}, {type: 'number'}]}
    const errors = await catchError(validate, descriptor)
    assert.deepEqual(errors.length, 1)
  })

  it('ensure schema fields constraints must be an object', async () => {
    const descriptor = {fields: [{name: 'id', constraints: 'string'}]}
    const errors = await catchError(validate, descriptor)
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
    const errors = await catchError(validate, descriptor)
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
    const valid = await validate(descriptor)
    assert.ok(valid)
  })

  it('primary key should be by type one of the allowed by schema', async () => {
    const descriptor = lodash.clone(SCHEMA)
    descriptor.primaryKey = {some: 'thing'}
    const errors = await catchError(validate, descriptor)
    assert.deepEqual(errors.length, 1)
  })

  it('primary key should match field names', async () => {
    const descriptor = lodash.clone(SCHEMA)
    descriptor.primaryKey = ['unknown']
    const errors = await catchError(validate, descriptor)
    assert.deepEqual(errors.length, 1)
  })

  it('ensure primary key as array match field names', async () => {
    const descriptor = lodash.clone(SCHEMA)
    descriptor.primaryKey = ['id', 'unknown']
    const errors = await catchError(validate, descriptor)
    assert.deepEqual(errors.length, 1)
  })

  it('ensure foreign keys is an array', async () => {
    const descriptor = lodash.clone(SCHEMA)
    descriptor.foreignKeys = 'keys'
    const errors = await catchError(validate, descriptor)
    assert.deepEqual(errors.length, 1)
  })

  it('ensure every foreign key has fields', async () => {
    const descriptor = lodash.clone(SCHEMA)
    descriptor.foreignKeys = ['key1', 'key2']
    const errors = await catchError(validate, descriptor)
    assert.deepEqual(errors.length, 2)
  })

  it('ensure fields in keys a string or an array', async () => {
    const descriptor = lodash.clone(SCHEMA)
    descriptor.foreignKeys = [{fields: {name: 'id'}}]
    const errors = await catchError(validate, descriptor)
    assert.deepEqual(errors.length, 2)
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
    const errors = await catchError(validate, descriptor)
    assert.deepEqual(errors.length, 2)
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
    const errors = await catchError(validate, descriptor)
    assert.deepEqual(errors.length, 3)
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
    const valid = await validate(descriptor)
    assert.ok(valid)
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
    const errors = await catchError(validate, descriptor)
    assert.deepEqual(errors.length, 3)
  })

  it('should support local descriptors', async function() {
    if (process.env.USER_ENV === 'browser') this.skip()
    const valid = await validate('data/schema.json')
    assert.ok(valid)
  })

})
