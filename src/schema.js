import _ from 'lodash'
import 'isomorphic-fetch'
import url from 'url'
import fs from 'fs'
import validate from './validate'
import utilities from './utilities'
import Field from './field'
import constraints from './constraints'

/**
 * Model for a Table Schema.
 *
 * Providers handy helpers for ingesting, validating and outputting
 * Table Schemas: http://specs.frictionlessdata.io/table-schema/
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
    this.Fields = []
    return load(this, source)
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
          , value = field.castValue(items[i], skipConstraints)

        if (!skipConstraints) {
          // unique constraints available only from Resource
          if (this.uniqueness && this.uniqueHeaders) {
            constraints.check_unique(field.name, value, this.uniqueHeaders,
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
   * Get fields of schema
   *
   * @returns {Array}
   */
  get fields() {
    return this.Fields
  }

  /**
   * Get foregn keys of schema
   *
   * @returns {Array}
   */
  get foreignKeys() {
    return this.descriptor.foreignKeys
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
    const fields = _.filter(this.fields, F => F.name === name)

    if (!fields.length) {
      throw new Error(`No such field name in schema: ${fieldName}`)
    }

    if (!index) {
      return fields[0]
    }
    return this.fields[index]
  }

  /**
   * Get all headers with required constraints set to true
   * @returns {Array}
   */
  get requiredHeaders() {
    const result = []
    _.forEach(this.fields, F => {
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
    return _.map(this.Fields, F => F.name)
  }

  /**
   * Get primary key
   * @returns {string|Array}
   */
  get primaryKey() {
    return this.descriptor.primaryKey
  }

  /**
   * Save descriptor of schema into local file
   *
   * @param path
   * @returns {Promise}
   */
  save(path) {
    return new Promise((resolve, reject) => {
      fs.writeFile(path, this.descriptor, e => {
        if (e) {
          reject(e)
        } else {
          resolve()
        }
      })
    })
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
            throw new Error('Failed to download file due to bad response')
          }
          return response.json()
        }).then(json => {
          validate(json).then(() => {
            expand(instance, json)
            resolve(instance)
          }).catch(errors => {
            reject(errors)
          })
        }).catch(e => {
          reject(e)
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
    , descriptor = _.extend(
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
        instance.Fields.push(new Field(copyField))
        return copyField
      })
    })

  if (_.isString(descriptor.primaryKey)) {
    descriptor.primaryKey = [descriptor.primaryKey]
  }

  instance.descriptor = Object.freeze(descriptor)
}
