var _ = require('underscore');
var utilities = require('./utilities');


module.exports = function(schema) {
  /*
  Validate that `schema` is a valid JSON Table Schema.

  Args:
  * `schema`: a dict to check if it is valid JSON Table Schema

  Returns:
  * A tuple of `valid`, `errors`
  */

  var fieldsNames = _.map(_.result(schema, 'fields') || [], _.property('name'));
  var errors = [];
  var valid = true;


  // A schema is a hash
  if(!utilities.isHash(schema)) {
    valid = false;
    errors = errors.concat('A JSON Table Schema should be a hash.')

    // Return early in this case.
    return [valid, errors];
  }

  // Which MUST contain a key `fields`
  if(!schema.fields) {
    valid = false;
    errors = errors.concat('A JSON Table Schema must have a fields key.')

    // Return early in this case.
    return [valid, errors];
  }

  // `fields` MUST be an array
  if(!_.isArray(schema.fields)) {
    valid = false;
    errors = errors.concat('A JSON Table Schema must have an array of fields.');

    // Return early in this case.
    return [valid, errors];
  }

  // Each entry in the `fields` array MUST be a hash
  if(!_.every(schema.fields, function(F) { return utilities.isHash(F); })) {
    valid = false;
    errors = errors.concat('Each field in JSON Table Schema must be a hash.');
  }

  // Each entry in the `fields` array MUST have a `name` key
  if(!_.every(schema.fields, function(F) { return Boolean(F.name); })) {
    valid = false;
    errors = errors.concat('A JSON Table Schema field must have a name key.');
  }

  // Each entry in the `fields` array MAY have a `constraints` key
  // if `constraints` is present, then `constraints` MUST be a hash
  if(!_.every(schema.fields, function(F) { return !F.constraints || utilities.isHash(F.constraints); })) {
    valid = false;
    errors = errors.concat('A JSON Table Schema field contraint must be a hash.');
  }

  // Constraints may contain certain keys (each has a specific meaning)
  _.chain(schema['fields'])
    .filter(function(F) { return Boolean(F.constraints); })

    .each(function(F) {
      // IF `required` key, then it is a boolean
      if(F.constraints.required && !_.isBoolean(F.constraints.required)) {
        valid = false;
        errors = errors.concat('A JSON Table Schema required constraint must be a boolean.');
      }

      // IF `minLength` key, then it is an integer
      if(F.constraints.minLength && !_.isNumber(F.constraints.minLength)) {
        valid = false;
        errors = errors.concat('A JSON Table Schema minLength constraint must be an integer.');
      }

      // IF `maxLength` key, then it is an integer
      if(F.constraints.maxLength && !_.isNumber(F.constraints.maxLength)) {
        valid = false;
        errors = errors.concat('A JSON Table Schema maxLength constraint must be an integer');
      }

      // IF `unique` key, then it is a boolean
      if(F.constraints.unique && !_.isBoolean(F.constraints.unique)) {
        valid = false;
        errors = errors.concat('A JSON Table Schema unique constraint must be a boolean.')
      }

      // IF `pattern` key, then it is a regex
      if(F.constraints.pattern && !_.isString(F.constraints.pattern)) {
        valid = false;
        errors = errors.concat('A JSON Table Schema pattern constraint must be a string.')
      }

      // IF `minimum` key, then it DEPENDS on `field` TYPE
      if(F.constraints.minimum) {
        // IF `type` is integer
        if(_.isNumber(F.type) && !_.isNumber(F.constraints.minimum)) {
          valid = false;
          errors = errors.concat('A JSON Table Schema minimum constraint which is an integer is only valid if the encompassing field is also of type integer');
        }

        // WARN Probably need to chack for moment() type if we decide to go with moment() for dates
        // IF `type` is date
        else if(_.isDate(F.type) && !_.isDate(constraints.minimum)) {
          valid = false;
          errors = errors.concat('A JSON Table Schema minimum constraint which is a date is only valid if the encompassing field is also of type date');
        }

        else {
          valid = false;
          errors = errors.concat('A JSON Table Schema minimum constraint is present with unclear application (field is not an integer or a date)');
        }
      }

      if(F.constraints.maximum) {
        // IF `type` is integer
        if(_.isNumber(F.type) && !_.isNumber(F.constraints.maximum)) {
          valid = false;
          errors = errors.concat('A JSON Table Schema maximum constraint which is an integer is only valid if the encompassing field is also of type integer');
        }

        // WARN Probably need to chack for moment() type if we decide to go with moment() for dates
        // IF `type` is date
        else if(_.isDate(F.type) && !_.isDate(constraints.maximum)) {
          valid = false;
          errors = errors.concat('A JSON Table Schema maximum constraint which is a date is only valid if the encompassing field is also of type date');
        } else {
          valid = false;
          errors = errors.concat('A JSON Table Schema maximum constraint is present with unclear application (field is not an integer or a date)');
        }
      }
    });

  // The hash MAY contain a key `primaryKey`
  if(schema.primaryKey) {
      // `primaryKey` MUST be a string or an array
      if(!(_.isString(schema.primaryKey) || _.isArray(schema.primaryKey))) {
        valid = false;
        errors = errors.concat('A JSON Table Schema primaryKey must be either a string or an array.');
      }

      // Ensure that the primary key matches field names
      if(_.isString(schema.primaryKey)) {
          if(!_.contains(fieldsNames, schema.primaryKey)) {
            valid = false;
            errors = errors.concat('A JSON Table Schema primaryKey value must be found in the schema field names');
          }
      } else {
          _.each(schema.primaryKey, function(PK) {
            if(_.contains(fieldsNames, PK)) {
              valid = false;
              errors = errors.concat('A JSON Table Schema primaryKey value must be found in the schema field names');
            }
          });
      }
  }

  // The hash may contain a key `foreignKeys`
  if(schema.foreignKeys) {
    // `foreignKeys` MUST be an array
    if(!_.isArray(schema.foreignKeys)) {
      valid = false;
      errors = errors.concat('A JSON Table Schema foreignKeys must be an array.');
    }

    // Each `foreignKey` in `foreignKeys` MUST be a hash
    if(!_.every(schema.foreignKeys, function(FK) { return utilities.isHash(FK); })) {
      valid = false;
      errors = errors.concat('A JSON Table Schema `foreignKey` must be a hash.');
    }

    // Each `foreignKey` in `foreignKeys` MUST have a `fields` key
    if(!_.every(schema.foreignKeys, function(FK) { return Boolean(FK.fields); })) {
      valid = false;
      errors = errors.concat('A JSON Table Schema foreignKey must have a fields key.');
    }

    // Each `fields` key in a `foreignKey` MUST be a string or array
    if(!_.every(schema.foreignKeys, function(FK) { return _.isString(FK.fields) || _.isArray(FK.fields); })) {
      valid = false;
      errors = errors.concat('A JSON Table Schema foreignKey.fields type must be a string or an array.');
    }

    _.each(schema.foreignKeys, function(FK) {
      // Ensure that `foreignKey.fields` match field names
      if(_.isString(FK.fields)) {
        if(!_.contains(fieldsNames, FK.fields)) {
          valid = false;
          errors = errors.concat('A JSON Table Schema foreignKey.fields value must correspond with field names.');
        }
      } else {
        if((_.intersection(fieldsNames, FK.fields) || []).length < FK.fields.length) {
          valid = false;
          errors = errors.concat('A JSON Table Schema foreignKey.fields value must correspond with field names.');
        };
      }

      // Ensure that `foreignKey.reference` is present and is a hash
      if(!utilities.isHash(FK.reference)) {
        valid = false;
        errors = errors.concat('A JSON Table Schema foreignKey.reference must be a hash.');
      }

      // Ensure that `foreignKey.reference` has a `resource` key
      if(!_.contains(_.keys(FK.reference), 'resource')) {
        valid = false;
        errors = errors.concat('A JSON Table Schema foreignKey.reference must have a resource key.'); 
      }

      // Ensure that `foreignKey.reference` has a `fields` key
      if(!_.contains(_.keys(FK.reference), 'fields')) {
        valid = false;
        errors = errors.concat('A JSON Table Schema foreignKey.reference must have a fields key.');
      }

      // Ensure that `foreignKey.reference.fields` matches outer `fields`
      if(_.isString(FK.fields)) {
        if(!_.isString(FK.reference.fields)) {
          valid = false;
          errors = errors.concat('A JSON Table Schema foreignKey.reference.fields must match field names.');
        }
      } else {
        if(FK.fields.length !== FK.reference.fields.length) {
          valid = false;
          errors = errors.concat('A JSON Table Schema must have a fields key.');
        }
      }
    });
  }

  return [valid, errors];
}