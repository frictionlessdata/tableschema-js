import { _ } from 'underscore'

/**
 Validate that `schema` is a valid JSON Table Schema.

 Args:
 * `schema`: a dict to check if it is valid JSON Table Schema

 Returns:
 * A tuple of `valid`, `errors`
 */
export default (schema) => {
  const errors = []
    , fieldsNames = _.map(_.result(schema, 'fields') || [], _.property('name'))
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
  if (!_.every(schema.fields, (field) => Boolean(field.name))) {
    valid = false
    addError('field must have a name key.')
  }

  /**
   * Each entry in the `fields` array MAY have a `constraints` key if
   * `constraints` is present, then `constraints` MUST be an object
   */
  if (!_.every(schema.fields,
               (field) => !field.constraints || isHash(field.constraints))) {
    valid = false
    addError('field constraint must be an object')
  }

  // Constraints may contain certain keys (each has a specific meaning)
  _.chain(schema.fields).filter((field) => Boolean(field.constraints))
    .each((field) => {
      // IF `required` key, then it is a boolean
      if (field.constraints.required &&
          !_.isBoolean(field.constraints.required)) {
        valid = false
        addError('required constraint must be a boolean.')
      }

      // IF `minLength` key, then it is an integer
      if (field.constraints.minLength &&
          !_.isNumber(field.constraints.minLength)) {
        valid = false
        addError('minLength constraint must be an integer.')
      }

      // IF `maxLength` key, then it is an integer
      if (field.constraints.maxLength &&
          !_.isNumber(field.constraints.maxLength)) {
        valid = false
        addError('maxLength constraint must be an integer')
      }

      // IF `unique` key, then it is a boolean
      if (field.constraints.unique && !_.isBoolean(field.constraints.unique)) {
        valid = false
        addError('unique constraint must be a boolean.')
      }

      // IF `pattern` key, then it is a regex
      if (field.constraints.pattern && !_.isString(field.constraints.pattern)) {
        valid = false
        addError('pattern constraint must be a string.')
      }

      // IF `minimum` key, then it DEPENDS on `field` TYPE
      if (field.constraints.minimum) {
        // IF `type` is integer
        if (_.isNumber(field.type) && !_.isNumber(field.constraints.minimum)) {
          valid = false
          addError('minimum constraint which is an integer is only valid if ' +
                   'the encompassing field is also of type integer')
        } else if (_.isDate(field.type) &&
                   !_.isDate(field.constraints.minimum)) {
          // WARN Probably need to chack for moment() type if we decide to go
          // with moment() for dates IF `type` is date
          valid = false
          addError('minimum constraint which is a date is only valid if the ' +
                   'encompassing field is also of type date')
        } else {
          valid = false
          addError('minimum constraint is present with unclear application' +
                   ' (field is not an integer or a date)')
        }
      }

      if (field.constraints.maximum) {
        // IF `type` is integer
        if (_.isNumber(field.type) && !_.isNumber(field.constraints.maximum)) {
          valid = false
          addError('maximum constraint which is an integer is only valid if' +
                   ' the encompassing field is also of type integer')
        } else if (_.isDate(field.type) &&
                   !_.isDate(field.constraints.maximum)) {
          // WARN Probably need to check for moment() type if we decide to go
          // with moment() for dates IF `type` is date
          valid = false
          addError('maximum constraint which is a date is only valid if the' +
                   ' encompassing field is also of type date')
        } else {
          valid = false
          addError('maximum constraint is present with unclear application' +
                   ' (field is not an integer or a date)')
        }
      }
    })

  // The hash MAY contain a key `primaryKey`
  if (schema.primaryKey) {
    // `primaryKey` MUST be a string or an array
    if (!(_.isString(schema.primaryKey) || _.isArray(schema.primaryKey))) {
      valid = false
      addError('primaryKey must be either a string or an array.')
    }

    // Ensure that the primary key matches field names
    if (_.isString(schema.primaryKey)) {
      if (!_.contains(fieldsNames, schema.primaryKey)) {
        valid = false
        addError('primaryKey value must be found in the schema field names')
      }
    } else {
      _.each(schema.primaryKey, (PK) => {
        if (_.contains(fieldsNames, PK)) {
          valid = false
          addError('primaryKey value must be found in the schema field names')
        }
      })
    }
  }

  // The hash may contain a key `foreignKeys`
  if (schema.foreignKeys) {
    // `foreignKeys` MUST be an array
    if (!_.isArray(schema.foreignKeys)) {
      valid = false
      addError('foreignKeys must be an array.')
    }

    // Each `foreignKey` in `foreignKeys` MUST be a hash
    if (!_.every(schema.foreignKeys, FK => isHash(FK))) {
      valid = false
      addError('`foreignKey` must be a hash.')
    }

    // Each `foreignKey` in `foreignKeys` MUST have a `fields` key
    if (!_.every(schema.foreignKeys, FK => Boolean(FK.fields))) {
      valid = false
      addError('foreignKey must have a fields key.')
    }

    // Each `fields` key in a `foreignKey` MUST be a string or array
    if (!_.every(schema.foreignKeys,
                 FK => _.isString(FK.fields) || _.isArray(FK.fields))) {
      valid = false
      addError('foreignKey.fields type must be a string or an array.')
    }

    _.each(schema.foreignKeys, (FK) => {
      // Ensure that `foreignKey.fields` match field names
      if (_.isString(FK.fields)) {
        if (!_.contains(fieldsNames, FK.fields)) {
          valid = false
          addError('foreignKey.fields value must correspond with field names.')
        }
      } else {
        if ((_.intersection(fieldsNames, FK.fields) || []).length <
            FK.fields.length) {
          valid = false
          addError('foreignKey.fields value must correspond with field names.')
        }
      }

      // Ensure that `foreignKey.reference` is present and is a hash
      if (!isHash(FK.reference)) {
        valid = false
        addError('foreignKey.reference must be a hash.')
      }

      // Ensure that `foreignKey.reference` has a `resource` key
      if (!_.contains(_.keys(FK.reference), 'resource')) {
        valid = false
        addError('foreignKey.reference must have a resource key.')
      }

      // Ensure that `foreignKey.reference` has a `fields` key
      if (!_.contains(_.keys(FK.reference), 'fields')) {
        valid = false
        addError('foreignKey.reference must have a fields key.')
      }

      // Ensure that `foreignKey.reference.fields` matches outer `fields`
      if (_.isString(FK.fields)) {
        if (!_.isString(FK.reference.fields)) {
          valid = false
          addError('foreignKey.reference.fields must match field names.')
        }
      } else {
        if (FK.fields.length !== FK.reference.fields.length) {
          valid = false
          addError('must have a fields key.')
        }
      }
    })
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
}
