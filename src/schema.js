const fs = require('fs')
const min = require('lodash/min')
const zip = require('lodash/zip')
const isArray = require('lodash/isArray')
const isEqual = require('lodash/isEqual')
const isString = require('lodash/isString')
const cloneDeep = require('lodash/cloneDeep')
const isBoolean = require('lodash/isBoolean')
const upperFirst = require('lodash/upperFirst')
const {timeParse} = require('d3-time-format')
const {TableSchemaError} = require('./errors')
const {Profile} = require('./profile')
const helpers = require('./helpers')
const config = require('./config')
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
    rows = cloneDeep(rows)

    // Get headers
    if (!isArray(headers)) {
      let headersRow = headers
      for (;;) {
        headersRow -= 1
        headers = rows.shift()
        if (!headersRow) break
      }
    }

    // Get deafult descriptor
    const descriptor = {fields: headers.map(header => {
      return {name: header, type: 'any', format: 'default'}
    })}

    // Get inferred descriptor
    const threshold = min([rows.length, config.INFER_THRESHOLD])
    for (const [fieldIndex, field] of descriptor.fields.entries()) {
      const counter = {}
      for (const [rowIndex, row] of rows.entries()) {
        const inspectionCount = rowIndex + 1
        const inspection = JSON.stringify(inspectValue(row[fieldIndex]))
        counter[inspection] = (counter[inspection] || 0) + 1
        if (inspectionCount >= threshold) {
          if (counter[inspection]/inspectionCount >= config.INFER_CONFIDENCE) {
            Object.assign(field, JSON.parse(inspection))
            break
          }
        }
      }
    }

    // Set descriptor
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

const INSPECT_VALUE_YEAR_PATTERN = /[12]\d{3}/
const INSPECT_VALUE_DATE_TIME_MAPPING = {
  // TODO:
  // Decide on resonable amount of heuristics here
  // and fill this mapping based on the decision
  '%d/%m/%y': 'date',
  '%d/%m/%Y': 'date',
  '%H:%M': 'time',
}
const INSPECT_VALUE_GUESS_ORDER = [
  // This format is too broad
  // {type: 'year', format: 'default'},
  {type: 'yearmonth', format: 'default'},
  {type: 'duration', format: 'default'},
  {type: 'geojson', format: 'default'},
  {type: 'geojson', format: 'topojson'},
  {type: 'geopoint', format: 'default'},
  {type: 'geopoint', format: 'array'},
  {type: 'geopoint', format: 'object'},
  {type: 'object', format: 'default'},
  {type: 'array', format: 'default'},
  {type: 'datetime', format: 'default'},
  // This format is too broad
  // {type: 'datetime', format: 'any'},
  {type: 'time', format: 'default'},
  // This format is too broad
  // {type: 'time', format: 'any'},
  {type: 'date', format: 'default'},
  // This format is too broad
  // {type: 'date', format: 'any'},
  {type: 'integer', format: 'default'},
  {type: 'number', format: 'default'},
  {type: 'boolean', format: 'default'},
  {type: 'string', format: 'uuid'},
  {type: 'string', format: 'binary'},
  {type: 'string', format: 'email'},
  {type: 'string', format: 'uri'},
  {type: 'string', format: 'default'},
  {type: 'any', format: 'default'},
]


function inspectValue(value) {

  // Heuristic
  if (isString(value)) {

    // Guess year
    if (value.length === 4) {
      if (value.match(INSPECT_VALUE_YEAR_PATTERN)) {
        return {type: 'year', format: 'default'}
      }
    }

    // Guess date/time
    for (const [format, type] of Object.entries(INSPECT_VALUE_DATE_TIME_MAPPING)) {
      if (timeParse(format)(value)) {
        return {type, format}
      }
    }

  }

  // Automatic
  for (const {type, format} of INSPECT_VALUE_GUESS_ORDER) {
    const cast = types[`cast${upperFirst(type)}`]
    const result = cast(format, value)
    if (result === config.ERROR) continue
    return {type, format}
  }

}


// System

module.exports = {
  Schema,
}
