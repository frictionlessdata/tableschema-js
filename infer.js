var _ = require('underscore');
var types = require('./types');


module.exports = function(headers, values, options) {
  /*
  Return a schema from the passed headers and values.

  Args:
  * `headers`: a list of header names
  * `values`: a reader over data, yielding each row as a list of values
  * `explicit`: be explicit.
  * `primaryKey`: pass in a primary key or iterable of keys.
  Returns:
  * A JSON Table Schema as a Python dict.
  */

  // Set up default options
  options = _.extend({
    rowLimit: null,
    explicit: false,
    primaryKey: null,
    cast: {}
  }, options);

  guesser = new types.TypeGuesser(options.cast);
  resolver = new types.TypeResolver();
  schema = {fields: []};
  typeMatches = {};

  if(options.primaryKey)
    schema['primaryKey'] = options.primaryKey;

  schema['fields'] = headers.map(function(H) {
    var constraints = {};
    var descriptor;


    descriptor = {
      name: H,
      title: '',
      description: '',
    };

    if(options.explicit)
      constraints.required = true;

    if(H === options.primaryKey)
      constraints.unique = true;

    if(!_.isEmpty(constraints))
      descriptor.constraints = constraints;

    return descriptor;
  });

  for (var index in headers){
    var colValues = _.pluck(values, index);

    if(options.rowLimit){
      colValues = _.first(colValues, options.rowLimit);
    }

    var suitableType = guesser.multicast(colValues);
    schema.fields[parseInt(index)] = _.extend(schema.fields[parseInt(index)], {type: suitableType, format: 'default'});
  }
  return schema;
}
