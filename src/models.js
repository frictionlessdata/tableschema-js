let _ = require('underscore')
  , ensure = require('./ensure')
  , Promise = require('bluebird')
  , types = require('./types')
  , utilities = require('./utilities')
  , DEFAULTS = {
    constraints: {required: true}
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

function SchemaModel(source, caseInsensitiveHeaders = false) {
  this.source = source
  this.caseInsensitiveHeaders = caseInsensitiveHeaders

  let asJs = this.toJs()

  // Manually use .loadSource() to get schema in case of URL passed instead of
  // schema
  if (asJs instanceof Promise) {
    this.schemaPromise = asJs
    return this
  }

  this.validateAndExpand(asJs)
}

SchemaModel.prototype = _.extend(
  SchemaModel.prototype
  , {
    // Return boolean if value can be cast to fieldName's type.
    cast: function (fieldName, value, index) {
      return this.getType(fieldName, index || 0).cast(value)
    }

    // Expand the schema with additional default properties.
    , expand: function (schema) {
      return _.extend(
        schema
        , {
          fields: _.map(schema.fields || [], function (field) {
            // Ensure we have a default type if no type was declared
            if (!field.type) {
              field.type = DEFAULTS.type
            }

            // Ensure we have a default format if no format was declared
            if (!field.format) {
              field.format = DEFAULTS.format
            }

            // Ensure we have a minimum constraints declaration
            if (!field.constraints) {
              field.constraints = DEFAULTS.constraints
            } else if (_.isUndefined(field.constraints.required)) {
              field.constraints.required = DEFAULTS.constraints.required
            }

            return field
          }, this)
        })
    }

    , fields: function () {
      return this.asJs.fields
    }
    , foreignKeys: function () {
      return this.asJs.foreignKeys
    }

    // Return the `constraints` object for `fieldName`.
    , getConstraints: function (fieldName, index) {
      return this.getField(fieldName, index || 0).constraints
    }

    // Return the `field` object for `fieldName`.
    // `index` allows accessing a field name by position, as JTS allows
    // duplicate field names.
    , getField: function (fieldName, index) {
      try {
        return _.where(this.fields(), {name: fieldName})[index || 0]
      } catch (e) {
        return null
      }
    }

    // Return all fields that match the given type.
    , getFieldsByType: function (typeName) {
      return _.where(this.fields(), {type: typeName})
    }

    // Return the `type` for `fieldName`.
    , getType: function (fieldName, index) {
      let field = this.getField(fieldName, index || 0)

      return this.typeMap[field.type](field)
    }

    // Return boolean if the field exists in the schema.
    , hasField: function (fieldName) {
      return Boolean(this.getField(fieldName))
    }

    , headers: function () {
      let raw = _.chain(this.asJs.fields).map(_.property('name')).value()

      if (this.caseInsensitiveHeaders) {
        return _.invoke(raw, 'toLowerCase')
      }
      return raw
    }

    // Load schema from URL passed in init
    , loadSchema: function () {
      return this.schemaPromise.then(this.validateAndExpand)
    }

    , primaryKey: function () {
      return this.asJs.primaryKey
    }

    , requiredHeaders: function () {
      let raw = _.chain(this.asJs.fields)
        .filter(function (field) {
          return field.constraints.required
        })
        .map(_.property('name'))
        .value()

      if (this.caseInsensitiveHeaders) {
        return _.invoke(raw, 'toLowerCase')
      }

      return raw
    }

    // Return schema as an Object.
    , toJs: function () {
      try {
        return utilities.loadJSONSource(this.source)
      } catch (e) {
        return null
      }
    }

    // Map a JSON Table Schema type to a JTSKit type class.
    , typeMap: {
      string: types.StringType
      , number: types.NumberType
      , integer: types.IntegerType
      , boolean: types.BooleanType
      , null: types.NullType
      , array: types.ArrayType
      , object: types.ObjectType
      , date: types.DateType
      , time: types.TimeType
      , datetime: types.DateTimeType
      , geopoint: types.GeoPointType
      , geojson: types.GeoJSONType
      , any: types.AnyType
    }

    , validateAndExpand: function (value) {
      if (_.isUndefined(value) || _.isNull(value)) {
        throw new Error('Invalid JSON')
      }

      if (!ensure(value)[0]) {
        throw new Error('Invalid schema')
      }

      this.asJs = this.expand(value)
      this.asJSON = JSON.stringify(this.asJs)

      return this
    }
  })

module.exports = SchemaModel
