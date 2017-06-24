import _ from 'lodash'
import 'isomorphic-fetch'
import fs from 'fs'
import {validate} from './validate'
import {Field} from './field'
import * as helpers from './helpers'


// Module API

/**
 * Model for a Table Schema.
 *
 * Providers handy helpers for ingesting, validating and outputting
 * Table Schemas: http://specs.frictionlessdata.io/table-schema/
 *
 * Use async `Schema.load(descriptor)` to instantiate this class.
 *
 */
export class Schema {

  // Public

  /**
   * Load `Schema` instance.
   *
   * @param {string|JSON} descriptor: An url or object that represents a schema
   * @param {boolean} caseInsensitiveHeaders: if True, headers should be
   *   considered case insensitive
   *
   * @returns Promise
   */
  static load(descriptor, caseInsensitiveHeaders=false) {
    return new Promise(async (resolve, reject) => {
      try {
        descriptor = await helpers.retrieveDescriptor(descriptor)
        descriptor = helpers.expandSchemaDescriptor(descriptor)
        await validate(descriptor)
        const schema = new Schema(descriptor, caseInsensitiveHeaders)
        resolve(schema)
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Convert the arguments given to the types of the current schema. Last
   * argument could be { failFast: true|false }.  If the option `failFast` is
   * given, it will raise the first error it encounters, otherwise an array of
   * errors thrown (if there are any errors occur)
   *
   * @param items
   * @param failFast
   * @param skipConstraints
   * @returns {Array}
   */
  castRow(items, failFast = false, skipConstraints = false) {
    const headers = this.headers
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
   * Get descriptor
   *
   * @returns {Array}
   */
  get descriptor() {
    return this._descriptor
  }

  /**
   * Get fields of schema
   *
   * @returns {Array}
   */
  get fields() {
    return this._fields
  }

  /**
   * Get foregn keys of schema
   *
   * @returns {Array}
   */
  get foreignKeys() {
    return this._descriptor.foreignKeys
  }

  /**
   * Return the `field` object for `fieldName`.
   * `index` allows accessing a field name by position, as JTS allows duplicate
   * field names.
   *
   * @param fieldName
   * @param index - index of the field inside the fields array
   * @returns {Object}
   * @throws Error in case fieldName does not exists in the given schema
   */
  getField(fieldName, index = 0) {
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
   * Get all headers with required constraints set to true
   * @returns {Array}
   */
  get requiredHeaders() {
    const result = []
    _.forEach(this._fields, F => {
      if (F.required) {
        result.push(F.name)
      }
    })

    return result
  }

  /**
   * Check if the field exists in the schema
   *
   * @param fieldName
   * @returns {boolean}
   */
  hasField(fieldName) {
    try {
      return !!this.getField(fieldName)
    } catch (e) {
      return false
    }
  }

  /**
   * Get names of the headers
   *
   * @returns {Array}
   */
  get headers() {
    return _.map(this._fields, F => F.name)
  }

  /**
   * Get primary key
   * @returns {string|Array}
   */
  get primaryKey() {
    return this._descriptor.primaryKey
  }

  /**
   * Save descriptor of schema into local file
   *
   * @param path
   * @returns {Promise}
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

  // Private

  constructor(descriptor, caseInsensitiveHeaders=false) {
    this._descriptor = descriptor
    this._caseInsensitiveHeaders = caseInsensitiveHeaders
    this._fields = []
    for (const field of descriptor.fields) {
      this._fields.push(new Field(field, {missingValues: this._descriptor.missingValues}))
    }
  }

}
