import fetch from 'isomorphic-fetch'
import _ from 'lodash'
import tv4 from 'tv4'

/**
 Validate that `schema` is a valid JSON Table Schema.

 Args:
 * `schema`: a dict to check if it is valid JSON Table Schema

 Returns:
 * A tuple of `valid`, `errors`
 */
export default schema => {
  const fieldNames = _.map(schema.fields || [], _.property('name'))

  return new Promise((resolve, reject) => {
    fetch('http://schemas.datapackages.org/json-table-schema.json')
      .then(response => {
        if (response.status >= 400) {
          return reject(['Failed to download JSON schema'])
        }
        return response.json()
      })
      .then(standard => {
        const result = tv4.validateMultiple(schema, standard)
        if (result.valid) {
          const validation = extra()
          if (validation.valid) {
            resolve(true)
          } else {
            reject(validation.errors)
          }
        } else {
          reject(errors(result.errors))
        }
      })
  })

  /**
   * Extract useful information from the tv4 errors object
   * @param values
   * @returns {Array}
   */
  function errors(values) {
    const result = []
    for (const error of values) {
      result.push(message(error))
    }
    return result
  }

  /**
   * Create useful message from the each error occur
   * @param error
   * @returns {*}
   */
  function message(error) {
    let result = error.message
    if (error.dataPath) {
      result += ` in "${error.dataPath}"`
    }
    if (error.schemaPath) {
      result += ` schema path: "${error.schemaPath}"`
    }
    return result
  }

  /**
   * Extra validation for schema which can't be covered by tv4 validator
   * - primary key
   * @returns {{valid: boolean, errors: Array}}
   */
  function extra() {
    const errs = []
    let valid = true

    /**
     * Schema may contain a `primary key`
     */
    if (schema.primaryKey) {
      const primaryKey = schema.primaryKey
      // Ensure that the primary key matches field names
      if (_.isString(primaryKey)) {
        if (!_.includes(fieldNames, primaryKey)) {
          valid = false
          errs.push(
            `primary key ${primaryKey} must be found in the schema field names`)
        }
      } else if (_.isArray(primaryKey)) {
        _.each(primaryKey, pk => {
          if (!_.includes(fieldNames, pk)) {
            valid = false
            errs.push(
              `primary key ${pk} must be found in the schema field names`)
          }
        })
      }
    }

    /**
     * Schema may contain a `foreign keys`
     */
    if (schema.foreignKeys) {
      const foreignKeys = schema.foreignKeys
      _.each(foreignKeys, fk => {
        if (_.isString(fk.fields)) {
          if (!_.includes(fieldNames, fk.fields)) {
            valid = false
            errs.push(
              `foreign key ${fk.fields} must be found in the schema field names`)
          }
        } else if (_.isArray(fk.fields)) {
          _.each(fk.fields, field => {
            if (!_.includes(fieldNames, field)) {
              valid = false
              errs.push(
                `foreign key ${field} must be found in the schema field names`)
            }
          })
        }
      })
    }

    return {
      valid
      , errors: errs
    }
  }

  /**
   * The hash may contain a key `foreignKeys`
   */
  if (schema.foreignKeys) {
    const foreignKeys = schema.foreignKeys
    // `foreignKeys` MUST be an array
    if (_.isArray(foreignKeys)) {
      // Each `foreignKey` in `foreignKeys` MUST have a `fields` key
      if (!_.every(foreignKeys, fk => Boolean(fk.fields))) {
        addError('foreignKey must have a fields key.')
        // there are no sense to continue
        throw errors
      }

      // Each `fields` key in a `foreignKey` MUST be a string or array
      if (!_.every(foreignKeys,
                   fk => _.isString(fk.fields) || _.isArray(fk.fields))) {
        addError('foreignKey.fields type must be a string or an array.')
        // there are no sense to continue
        throw errors
      }

      _.each(foreignKeys, fk => {


        // Ensure that `foreignKey.reference` is present and is a hash
        if (!isHash(fk.reference)) {
          addError('foreignKey.reference must be a hash.')
          // there are no sense to continue
          throw errors
        }

        // Ensure that `foreignKey.reference` has a `resource` key
        if (!_.includes(_.keys(fk.reference), 'resource')) {
          valid = false
          addError('foreignKey.reference must have a resource key.')
        }

        // Ensure that `foreignKey.reference` has a `fields` key
        if (!_.includes(_.keys(fk.reference), 'fields')) {
          valid = false
          addError('foreignKey.reference must have a fields key.')
        }

        // Ensure that `foreignKey.reference.fields` matches outer `fields`
        if (_.isString(fk.fields)) {
          if (!_.isString(fk.reference.fields)) {
            valid = false
            addError('foreignKey.reference.fields must match field names.')
          }
        } else {
          if (fk.fields.length !== fk.reference.fields.length) {
            valid = false
            addError('must have a fields key.')
          }
        }
      })
    }
  }

  function isHash(value) {
    return _.isObject(value) && !_.isArray(value) && !_.isFunction(value)
  }
}
