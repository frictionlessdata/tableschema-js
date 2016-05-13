const _ = require('underscore')
  , utilities = require('./utilities')

/**
 Validate that `schema` is a valid JSON Table Schema.

 Args:
 * `schema`: a dict to check if it is valid JSON Table Schema

 Returns:
 * A tuple of `valid`, `errors`
 */
export function ensure(schema) {
  const fieldsNames = _.map(_.result(schema, 'fields') || [],
                            _.property('name'))

  let valid = true
    , errors = []

  // A schema is a hash
  if (!utilities.isHash(schema)) {
    valid = false
    addError('should be a hash.')

    // Return early in this case.
    return [valid, errors]
  }

  // Which MUST contain a key `fields`
  if (!schema.fields) {
    valid = false
    addError('must have a fields key.')

    // Return early in this case.
    return [valid, errors]
  }

  // `fields` MUST be an array
  if (!_.isArray(schema.fields)) {
    valid = false
    addError('must have an array of fields.')

    // Return early in this case.
    return [valid, errors]
  }

  // Each entry in the `fields` array MUST be a hash
  if (!_.every(schema.fields, (field) => utilities.isHash(field))) {
    valid = false
    addError('Each field in JSON Table Schema must be a hash.', false)
  }

  // Each entry in the `fields` array MUST have a `name` key
  if (!_.every(schema.fields, (field) => Boolean(field.name))) {
    valid = false
    addError('field must have a name key.')
  }

  // Each entry in the `fields` array MAY have a `constraints` key
  // if `constraints` is present, then `constraints` MUST be a hash
  if (!_.every(schema.fields,
               (field) => !field.constraints ||
                          utilities.isHash(field.constraints)
    )) {
    valid = false
    errors =
      addError('field constraint must be a hash.')
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
        }

        // WARN Probably need to chack for moment() type if we decide to go
        // with moment() for dates IF `type` is date
        else if (_.isDate(field.type) && !_.isDate(field.constraints.minimum)) {
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
        }
        // WARN Probably need to check for moment() type if we decide to go
        // with moment() for dates IF `type` is date
        else if (_.isDate(field.type) && !_.isDate(field.constraints.maximum)) {
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
    if (!_.every(schema.foreignKeys, FK => utilities.isHash(FK))) {
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
      if (!utilities.isHash(FK.reference)) {
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

  return [valid, errors]

  function addError(error, isSuffix = true) {
    if (isSuffix) {
      errors.push(`A JSON Table Schema ${error}`)
    } else {
      errors.push(error)
    }
  }
}

//module.exports = ensure
