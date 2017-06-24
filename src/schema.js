import fs from 'fs'
import _ from 'lodash'
import 'isomorphic-fetch'
import {Field} from './field'
import {validate} from './validate'
import * as helpers from './helpers'


// Module API

export class Schema {

  // Public

  /**
   * Load Schema instance
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  static load(descriptor, {caseInsensitiveHeaders}={caseInsensitiveHeaders: false}) {
    return new Promise(async (resolve, reject) => {
      try {
        descriptor = await helpers.retrieveDescriptor(descriptor)
        descriptor = helpers.expandSchemaDescriptor(descriptor)
        await validate(descriptor)
        const schema = new Schema(descriptor, {caseInsensitiveHeaders})
        resolve(schema)
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Get descriptor
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  get descriptor() {
    return this._descriptor
  }

  /**
   * Get primary key
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  get primaryKey() {
    return this._descriptor.primaryKey
  }

  /**
   * Get foregn keys of schema
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  get foreignKeys() {
    return this._descriptor.foreignKeys
  }

  /**
   * Get fields of schema
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  get fields() {
    return this._fields
  }

  /**
   * Get field names
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  get fieldNames() {
    return this._fields.map(field => field.name)
  }

  /**
   * Add field to schema
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  addField(descriptor) {
    throw new Error('Not Implemented')
  }

  /**
   * Remove field from schema
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  removeField(descriptor) {
    throw new Error('Not Implemented')
  }

  /**
   * Get field instance
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  getField(fieldName, {index}={index: 0}) {
    const name = fieldName
    const fields = _.filter(this._fields, field => {
      if (this._caseInsensitiveHeaders) {
        return field.name.toLowerCase === name.toLowerCase
      }
      return field.name === name
    })
    if (!fields.length) {
      throw new Error(`No such field name in schema: ${fieldName}`)
    }
    if (!index) {
      return fields[0]
    }
    return this._fields[index]
  }

  /**
   * Cast row
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  castRow(items, {failFast, skipConstraints}={failFast: false, skipConstraints: false}) {
    const headers = this.fieldNames
      , result = []
      , errors = []

    if (headers.length !== items.length) {
      throw new Array('The number of items to convert does not match the ' +
                      'number of fields given in the schema')
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
            error =
              `Wrong type for header: ${headers[i]} and value: ${items[i]}`
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
   * Save descriptor of schema into local file
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  save(path) {
    return new Promise((resolve, reject) => {
      fs.writeFile(path, this._descriptor, e => {
        if (e) {
          reject(e)
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * Update schema instance
   * https://github.com/frictionlessdata/tableschema-js#schema
   */
  update() {
    throw new Error('Not Implemented')
  }

  // Private

  constructor(descriptor, {caseInsensitiveHeaders}={caseInsensitiveHeaders: false}) {
    this._descriptor = descriptor
    this._caseInsensitiveHeaders = caseInsensitiveHeaders
    this._fields = []
    for (const field of descriptor.fields) {
      this._fields.push(new Field(field, {missingValues: this._descriptor.missingValues}))
    }
  }

}
