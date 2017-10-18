const fs = require('fs')
const zip = require('lodash/zip')
const isArray = require('lodash/isArray')
const isEqual = require('lodash/isEqual')
const countBy = require('lodash/countBy')
const cloneDeep = require('lodash/cloneDeep')
const isBoolean = require('lodash/isBoolean')
const upperFirst = require('lodash/upperFirst')
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
    return (isArray(primaryKey)) ? primaryKey : [primaryKey]
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  get foreignKeys() {
    const foreignKeys = this._currentDescriptor.foreignKeys || []
    for (const key of foreignKeys) {
      key.fields = key.fields || []
      key.reference = key.reference || {}
      key.reference.resource = key.reference.resource || ''
      key.reference.fields = key.reference.fields || []
      if (!isArray(key.fields)) {
        key.fields = [key.fields]
      }
      if (!isArray(key.reference.fields)) {
        key.reference.fields = [key.reference.fields]
      }
    }
    return foreignKeys
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
    const fields = this._fields.filter(field => {
      if (this._caseInsensitiveHeaders) return field.name.toLowerCase === name.toLowerCase
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
    if (!this._currentDescriptor.fields) this._currentDescriptor.fields = []
    this._currentDescriptor.fields.push(descriptor)
    this._build()
    return this._fields[this._fields.length - 1]
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  removeField(name) {
    const field = this.getField(name)
    if (field) {
      const predicat = field => field.name !== name
      this._currentDescriptor.fields = this._currentDescriptor.fields.filter(predicat)
      this._build()
    }
    return field
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  castRow(row, {failFast=false}={}) {
    const result = []
    const errors = []

    // Check row length
    if (row.length !== this.fields.length) {
      throw new TableSchemaError(
        `The row with ${row.length} values does not match ` +
        `the ${this.fields.length} fields in the schema`
      )
    }

    // Cast row
    for (const [index, [field, value]] of zip(this.fields, row).entries()) {
      try {
        result.push(field.castValue(value))
      } catch (error) {
        error.columnNumber = index + 1
        if (failFast) throw error
        errors.push(error)
      }
    }

    // Raise errors
    if (errors.length) {
      const message = `There are ${errors.length} type and format mismatch errors (see 'error.errors')`
      throw new TableSchemaError(message, errors)
    }

    return result
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  infer(rows, {headers=1}={}) {

    // Get headers
    if (!isArray(headers)) {
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
      const columnValues = rows.map(row => row[index])
      const type = _guessType(columnValues)
      const field = {name: header, type}
      descriptor.fields.push(field)
    }

    // Save descriptor
    this._currentDescriptor = descriptor
    this._build()

    return descriptor
  }

  /**
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  commit({strict}={}) {
    if (isBoolean(strict)) this._strict = strict
    else if (isEqual(this._currentDescriptor, this._nextDescriptor)) return false
    this._currentDescriptor = cloneDeep(this._nextDescriptor)
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
    this._currentDescriptor = cloneDeep(descriptor)
    this._nextDescriptor = cloneDeep(descriptor)
    this._profile = new Profile('table-schema')
    this._errors = []
    this._fields = []

    // Build instance
    this._build()

  }

  _build() {

    // Process descriptor
    this._currentDescriptor = helpers.expandSchemaDescriptor(this._currentDescriptor)
    this._nextDescriptor = cloneDeep(this._currentDescriptor)

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
      const cast = types[`cast${upperFirst(type)}`]
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
  for (const [itemType, itemCount] of Object.entries(countBy(matches))) {
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
