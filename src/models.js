import { _ } from 'underscore'
import { Promise } from 'bluebird'
import { request } from 'superagent'
import { url } from 'url'
import ensure from './ensure'
import utilities from './utilities'
import types from './types'

const DEFAULTS = {
  constraints: { required: false }
  , format: 'default'
  , type: 'string'
}
/**
 * Model for a JSON Table Schema.
 *
 * Providers handy helpers for ingesting, validating and outputting
 * JSON Table Schemas: http://dataprotocols.org/json-table-schema/
 *
 * @param {string|dict} source: A filepath, url or dictionary that represents a
 *   schema
 *
 * @param {boolean} caseInsensitiveHeaders: if True, headers should be
 * considered case insensitive, and `SchemaModel` forces all
 * headers to lowercase when they are represented via a model
 * instance. This setting **does not** mutate the actual strings
 * that come from the the input schema source, so out put methods
 * such as as_python and as_json are **not** subject to this flag.
 */

export default class SchemaModel {
  constructor(source, caseInsensitiveHeaders = false) {
    this.caseInsensitiveHeaders = caseInsensitiveHeaders

    // Map a JSON Table Schema type to a JTSKit type class
    this.typeMap = {
      string: types.StringType
      , number: types.NumberType
      , integer: types.IntegerType
      , boolean: types.BooleanType
      , array: types.ArrayType
      , object: types.ObjectType
      , date: types.DateType
      , time: types.TimeType
      , datetime: types.DateTimeType
      , geopoint: types.GeoPointType
      , geojson: types.GeoJSONType
      , any: types.AnyType
    }

    this.loadJSON(source)

    // FIXME is it needed to manually call loadSchema method or it should load
    // schema automatically?
    // Manually use .loadSource() to get schema in case
    // of URL passed instead of schema
  }

  /**
   * Check if value can be cast to fieldName's type
   *
   * @param fieldName
   * @param value
   * @param index
   *
   * @returns {Boolean}
   */
  cast(fieldName, value, index) {
    return this.getType(fieldName, index || 0).cast(value)
  }

  convertRow(...args) {
    let items = args
      , failFast = false
    if (_.isArray(args[0])) {
      items = args[0]
    }
    const headers = this.headers()
      , result = []
      , errors = []
      , last = _.last(items)

    if (last && last.hasOwnProperty('failFast')) {
      items.pop()
      if (last.failFast === true) {
        failFast = true
      }
    }

    if (headers.length !== items.length) {
      throw new Error('The number of items to convert does not match the ' +
                      'number of fields given in the schema')
    }
    for (let i = 0, length = items.length; i < length; i++) {
      try {
        const value = this.cast(headers[i], items[i])
        result.push(value)
      } catch (e) {
        const error = `Wrong type for header: ${headers[i]} and item: ${items[i]}`
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

  convert(items, failFast = false) {
    const result = []
    let errors = []
    for (const item of items) {
      try {
        item.push({ failFast })
        result.push(this.convertRow(item))
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
   * Expand the schema with additional default properties
   *
   * @param schema
   * @returns {*}
   */
  expand(schema) {
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
            copyField.constraints.required =
              DEFAULTS.constraints.required
          }
          return copyField
        })
      })
  }

  fields() {
    return this.schema.fields
  }

  foreignKeys() {
    return this.schema.foreignKeys
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
    try {
      return _.where(this.fields(), { name: fieldName })[index]
    } catch (e) {
      return null
    }
  }

  /**
   * Return all fields that match the given type
   *
   * @param typeName
   * @returns {Array}
   */
  getFieldsByType(typeName) {
    return _.where(this.fields(), { type: typeName })
  }

  /**
   * Return the `type` for `fieldName`.
   *
   * @param fieldName
   * @param index
   * @returns {Type}
   */
  getType(fieldName, index = 0) {
    const field = this.getField(fieldName, index)
    return new this.typeMap[field.type](field)
  }

  /**
   * Check if the field exists in the schema
   *
   * @param fieldName
   * @returns {boolean}
   */
  hasField(fieldName) {
    return !!this.getField(fieldName)
  }

  headers() {
    const raw = _.chain(this.schema.fields).map(_.property('name')).value()

    if (this.caseInsensitiveHeaders) {
      return _.invoke(raw, 'toLowerCase')
    }
    return raw
  }

  // Load a JSON source, from string, URL or buffer, into a Python type.
  loadJSON(source) {
    if (_.isNull(source) || _.isUndefined(source)) {
      return
    } else if (_.isObject(source) && !_.isFunction(source)) {
      // The source has already been loaded. Return JSON
      this.validateAndExpand(source)
      return
    }

    if (_.contains(utilities.REMOTE_SCHEMES,
                   url.parse(source).protocol.replace(':', ''))) {
      this.schemaPromise = new Promise((resolve, reject) => {
        request.get(source).end((error, response) => {
          if (error) {
            reject(`Failed to download registry file: ${error}`)
          } else {
            try {
              resolve(JSON.parse(response))
            } catch (e) {
              reject('Failed to parse JSON from registry file')
            }
          }
        })
      })
    }
    // WARN There is no possibility to have browser compatable code which can
    // load file
  }

  /**
   * Load schema from URL
   *
   * @returns {Promise}
   */
  loadSchema() {
    return this.schemaPromise.then(this.validateAndExpand)
  }

  primaryKey() {
    return this.schema.primaryKey
  }

  requiredHeaders() {
    const raw = _.chain(this.schema.fields)
      .filter(field => field.constraints.required === true)
      .map(_.property('name'))
      .value()

    if (this.caseInsensitiveHeaders) {
      return _.invoke(raw, 'toLowerCase')
    }
    return raw
  }

  validateAndExpand(value) {
    if (_.isUndefined(value) || _.isNull(value)) {
      throw new Error('Invalid JSON')
    }

    if (!ensure(value)[0]) {
      throw new Error('Invalid schema')
    }

    this.schema = this.expand(value)

    return this
  }
}
