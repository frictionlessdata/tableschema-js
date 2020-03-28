const { assert } = require('chai')
const { TableSchemaError } = require('../src/errors')

// Tests

describe('TableSchemaError', () => {
  it('should work with one error', () => {
    const error = new TableSchemaError('message')
    assert.deepEqual(error.message, 'message')
    assert.deepEqual(error.multiple, false)
    assert.deepEqual(error.errors, [])
  })

  it('should work with multiple errors', () => {
    const errors = [new Error('error1'), new Error('error2')]
    const error = new TableSchemaError('message', errors)
    assert.deepEqual(error.message, 'message')
    assert.deepEqual(error.multiple, true)
    assert.deepEqual(error.errors.length, 2)
    assert.deepEqual(error.errors[0].message, 'error1')
    assert.deepEqual(error.errors[1].message, 'error2')
  })

  it('should be catchable as a normal error', () => {
    try {
      throw new TableSchemaError('message')
    } catch (error) {
      assert.deepEqual(error.message, 'message')
      assert.deepEqual(error instanceof Error, true)
      assert.deepEqual(error instanceof TableSchemaError, true)
    }
  })
})
