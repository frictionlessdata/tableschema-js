const fs = require('fs')
const lodash = require('lodash')
const {TableSchemaError} = require('./errors')
const {Profile} = require('./profile')
const helpers = require('./helpers')
const {ERROR} = require('./config')
const {Field} = require('./field')
const types = require('./types')


// Module API

class Schema {

  // Public

  /**
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  static async load(descriptor={}, {strict=false, caseInsensitiveHeaders=false}={}) {
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
  castRow(items, {failFast=false, skipConstraints=false}={}) {
    // TODO: this method has to be rewritten
    const headers = this.fieldNames
    const result = []
    const errors = []

    if (headers.length !== items.length) {
      const message = 'Row dimension doesn\'t match schema\'s fields dimension'
      throw new TableSchemaError(message)
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
            error = new TableSchemaError(e.message)
            break
          default:
            error = new TableSchemaError(
              `Wrong type for header: ${headers[i]} and value: ${items[i]}`)
        }
        if (failFast === true) {
          throw error
        } else {
          errors.push(error)
        }
      }
    }

    if (errors.length > 0) {
      const message = `There are ${errors.length} cast errors (see 'error.errors')`
      throw new TableSchemaError(message, errors)
    }

    return result
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  infer(rows, {headers=1}={}) {

    // Get headers
    if (!lodash.isArray(headers)) {
      let headersRow = headers
      for (;;) {
        headersRow -= 1
        headers = rows.shift()
        if (!headersRow) break
      }
    }

    // Get descriptor
    const descriptor = {fields: []}
    for (const [index, header] of headers.entries()) {
      // This approach is not effective, we should go row by row
      const columnValues = lodash.map(rows, row => row[index])
      const type = _guessType(columnValues)
      const field = {name: header, type}
      descriptor.fields.push(field)
    }

    // Commit descriptor
    this._nextDescriptor = descriptor
    this.commit()

    return descriptor
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  commit({strict}={}) {
    if (lodash.isBoolean(strict)) this._strict = strict
    else if (lodash.isEqual(this._currentDescriptor, this._nextDescriptor)) return false
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

  constructor(descriptor={}, {strict=false, caseInsensitiveHeaders=false}={}) {

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

    // Process descriptor
    this._currentDescriptor = helpers.expandSchemaDescriptor(this._currentDescriptor)
    this._nextDescriptor = lodash.cloneDeep(this._currentDescriptor)

    // Validate descriptor
    this._errors = []
    const {valid, errors} = this._profile.validate(this._currentDescriptor)
    if (!valid) {
      this._errors = errors
      if (this._strict) {
        const message = `There are ${errors.length} validation errors (see 'error.errors')`
        throw new TableSchemaError(message, errors)
      }
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


// Internal

const _GUESS_TYPE_ORDER = [
  'duration',
  'geojson',
  'geopoint',
  'object',
  'array',
  'datetime',
  'time',
  'date',
  'integer',
  'number',
  'boolean',
  'string',
  'any',
]


function _guessType(row) {

  // Get matching types
  const matches = []
  for (const value of row) {
    for (const type of _GUESS_TYPE_ORDER) {
      const cast = types[`cast${lodash.upperFirst(type)}`]
      const result = cast('default', value)
      if (result !== ERROR) {
        matches.push(type)
        break
      }
    }
  }

  // Get winner type
  let winner = 'any'
  let count = 0
  for (const [itemType, itemCount] of Object.entries(lodash.countBy(matches))) {
    if (itemCount > count) {
      winner = itemType
      count = itemCount
    }
  }

  return winner
}


// System

module.exports = {
  Schema,
}
