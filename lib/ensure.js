'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _underscore = require('underscore');

var _utilities = require('./utilities');

var _utilities2 = _interopRequireDefault(_utilities);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 Validate that `schema` is a valid JSON Table Schema.

 Args:
 * `schema`: a dict to check if it is valid JSON Table Schema

 Returns:
 * A tuple of `valid`, `errors`
 */

exports.default = function (schema) {
  var fieldsNames = _underscore._.map(_underscore._.result(schema, 'fields') || [], _underscore._.property('name'));

  var valid = true,
      errors = [];

  // A schema is a hash
  if (!_utilities2.default.isHash(schema)) {
    valid = false;
    addError('should be a hash.');

    // Return early in this case.
    return [valid, errors];
  }

  // Which MUST contain a key `fields`
  if (!schema.fields) {
    valid = false;
    addError('must have a fields key.');

    // Return early in this case.
    return [valid, errors];
  }

  // `fields` MUST be an array
  if (!_underscore._.isArray(schema.fields)) {
    valid = false;
    addError('must have an array of fields.');

    // Return early in this case.
    return [valid, errors];
  }

  // Each entry in the `fields` array MUST be a hash
  if (!_underscore._.every(schema.fields, function (field) {
    return _utilities2.default.isHash(field);
  })) {
    valid = false;
    addError('Each field in JSON Table Schema must be a hash.', false);
  }

  // Each entry in the `fields` array MUST have a `name` key
  if (!_underscore._.every(schema.fields, function (field) {
    return Boolean(field.name);
  })) {
    valid = false;
    addError('field must have a name key.');
  }

  // Each entry in the `fields` array MAY have a `constraints` key
  // if `constraints` is present, then `constraints` MUST be a hash
  if (!_underscore._.every(schema.fields, function (field) {
    return !field.constraints || _utilities2.default.isHash(field.constraints);
  })) {
    valid = false;
    errors = addError('field constraint must be a hash.');
  }

  // Constraints may contain certain keys (each has a specific meaning)
  _underscore._.chain(schema.fields).filter(function (field) {
    return Boolean(field.constraints);
  }).each(function (field) {
    // IF `required` key, then it is a boolean
    if (field.constraints.required && !_underscore._.isBoolean(field.constraints.required)) {
      valid = false;
      addError('required constraint must be a boolean.');
    }

    // IF `minLength` key, then it is an integer
    if (field.constraints.minLength && !_underscore._.isNumber(field.constraints.minLength)) {
      valid = false;
      addError('minLength constraint must be an integer.');
    }

    // IF `maxLength` key, then it is an integer
    if (field.constraints.maxLength && !_underscore._.isNumber(field.constraints.maxLength)) {
      valid = false;
      addError('maxLength constraint must be an integer');
    }

    // IF `unique` key, then it is a boolean
    if (field.constraints.unique && !_underscore._.isBoolean(field.constraints.unique)) {
      valid = false;
      addError('unique constraint must be a boolean.');
    }

    // IF `pattern` key, then it is a regex
    if (field.constraints.pattern && !_underscore._.isString(field.constraints.pattern)) {
      valid = false;
      addError('pattern constraint must be a string.');
    }

    // IF `minimum` key, then it DEPENDS on `field` TYPE
    if (field.constraints.minimum) {
      // IF `type` is integer
      if (_underscore._.isNumber(field.type) && !_underscore._.isNumber(field.constraints.minimum)) {
        valid = false;
        addError('minimum constraint which is an integer is only valid if ' + 'the encompassing field is also of type integer');
      }

      // WARN Probably need to chack for moment() type if we decide to go
      // with moment() for dates IF `type` is date
      else if (_underscore._.isDate(field.type) && !_underscore._.isDate(field.constraints.minimum)) {
          valid = false;
          addError('minimum constraint which is a date is only valid if the ' + 'encompassing field is also of type date');
        } else {
          valid = false;
          addError('minimum constraint is present with unclear application' + ' (field is not an integer or a date)');
        }
    }

    if (field.constraints.maximum) {
      // IF `type` is integer
      if (_underscore._.isNumber(field.type) && !_underscore._.isNumber(field.constraints.maximum)) {
        valid = false;
        addError('maximum constraint which is an integer is only valid if' + ' the encompassing field is also of type integer');
      }
      // WARN Probably need to check for moment() type if we decide to go
      // with moment() for dates IF `type` is date
      else if (_underscore._.isDate(field.type) && !_underscore._.isDate(field.constraints.maximum)) {
          valid = false;
          addError('maximum constraint which is a date is only valid if the' + ' encompassing field is also of type date');
        } else {
          valid = false;
          addError('maximum constraint is present with unclear application' + ' (field is not an integer or a date)');
        }
    }
  });

  // The hash MAY contain a key `primaryKey`
  if (schema.primaryKey) {
    // `primaryKey` MUST be a string or an array
    if (!(_underscore._.isString(schema.primaryKey) || _underscore._.isArray(schema.primaryKey))) {
      valid = false;
      addError('primaryKey must be either a string or an array.');
    }

    // Ensure that the primary key matches field names
    if (_underscore._.isString(schema.primaryKey)) {
      if (!_underscore._.contains(fieldsNames, schema.primaryKey)) {
        valid = false;
        addError('primaryKey value must be found in the schema field names');
      }
    } else {
      _underscore._.each(schema.primaryKey, function (PK) {
        if (_underscore._.contains(fieldsNames, PK)) {
          valid = false;
          addError('primaryKey value must be found in the schema field names');
        }
      });
    }
  }

  // The hash may contain a key `foreignKeys`
  if (schema.foreignKeys) {
    // `foreignKeys` MUST be an array
    if (!_underscore._.isArray(schema.foreignKeys)) {
      valid = false;
      addError('foreignKeys must be an array.');
    }

    // Each `foreignKey` in `foreignKeys` MUST be a hash
    if (!_underscore._.every(schema.foreignKeys, function (FK) {
      return _utilities2.default.isHash(FK);
    })) {
      valid = false;
      addError('`foreignKey` must be a hash.');
    }

    // Each `foreignKey` in `foreignKeys` MUST have a `fields` key
    if (!_underscore._.every(schema.foreignKeys, function (FK) {
      return Boolean(FK.fields);
    })) {
      valid = false;
      addError('foreignKey must have a fields key.');
    }

    // Each `fields` key in a `foreignKey` MUST be a string or array
    if (!_underscore._.every(schema.foreignKeys, function (FK) {
      return _underscore._.isString(FK.fields) || _underscore._.isArray(FK.fields);
    })) {
      valid = false;
      addError('foreignKey.fields type must be a string or an array.');
    }

    _underscore._.each(schema.foreignKeys, function (FK) {
      // Ensure that `foreignKey.fields` match field names
      if (_underscore._.isString(FK.fields)) {
        if (!_underscore._.contains(fieldsNames, FK.fields)) {
          valid = false;
          addError('foreignKey.fields value must correspond with field names.');
        }
      } else {
        if ((_underscore._.intersection(fieldsNames, FK.fields) || []).length < FK.fields.length) {
          valid = false;
          addError('foreignKey.fields value must correspond with field names.');
        }
      }

      // Ensure that `foreignKey.reference` is present and is a hash
      if (!_utilities2.default.isHash(FK.reference)) {
        valid = false;
        addError('foreignKey.reference must be a hash.');
      }

      // Ensure that `foreignKey.reference` has a `resource` key
      if (!_underscore._.contains(_underscore._.keys(FK.reference), 'resource')) {
        valid = false;
        addError('foreignKey.reference must have a resource key.');
      }

      // Ensure that `foreignKey.reference` has a `fields` key
      if (!_underscore._.contains(_underscore._.keys(FK.reference), 'fields')) {
        valid = false;
        addError('foreignKey.reference must have a fields key.');
      }

      // Ensure that `foreignKey.reference.fields` matches outer `fields`
      if (_underscore._.isString(FK.fields)) {
        if (!_underscore._.isString(FK.reference.fields)) {
          valid = false;
          addError('foreignKey.reference.fields must match field names.');
        }
      } else {
        if (FK.fields.length !== FK.reference.fields.length) {
          valid = false;
          addError('must have a fields key.');
        }
      }
    });
  }

  return [valid, errors];

  function addError(error) {
    var isSuffix = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

    if (isSuffix) {
      errors.push('A JSON Table Schema ' + String(error));
    } else {
      errors.push(error);
    }
  }
};

//module.exports = ensure
//# sourceMappingURL=ensure.js.map