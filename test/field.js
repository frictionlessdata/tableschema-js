const {assert} = require('chai')
const {Field} = require('../src')
const {catchError} = require('./helpers')


// Constants

const DESCRIPTOR_MIN = {
  name: 'height',
  type: 'number',
}


// Tests

describe('Field', () => {

  it('should get correct instance', () => {
    const field = new Field(DESCRIPTOR_MIN)
    assert.equal(field.name, 'height')
    assert.equal(field.format, 'default')
    assert.equal(field.type, 'number')
  })

  it('should return true on test', () => {
    const field = new Field(DESCRIPTOR_MIN)
    assert.isTrue(field.testValue(1))
  })

  it('should return false on test', () => {
    const field = new Field(DESCRIPTOR_MIN)
    assert.isFalse(field.testValue('string'))
  })

  it('should cast value', () => {
    const field = new Field(DESCRIPTOR_MIN)
    assert.equal(field.castValue(1), 1)
  })

  it('should fail to cast value', () => {
    const field = new Field(DESCRIPTOR_MIN)
    assert.throws(() => {
      field.castValue('string')
    }, Error)
  })

  it('should expand descriptor by defaults', () => {
    const field = new Field({name: 'name'})
    assert.deepEqual(field.descriptor, {
      name: 'name',
      type: 'string',
      format: 'default',
    })
  })

  it('should parse descriptor with "enum" constraint', () => {
    const field = new Field({
      name: 'status',
      type: 'string',
      constraints: {
        enum: ['active', 'inactive']
      }
    })
    assert.equal(field.testValue('active'), true)
    assert.equal(field.testValue('inactive'), true)
  })

  it('should parse descriptor with "minimum" constraint', () => {
    const field = new Field({
      name: 'length',
      type: 'integer',
      constraints: {
        minimum: 100
      }
    })
    assert.equal(field.testValue(200), true)
    assert.equal(field.testValue(50), false)
  })


  it('should parse descriptor with "maximum" constraint', () => {
    const field = new Field({
      name: 'length',
      type: 'integer',
      constraints: {
        maximum: 100
      }
    })
    assert.equal(field.testValue(50), true)
    assert.equal(field.testValue(200), false)
  })

  it('should throw an error on incompatible value', async () => {
    const field = new Field({name: 'column', type: 'integer'})
    const error = await catchError(field.castValue.bind(field), 'bad-value')
    assert.include(error.message, 'value "bad-value"')
    assert.include(error.message, 'column "column"')
    assert.include(error.message, 'type "integer"')
    assert.include(error.message, 'format "default"')
  })

  it('should throw an error on incompatible constraint', async () => {
    const field = new Field({name: 'column', type: 'integer', constraints: {minimum: 1}})
    const error = await catchError(field.castValue.bind(field), 0)
    assert.include(error.message, 'value "0"')
    assert.include(error.message, '"minimum" constraint')
    assert.include(error.message, 'column "column"')
  })

})
