const fs = require('fs')
const moment = require('moment')
const min = require('lodash/min')
const zip = require('lodash/zip')
const isArray = require('lodash/isArray')
const isEqual = require('lodash/isEqual')
const isString = require('lodash/isString')
const cloneDeep = require('lodash/cloneDeep')
const isBoolean = require('lodash/isBoolean')
const upperFirst = require('lodash/upperFirst')
const { TableSchemaError } = require('./errors')
const { Profile } = require('./profile')
const helpers = require('./helpers')
const config = require('./config')
const { Field } = require('./field')
const types = require('./types')

// Module API

/**
 * Schema representation
 */
class Schema {
  // Public

  /**
   * Factory method to instantiate `Schema` class.
   *
   * This method is async and it should be used with await keyword or as a `Promise`.
   *
   * @param {(string|Object)} descriptor - schema descriptor:
   *   - local path
   *   - remote url
   *   - object
   * @param {boolean} strict - flag to alter validation behaviour:
   *   - if false error will not be raised and all error will be collected in `schema.errors`
   *   - if strict is true any validation error will be raised immediately
   * @throws {TableSchemaError} raises any error occurred in the process
   * @returns {Schema} returns schema class instance
   */
  static async load(descriptor = {}, { strict = false, caseInsensitiveHeaders = false } = {}) {
    // Process descriptor
    descriptor = await helpers.retrieveDescriptor(descriptor)

    return new Schema(descriptor, { strict, caseInsensitiveHeaders })
  }

  /**
   * Validation status
   *
   * It always `true` in strict mode.
   *
   * @returns {Boolean} returns validation status
   */
  get valid() {
    return this._errors.length === 0
  }

  /**
   * Validation errors
   *
   * It always empty in strict mode.
   *
   * @returns {Error[]} returns validation errors
   */
  get errors() {
    return this._errors
  }

  /**
   * Descriptor
   *
   * @returns {Object} schema descriptor
   */
  get descriptor() {
    // Never use this.descriptor inside this class (!!!)
    return this._nextDescriptor
  }

  /**
   * Primary Key
   *
   * @returns {string[]} schema primary key
   */
  get primaryKey() {
    const primaryKey = this._currentDescriptor.primaryKey || []
    return isArray(primaryKey) ? primaryKey : [primaryKey]
  }

  /**
   * Foreign Keys
   *
   * @returns {Object[]} schema foreign keys
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
   * Fields
   *
   * @returns {Field[]} schema fields
   */
  get fields() {
    return this._fields
  }

  /**
   * Field names
   *
   * @returns {string[]} schema field names
   */
  get fieldNames() {
    return this._fields.map((field) => field.name)
  }

