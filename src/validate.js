import _ from 'lodash'
import tv4 from 'tv4'
import * as helpers from './helpers'
import profile from '../profiles/table-schema.json'

/**
 Validate that `schema` is a valid Table Schema.

 Args:
 * `schema`: a dict to check if it is valid Table Schema

 Returns:
 * Promise. In case of success true, in error - list of errors
 */
export default schema => {
  schema = helpers.expandSchemaDescriptor(schema)

  const fieldNames = _.map(schema.fields || [], _.property('name'))

  return new Promise((resolve, reject) => {
    const result = tv4.validateMultiple(schema, profile)
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

  /**
   * Extract useful information from the tv4 errors object
   * @param values
   * @returns {Array}
   */
  function errors(values) {
    const result = []
    _.forEach(values, error => {
      result.push(message(error))
    })
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
            `primary key ${primaryKey} must match schema field names`)
        }
      } else if (_.isArray(primaryKey)) {
        _.each(primaryKey, pk => {
          if (!_.includes(fieldNames, pk)) {
            valid = false
            errs.push(
              `primary key ${pk} must match schema field names`)
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
              `foreign key ${fk.fields} must match schema field names`)
          }

          if (!_.isString(fk.reference.fields)) {
            valid = false
            errs.push(
              `foreign key ${fk.reference.fields} must be same type as ${fk.fields}`)
          }
        } else if (_.isArray(fk.fields)) {
          _.each(fk.fields, field => {
            if (!_.includes(fieldNames, field)) {
              valid = false
              errs.push(
                `foreign key ${field} must match schema field names`)
            }
          })
          if (!_.isArray(fk.reference.fields)) {
            valid = false
            errs.push(
              `foreign key ${fk.reference.fields} must be same type as ${fk.fields}`)
          } else if (fk.reference.fields.length !== fk.fields.length) {
            valid = false
            errs.push('foreign key fields must contain the same number ' +
                      'entries as reference.fields')
          }
        }

        if (fk.reference.resource === '') {
          if (_.isString(fk.reference.fields)) {
            if (!_.includes(fieldNames, fk.reference.fields)) {
              valid = false
              errs.push(
                `foreign key ${fk.fields} must be found in the schema field names`)
            }
          } else if (_.isArray(fk.reference.fields)) {
            _.each(fk.reference.fields, field => {
              if (!_.includes(fieldNames, field)) {
                valid = false
                errs.push(
                  `foreign key ${field} must be found in the schema field names`)
              }
            })
          }
        }
      })
    }

    return {
      valid
      , errors: errs
    }
  }
}
