import {assert, should} from 'chai'
import Field from '../src/field'
should()

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
      field.descriptor.should.be.deep.equal({
        name: 'name',
        type: 'string',
        format: 'default',
      })
  })

})
