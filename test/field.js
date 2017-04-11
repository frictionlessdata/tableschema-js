import { assert } from 'chai'
import Field from '../src/field'

// Tests

describe('Field', () => {

  it('should get correct instance', () => {
      const field = new Field({
        name: 'height',
        type: 'number',
      })
      assert.equal(field.name, 'height')
      assert.equal(field.format, 'default')
      assert.equal(field.type, 'number')
  })

  it('should return true on test', () => {
      const field = new Field({
        name: 'height',
        type: 'number',
      })
      assert.isTrue(field.testValue(1))
  })

  it('should return false on test', () => {
      const field = new Field({
        name: 'height',
        type: 'number',
      })
      assert.isFalse(field.testValue('string'))
  })

  it('should cast value', () => {
      const field = new Field({
        name: 'height',
        type: 'number',
      })
      assert.equal(field.castValue(1), 1)
  })

  it('should fail to cast value', () => {
      const field = new Field({
        name: 'height',
        type: 'number',
      })
      assert.throws(() => {
        field.castValue('string')
      }, Error)
  })
})
