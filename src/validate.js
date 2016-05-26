import { _ } from 'underscore'
import utilities from './utilities'

/**
 Validate that `schema` is a valid JSON Table Schema.

 Args:
 * `schema`: a dict to check if it is valid JSON Table Schema

 Returns:
 * A tuple of `valid`, `errors`
 */
export default (schema) => {
  const errors = []
    , fieldNames = _.map(_.result(schema, 'fields') || [], _.property('name'))
  let valid = true

  /**
   * Check if schema is an object
   */
  if (!isHash(schema)) {
    valid = false
    addError('should be an object')
    throw errors
  }

  /**
   * Check if schema contains fields
   */
  if (!schema.fields || !_.isArray(schema.fields) ||
      schema.fields.length === 0) {
    valid = false
    addError('must have an array of fields')
    throw errors
  }

  /**
   * Each entry in the `fields` array MUST be an object
   */
  if (!_.every(schema.fields, (field) => isHash(field))) {
    valid = false
    addError('Each field in JSON Table Schema must be an object.', false)
  }

  /**
   * Each entry in the `fields` array MUST have a `name` key
   */
  if (!_.every(schema.fields, field => Boolean(field.name))) {
    valid = false
    addError('field must have a name key.')
  }

  /**
   * Each entry in the `fields` array MAY have a `constraints` key if
   * `constraints` is present, then `constraints` MUST be an object
   */
  if (!_.every(schema.fields,
               field => !field.constraints || isHash(field.constraints))) {
    valid = false
    addError('field constraint must be an object')
  }

  /**
   * Constraints may contain certain keys (each has a specific meaning)
   */
  _.chain(schema.fields).filter(field => !!field.constraints).each(field => {
    const constraints = field.constraints

    // IF `required` key, then it is a boolean
    if (isHas(constraints, 'required') && !_.isBoolean(constraints.required)) {
      valid = false
      addError('required constraint must be a boolean.')
    }

    // IF `unique` key, then it is a boolean
    if (isHas(constraints, 'unique') && !_.isBoolean(constraints.unique)) {
      valid = false
      addError('unique constraint must be a boolean.')
    }

    // IF `minLength` key, then it is an integer
    if (isHas(constraints, 'minLength') &&
        !utilities.isInteger(constraints.minLength)) {
      valid = false
      addError('minLength constraint must be an integer.')
    }

    // IF `maxLength` key, then it is an integer
    if (isHas(constraints, 'maxLength') &&
        !utilities.isInteger(constraints.maxLength)) {
      valid = false
      addError('maxLength constraint must be an integer')
    }

    // IF `pattern` key, then it is a regex
    if (isHas(constraints, 'pattern') && !_.isString(constraints.pattern)) {
      valid = false
      addError('pattern constraint must be a string.')
    }

    // IF `minimum` key, then it DEPENDS on `field` TYPE
    if (isHas(constraints, 'minimum')) {
      // IF `type` is integer
      if ((field.type === 'integer' || field.type === 'number')) {
        if (!utilities.isNumeric(constraints.minimum)) {
          valid = false
          addError('minimum constraint which is an integer is only valid if ' +
                   'the encompassing field is also of type integer')
        }
      } else if ((field.type === 'date' || field.type === 'datetime')) {
        if (!_.isDate(constraints.minimum)) {
          // WARN Probably need to check for moment() type if we decide to go
          // with moment() for dates IF `type` is date
          valid = false
          addError('minimum constraint which is a date is only valid if the ' +
                   'encompassing field is also of type date')
        }
      } else {
        valid = false
        addError('minimum constraint is present with unclear application' +
                 ' (field is not an integer or a date)')
      }
    }

    if (isHas(constraints, 'maximum')) {
      // IF `type` is integer
      if ((field.type === 'integer' || field.type === 'number')) {
        if (!utilities.isNumeric(constraints.maximum)) {
          valid = false
          addError('maximum constraint which is an integer is only valid if' +
                   ' the encompassing field is also of type integer')
        }
      } else if ((field.type === 'date' || field.type === 'datetime')) {
        if (!_.isDate(constraints.maximum)) {
          // WARN Probably need to check for moment() type if we decide to go
          // with moment() for dates IF `type` is date
          valid = false
          addError('maximum constraint which is a date is only valid if the' +
                   ' encompassing field is also of type date')
        }
      } else {
        valid = false
        addError('maximum constraint is present with unclear application' +
                 ' (field is not an integer or a date)')
      }
    }
  })

  // The hash MAY contain a key `primaryKey`
  if (schema.primaryKey) {
    const primaryKey = schema.primaryKey
    // `primaryKey` MUST be a string or an array
    // Ensure that the primary key matches field names
    if (_.isString(primaryKey)) {
      if (!_.contains(fieldNames, primaryKey)) {
        valid = false
        addError('primaryKey value must be found in the schema field names')
      }
    } else if (_.isArray(primaryKey)) {
      _.each(primaryKey, pk => {
        if (!_.contains(fieldNames, pk)) {
          valid = false
          addError('primaryKey value must be found in the schema field names')
        }
      })
    } else {
      valid = false
      addError('primaryKey must be either a string or an array.')
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

      // Ensure that `foreignKey.fields` match field names
      _.each(foreignKeys, fk => {
        if (_.isString(fk.fields)) {
          if (!_.contains(fieldNames, fk.fields)) {
            valid = false
            addError('foreignKey.fields must correspond with field names')
          }
        } else {
          if ((_.intersection(fieldNames, fk.fields) || []).length <
              fk.fields.length) {
            valid = false
            addError('foreignKey.fields must correspond with field names')
          }
        }

        // Ensure that `foreignKey.reference` is present and is a hash
        if (!isHash(fk.reference)) {
          addError('foreignKey.reference must be a hash.')
          // there are no sense to continue
          throw errors
        }

        // Ensure that `foreignKey.reference` has a `resource` key
        if (!_.contains(_.keys(fk.reference), 'resource')) {
          valid = false
          addError('foreignKey.reference must have a resource key.')
        }

        // Ensure that `foreignKey.reference` has a `fields` key
        if (!_.contains(_.keys(fk.reference), 'fields')) {
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
    } else {
      valid = false
      addError('foreignKeys must be an array.')
    }
  }

  if (!valid) throw errors

  function addError(error, isSuffix = true) {
    if (isSuffix) {
      errors.push(`A JSON Table Schema ${error}`)
    } else {
      errors.push(error)
    }
  }

  function isHash(value) {
    return _.isObject(value) && !_.isArray(value) && !_.isFunction(value)
  }

  function isHas(source, property) {
    return source.hasOwnProperty(property)
  }
}
