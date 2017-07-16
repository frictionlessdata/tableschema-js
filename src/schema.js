const fs = require('fs')
const lodash = require('lodash')
const {Field} = require('./field')
const {Profile} = require('./profile')
const {validate} = require('./validate')
const helpers = require('./helpers')


// Module API

class Schema {

  // Public

  /**
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  static async load(descriptor, {strict=false, caseInsensitiveHeaders=false}={}) {
    // Process descriptor
    descriptor = await helpers.retrieveDescriptor(descriptor)
    return new Schema(descriptor, {strict, caseInsensitiveHeaders})
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  get valid() {
    return this._errors.length === 0
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  get errors() {
    return this._errors
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  get descriptor() {
    // Never use this.descriptor inside this class (!!!)
    return this._nextDescriptor
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  get primaryKey() {
    const primaryKey = this._currentDescriptor.primaryKey || []
    return (lodash.isArray(primaryKey)) ? primaryKey : [primaryKey]
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  get foreignKeys() {
    return this._currentDescriptor.foreignKeys
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  get fields() {
    return this._fields
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  get fieldNames() {
    return this._fields.map(field => field.name)
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  addField(descriptor) {
    this._nextDescriptor.fields.push(descriptor)
    return this.commit()
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  removeField(name) {
    this._nextDescriptor.fields = this._nextDescriptor.fields.filter(field => {
      if (field.name !== name) return true
    })
    return this.commit()
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  getField(fieldName, {index=0}={}) {
    const name = fieldName
    const fields = lodash.filter(this._fields, field => {
      if (this._caseInsensitiveHeaders) {
        return field.name.toLowerCase === name.toLowerCase
      }
      return field.name === name
    })
    if (!fields.length) {
      return null
    }
    if (!index) {
      return fields[0]
    }
    return this._fields[index]
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  castRow(items, {failFast=false, skipConstraints=false}={}) {
    const headers = this.fieldNames
      , result = []
      , errors = []

    if (headers.length !== items.length) {
      throw [new Error('The number of items to convert does not match the ' +
                      'number of fields given in the schema')]
    }

    for (let i = 0, length = items.length; i < length; i += 1) {
      try {
        const field = this.getField(headers[i], i)
        const value = field.castValue(items[i], {constraints: !skipConstraints})

        // TODO: reimplement
        // That's very wrong - on schema level uniqueness doesn't make sense
        // and it's very bad to use it for exteral (by Table) monkeypatching
        if (!skipConstraints) {
          // unique constraints available only from Resource
          if (this.uniqueness && this.uniqueHeaders) {
            helpers.checkUnique(field.name, value, this.uniqueHeaders,
                                     this.uniqueness)
          }
        }
        result.push(value)
      } catch (e) {
        let error
        switch (e.name) {
          case 'UniqueConstraintsError':
            error = e.message
            break
          default:
            error = new Error(
              `Wrong type for header: ${headers[i]} and value: ${items[i]}`)
        }
        if (failFast === true) {
          throw new Array(error)
        } else {
          errors.push(error)
        }
      }
    }

    if (errors.length > 0) {
      throw errors
    }
    return result
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  commit() {
    if (lodash.isEqual(this._currentDescriptor, this._nextDescriptor)) return false
    this._currentDescriptor = lodash.cloneDeep(this._nextDescriptor)
    this._build()
    return true
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  save(target) {
    return new Promise((resolve, reject) => {
      const contents = JSON.stringify(this._currentDescriptor, null, 4)
      fs.writeFile(target, contents, error => (!error) ? resolve() : reject(error))
    })
  }

  // Private

  constructor(descriptor, {strict=false, caseInsensitiveHeaders=false}={}) {

    // Process descriptor
    descriptor = helpers.expandSchemaDescriptor(descriptor)

    // Set attributes
    this._strict = strict
    this._caseInsensitiveHeaders = caseInsensitiveHeaders
    this._currentDescriptor = lodash.cloneDeep(descriptor)
    this._nextDescriptor = lodash.cloneDeep(descriptor)
    this._profile = new Profile('table-schema')
    this._errors = []
    this._fields = []

    // Build instance
    this._build()

  }

  _build() {

    // Validate descriptor
    try {
      this._profile.validate(this._currentDescriptor)
      this._errors = []
    } catch (errors) {
      if (this._strict) throw errors
      this._errors = errors
    }

    // Populate fields
    this._fields = []
    for (let field of (this._currentDescriptor.fields || [])) {
      const missingValues = this._currentDescriptor.missingValues
      try {
        field = new Field(field, {missingValues})
      } catch (error) {
        field = false
      }
      this._fields.push(field)
    }

  }

}


module.exports = {
  Schema,
}
