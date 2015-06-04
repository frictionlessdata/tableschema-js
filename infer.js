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
    primaryKey: null
  }, options);

  guesser = new types.TypeGuesser();
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

  for(var index in values) {
    var headersLength;
    var row = values[index];
    var rowLength;


    if(options.rowLimit && (index > options.rowLimit))
      break;

    // Normalize rows with invalid dimensions for sanity
    rowLength = row.length;
    headersLength = headers.length;

    if(rowLength > headersLength)
      row = _.first(row, headersLength);

    if(rowLength < headersLength)
      row = row.concat(_.range(headersLength - rowLength).map(function() { return ''; }));

    // Build a column-wise lookup of type matches
    for(var rowIndex in row)
      typeMatches[rowIndex] = (typeMatches[rowIndex] || []).concat([guesser.cast(row[rowIndex])]);
  }

  // Choose a type/format for each column based on the matches
  _.each(typeMatches, function(V, K) {
    schema.fields[parseInt(K)] = _.extend(schema.fields[parseInt(K)], resolver.get(V));
  });

  return schema;
}
