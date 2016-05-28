/* global describe, it, beforeEach */
import { assert } from 'chai'
import constraints from '../src/constraints'
import utilities from '../src/utilities'

const moment = require('moment')

describe('Constraints', () => {
  it('unique constraint is not supported', (done) => {
    assert.throws(() => {
      constraints.check_unique()
    }, Error)
    done()
  })

  it('require throws error if value is "null"', (done) => {
    for (const value of utilities.NULL_VALUES) {
      assert.throws(() => {
        constraints.check_required('name', value, true)
      }, Error)
    }
    done()
  })

  it('require returns true if value is not null', (done) => {
    assert.isTrue(constraints.check_required('name', 0, true))
    done()
  })

  it('minLength throws error if value length less than minLength', (done) => {
    assert.throws(() => {
      constraints.check_minLength('name', 'string', 8)
    }, Error)
    done()
  })

  it('minLength returns true if minLength constraint are met', (done) => {
    assert.isTrue(constraints.check_minLength('name', 'string', 6))
    done()
  })

  it('maxLength throws error if value length bigger than maxLength', (done) => {
    assert.throws(() => {
      constraints.check_maxLength('name', 'string', 4)
    }, Error)
    done()
  })

  it('minLength returns true if maxLength constraint are met', (done) => {
    assert.isTrue(constraints.check_maxLength('name', 'string', 6))
    done()
  })

  it('minimum throws error if value less than minimum', (done) => {
    assert.throws(() => {
      constraints.check_minimum('name', '4', 5)
    }, Error)
    assert.throws(() => {
      constraints.check_minimum('name', moment('2016-05-26'), '2016-06-26')
    }, Error)
    done()
  })

  it('minimum throws error if value type is not supported', (done) => {
    assert.throws(() => {
      constraints.check_minimum('name', 'string', 5)
    }, Error)
    done()
  })

  it('minimum return true if value bigger than minimum', (done) => {
    assert.isTrue(constraints.check_minimum('name', '4', 4))
    assert.isTrue(constraints.check_minimum('name', '4', 3))
    assert.isTrue(
      constraints.check_minimum('name', moment('2016-06-26 00:00:01'),
                                '2016-06-26'))
    done()
  })

  it('maximum throws error if value bigger than maximum', (done) => {
    assert.throws(() => {
      constraints.check_maximum('name', '9.01', 5)
    }, Error)
    assert.throws(() => {
      constraints.check_maximum('name', moment('2016-08-26'), '2016-06-26')
    }, Error)
    done()
  })

  it('maximum throws error if value type is not supported', (done) => {
    assert.throws(() => {
      constraints.check_maximum('name', 'string', 5)
    }, Error)
    done()
  })

  it('maximum return true if value less than maximum', (done) => {
    assert.isTrue(constraints.check_maximum('name', '4', 4))
    assert.isTrue(constraints.check_maximum('name', 4.3, 8))
    assert.isTrue(
      constraints.check_maximum('name', moment('2016-06-25 00:11:12'),
                                '2016-06-26'))
    done()
  })

  it('pattern throws error if value is not match', (done) => {
    assert.throws(() => {
      constraints.check_pattern('name', 'String without match', '/test/gim')
    }, Error)
    done()
  })

  it('pattern return true if value match', (done) => {
    assert.isTrue(
      constraints.check_pattern('name', 'String for test', '/test/gim'))
    done()
  })

  it('enum return true if value is in', (done) => {
    const array = ['test', 'value']
      , obj = {
      test: 2,
      value: array
    }

    assert.isTrue(constraints.check_enum('name', 'test', array))
    assert.isTrue(constraints.check_enum('name', 'test', obj))
    done()
  })

  it('enum throws error if is not enum', (done) => {
    assert.throws(() => {
      constraints.check_enum('name', 'test', 'string')
    }, Error)
    done()
  })
})
