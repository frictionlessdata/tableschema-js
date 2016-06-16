import _ from 'lodash'
import 'isomorphic-fetch'
import url from 'url'
import validate from './validate'
import utilities from './utilities'
import Type from './types'
import constraints from './constraints'

/**
 * Model for a JSON Table Schema.
 *
 * Providers handy helpers for ingesting, validating and outputting
 * JSON Table Schemas: http://dataprotocols.org/json-table-schema/
 *
 * @param {string|JSON} source: An url or object that represents a schema
 *
 * @param {boolean} caseInsensitiveHeaders: if True, headers should be
 *   considered case insensitive, and `Schema` forces all headers to lowercase
 *   when they are represented via a model instance. This setting **does not**
 *   mutate the origin that come from the the input schema source.
 *
 * @returns Promise
 */
export default class Schema {
  constructor(source, caseInsensitiveHeaders = false) {
    this.caseInsensitiveHeaders = !!caseInsensitiveHeaders
    this.type = new Type()
    return load(this, source)
  }

  /**
   * Cast value to fieldName's type
   *
   * @param fieldName
   * @param value
   * @param index
   * @param skipConstraints
   *
   * @returns {Type}
   * @throws Error if value can't be casted
   */
  cast(fieldName, value, index = 0, skipConstraints = true) {
    const field = this.getField(fieldName, index)
    return this.type.cast(field, value, skipConstraints)
  }

  /**
   * Check if value to fieldName's type can be casted
   *
   * @param fieldName
   * @param value
   * @param index
   * @param skipConstraints
   *
   * @returns {Boolean}
   */
  test(fieldName, value, index = 0, skipConstraints = true) {
    const field = this.getField(fieldName, index)
    return this.type.test(field, value, skipConstraints)
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
  convertRow(items, failFast = false, skipConstraints = false) {
    const headers = this.headers()
      , result = []
      , errors = []

    if (headers.length !== items.length) {
      throw new Error('The number of items to convert does not match the ' +
                      'number of fields given in the schema')
    }

    for (let i = 0, length = items.length; i < length; i++) {
      try {
        const fieldName = headers[i]
          , value = this.cast(fieldName, items[i], i, skipConstraints)

        if (!skipConstraints) {
          // unique constraints available only from Resource
          if (this.uniqueness && this.uniqueHeaders) {
            constraints.check_unique(fieldName, value, this.uniqueHeaders,
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
          throw new Error(error)
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
   * Convert an array of rows to the types of the current schema. If the option
   * `failFast` is given, it will raise the first error it encounters,
   * otherwise an array of errors thrown (if there are any errors occur)
   *
   * @param items
   * @param failFast
   * @param skipConstraints
   * @returns {Array}
   */
  convert(items, failFast = false, skipConstraints = false) {
    const result = []
    let errors = []

    for (const item of items) {
      try {
        result.push(this.convertRow(item, failFast, skipConstraints))
      } catch (e) {
        if (failFast === true) {
          throw e
        } else {
          errors = errors.concat(e)
        }
      }
    }

    if (errors.length > 0) {
      throw errors
    }
    return result
  }

  /**
   * Get fields of schema
   *
   * @returns {Array}
   */
  fields() {
    return this.descriptor.fields
  }

  /**
   * Get foregn keys of schema
   *
   * @returns {Array}
   */
  foreignKeys() {
    return this.descriptor.foreignKeys
  }

  /**
   * Return the `constraints` object for `fieldName`.
   * @param {string} fieldName
   * @param {number} index
   * @returns {object}
   */
  getConstraints(fieldName, index = 0) {
    return this.getField(fieldName, index).constraints
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
    let name = fieldName
    if (this.caseInsensitiveHeaders) {
      name = fieldName.toLowerCase()
    }
    const fields = _.filter(this.fields(), F => F.name === name)

    if (!fields.length) {
      throw new Error(`No such field name in schema: ${fieldName}`)
    }

    if (!index) {
      return fields[0]
    }
    return this.fields()[index]
  }

  /**
   * Return all fields that match the given type
   *
   * @param typeName
   * @returns {Array}
   */
  getFieldsByType(typeName) {
    return _.filter(this.fields(), field => field.type === typeName)
  }

  /**
   * Get all headers with required constraints set to true
   * @returns {Array}
   */
  getRequiredHeaders() {
    return _.chain(this.descriptor.fields)
      .filter(field => field.constraints.required === true)
      .map(field => field.name)
      .value()
  }

  /**
   * Get all headers with unique constraints set to true
   * @returns {Array}
   */
  getUniqueHeaders() {
    return _.chain(this.descriptor.fields)
      .filter(field => field.constraints.unique === true)
      .map(field => field.name)
      .value()
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
  headers() {
    return _.map(this.descriptor.fields, field => field.name)
  }

  /**
   * Get primary key
   * @returns {string|Array}
   */
  primaryKey() {
    return this.descriptor.primaryKey
  }
}

/**
 * Load a JSON source, from string, URL or buffer
 * @param instance
 * @param source
 * @returns {Promise}
 */
function load(instance, source) {
  if (_.isString(source)) {
    if (utilities.isURL(url.parse(source).protocol)) {
      return new Promise((resolve, reject) => {
        fetch(source).then(response => {
          if (response.status >= 400) {
            reject('Failed to download file due to bad response')
          }
          return response.json()
        }).then(json => {
          validate(json).then(() => {
            expand(instance, json)
            resolve(instance)
          }).catch(errors => {
            reject(errors)
          })
        })
      })
    }
  }
  return new Promise((resolve, reject) => {
    validate(source).then(() => {
      expand(instance, source)
      resolve(instance)
    }).catch(errors => {
      reject(errors)
    })
  })
}

/**
 * Expand the schema with additional default properties
 *
 * @param instance
 * @param schema
 * @returns {*}
 */
function expand(instance, schema) {
  const DEFAULTS = {
    constraints: { required: false }
    , format: 'default'
    , type: 'string'
  }

  instance.descriptor = _.extend(
    {}
    , schema
    , {
      fields: _.map((schema.fields || []), field => {
        const copyField = _.extend({}, field)

        // Set name to lower case if caseInsensitiveHeaders flag is True
        if (instance.caseInsensitiveHeaders) {
          copyField.name = field.name.toLowerCase()
        }

        // Ensure we have a default type if no type was declared
        if (!field.type) {
          copyField.type = DEFAULTS.type
        }

        // Ensure we have a default format if no format was declared
        if (!field.format) {
          copyField.format = DEFAULTS.format
        }

        // Ensure we have a minimum constraints declaration
        if (!field.constraints) {
          copyField.constraints = DEFAULTS.constraints
        } else if (_.isUndefined(field.constraints.required)) {
          copyField.constraints.required = DEFAULTS.constraints.required
        }
        return copyField
      })
    })
}