  /**
   * Return a field
   *
   * @param {string} fieldName
   * @returns {(Field|null)} field instance if exists
   */
  getField(fieldName, { index = 0 } = {}) {
    const name = fieldName
    const fields = this._fields.filter((field) => {
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
   * Add a field
   *
   * @param {Object} descriptor
   * @returns {Field} added field instance
   */
  addField(descriptor) {
    if (!this._currentDescriptor.fields) this._currentDescriptor.fields = []
    this._currentDescriptor.fields.push(descriptor)
    this._build()
    return this._fields[this._fields.length - 1]
  }

  /**
   * Remove a field
   *
   * @param {string} name
   * @returns {(Field|null)} removed field instance if exists
   */
  removeField(name) {
    const field = this.getField(name)
    if (field) {
      const predicat = (field) => field.name !== name
      this._currentDescriptor.fields = this._currentDescriptor.fields.filter(predicat)
      this._build()
    }
    return field
  }

  /**
   * Cast row based on field types and formats.
   *
   * @param {Array[]} row - data row as an array of values
   * @param {boolean} failFalst
   * @returns {Array[]} cast data row
   */
  castRow(row, { failFast = false } = {}) {
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
        // Recreate the failing field to throw proper error message
        if (!field) new Field(this._currentDescriptor.fields[index]) // eslint-disable-line
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
   * Infer and set `schema.descriptor` based on data sample.
   *
   * @param {Array[]} rows - array of arrays representing rows
   * @param {(integer|string[])} headers - data sample headers (one of):
   *   - row number containing headers (`rows` should contain headers rows)
   *   - array of headers (`rows` should NOT contain headers rows)
   *   - defaults to 1
   * @returns {Object} Table Schema descriptor
   */
  infer(rows, { headers = 1 } = {}) {
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
    const descriptor = {
      fields: headers.map((header) => {
        return { name: header, type: 'any', format: 'default' }
      }),
    }

    // Get inferred descriptor
    const threshold = min([rows.length, config.INFER_THRESHOLD])
    for (const [fieldIndex, field] of descriptor.fields.entries()) {
      const counter = {}
      for (const [rowIndex, row] of rows.entries()) {
        const inspectionCount = rowIndex + 1
        const inspection = JSON.stringify(inspectValue(row[fieldIndex]))
        counter[inspection] = (counter[inspection] || 0) + 1
        if (inspectionCount >= threshold) {
          if (counter[inspection] / inspectionCount >= config.INFER_CONFIDENCE) {
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
   * Update schema instance if there are in-place changes in the descriptor.
   *
   * @example
   *
   * ```javascript
   * const descriptor = {fields: [{name: 'field', type: 'string'}]}
   * const schema = await Schema.load(descriptor)
   *
   * schema.getField('name').type // string
   * schema.descriptor.fields[0].type = 'number'
   * schema.getField('name').type // string
   * schema.commit()
   * schema.getField('name').type // number
   * ```
   *
   * @param {boolean} strict - alter `strict` mode for further work
   * @throws {TableSchemaError} raises any error occurred in the process
   * @returns {Boolean} returns true on success and false if not modified
   */
  commit({ strict } = {}) {
    if (isBoolean(strict)) this._strict = strict
    else if (isEqual(this._currentDescriptor, this._nextDescriptor)) return false
    this._currentDescriptor = cloneDeep(this._nextDescriptor)
    this._build()
    return true
  }

  /**
   * Save schema descriptor to target destination.
   *
   * @param {string} target - path where to save a descriptor
   * @throws {TableSchemaError} raises any error occurred in the process
   * @returns {boolean} returns true on success
   */
  save(target) {
    return new Promise((resolve, reject) => {
      const contents = JSON.stringify(this._currentDescriptor, null, 4)
      fs.writeFile(target, contents, (error) => (!error ? resolve() : reject(error)))
    })
  }

  // Private

  constructor(descriptor = {}, { strict = false, caseInsensitiveHeaders = false } = {}) {
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
    const { valid, errors } = this._profile.validate(this._currentDescriptor)
    if (!valid) {
      this._errors = errors
      if (this._strict) {
        const message = `There are ${errors.length} validation errors (see 'error.errors')`
        throw new TableSchemaError(message, errors)
      }
    }

    // Populate fields
    this._fields = []
    for (let field of this._currentDescriptor.fields || []) {
      const missingValues = this._currentDescriptor.missingValues
      try {
        field = new Field(field, { missingValues })
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
  '%m/%d/%y': 'date',
  '%m/%d/%Y': 'date',
  '%H:%M': 'time',
}
const INSPECT_VALUE_GUESS_ORDER = [
  // This format is too broad
  // {type: 'year', format: 'default'},
  { type: 'yearmonth', format: 'default' },
  { type: 'duration', format: 'default' },
  { type: 'geojson', format: 'default' },
  { type: 'geojson', format: 'topojson' },
  { type: 'geopoint', format: 'default' },
  { type: 'geopoint', format: 'array' },
  { type: 'geopoint', format: 'object' },
  { type: 'object', format: 'default' },
  { type: 'array', format: 'default' },
  { type: 'datetime', format: 'default' },
  // This format is too broad
  // {type: 'datetime', format: 'any'},
  { type: 'time', format: 'default' },
  // This format is too broad
  // {type: 'time', format: 'any'},
  { type: 'date', format: 'default' },
  // This format is too broad
  // {type: 'date', format: 'any'},
  { type: 'integer', format: 'default' },
  { type: 'number', format: 'default' },
  { type: 'boolean', format: 'default' },
  { type: 'string', format: 'uuid' },
  { type: 'string', format: 'email' },
  { type: 'string', format: 'uri' },
  { type: 'string', format: 'default' },
  { type: 'any', format: 'default' },
]

function inspectValue(value) {
  // Heuristic
  if (isString(value)) {
    // Guess year
    if (value.length === 4) {
      if (value.match(INSPECT_VALUE_YEAR_PATTERN)) {
        return { type: 'year', format: 'default' }
      }
    }

    // Guess date/time
    for (const [format, type] of Object.entries(INSPECT_VALUE_DATE_TIME_MAPPING)) {
      if (moment(value, helpers.convertDatetimeFormatFromFDtoJS(format), true).isValid()) {
        return { type, format }
      }
    }
  }

  // Automatic
  for (const { type, format } of INSPECT_VALUE_GUESS_ORDER) {
    const cast = types[`cast${upperFirst(type)}`]
    const result = cast(format, value)
    if (result === config.ERROR) continue
    return { type, format }
  }
}

// System

module.exports = {
  Schema,
}
