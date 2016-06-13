import _ from 'lodash'
import 'isomorphic-fetch'
import url from 'url'
import validate from './validate'
import utilities from './utilities'
import Type from './types'

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
    this.caseInsensitiveHeaders = caseInsensitiveHeaders
    this.type = new Type()

    return load(this, source)
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
   * @param index
   * @returns {Object|Null}
   */
  getField(fieldName, index = 0) {
    const field = _.filter(this.fields(),
                           F => _.includes(fieldName, F.name))[index]
    if (!field) {
      throw new Error(`No such field name in schema: ${fieldName}`)
    }
    return field
  }

  /**
   * Return all fields that match the given type
   *
   * @param typeName
   * @returns {Array}
   */
  getFieldsByType(typeName) {
    return _.filter(this.fields(), field => _.includes(typeName, field.type))
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
    const raw = _.chain(this.descriptor.fields).map(_.property('name')).value()

    if (this.caseInsensitiveHeaders) {
      return _.invokeMap(raw, 'toLowerCase')
    }
    return raw
  }

  /**
   * Get primary key
   * @returns {string|Array}
   */
  primaryKey() {
    return this.descriptor.primaryKey
  }

  /**
   * Get all headers with required constraints set to true
   * @returns {Array}
   */
  requiredHeaders() {
    const raw = _.chain(this.descriptor.fields)
      .filter(field => field.constraints.required === true)
      .map(_.property('name'))
      .value()

    if (this.caseInsensitiveHeaders) {
      return _.invokeMap(raw, 'toLowerCase')
    }
    return raw
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
  test(fieldName, value, index, skipConstraints = true) {
    const field = this.getField(fieldName, index)
    return this.type.test(field, value, skipConstraints)
  }
}

/**
 * Load a JSON source, from string, URL or buffer
 * @param source
 * @returns {Promise}
 */
function load(instance, source) {
  if (_.isString(source)) {
    if (utilities.isURL(url.parse(source).protocol)) {
      return new Promise((resolve, reject) => {
        fetch(source).then((response) => {
          if (response.status >= 400) {
            reject('Failed to download file due to bad response')
          }
          return response.json()
        }).then(json => {
          validate(json).then(() => {
            instance.descriptor = expand(json)
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
      instance.descriptor = expand(source)
      resolve(instance)
    }).catch(errors => {
      reject(errors)
    })
  })
}

/**
 * Expand the schema with additional default properties
 *
 * @param schema
 * @returns {*}
 */
function expand(schema) {
  const DEFAULTS = {
    constraints: { required: false }
    , format: 'default'
    , type: 'string'
  }

  return _.extend(
    {}
    , schema
    , {
      fields: (schema.fields || []).map(field => {
        const copyField = _.extend({}, field)

        // Ensure we have a default type if no type was declared
        if (!copyField.type) {
          copyField.type = DEFAULTS.type
        }

        // Ensure we have a default format if no format was
        // declared
        if (!copyField.format) {
          copyField.format = DEFAULTS.format
        }

        // Ensure we have a minimum constraints declaration
        if (!copyField.constraints) {
          copyField.constraints = DEFAULTS.constraints
        } else if (_.isUndefined(field.constraints.required)) {
          copyField.constraints.required = DEFAULTS.constraints.required
        }
        return copyField
      })
    })
}
