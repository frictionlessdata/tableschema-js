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

  guesser = types.TypeGuesser();
  resolver = types.TypeResolver();
  schema = {fields: []};
  typeMatches = {};

  if(options.primaryKey)
    schema['primaryKey'] = options.primaryKey;

   schema['fields'] = headers.map(function(H) {
    var constraints = {};
    var descriptor;


    descriptor = {
      name: header,
      title: '',
      description: '',
    };

    if(options.explicit)
      constraints.required = true;

    if(H === options.primaryKey)
      constraints.unique = true;

    if(_.isEmpty(constraints))
      descriptor.constraints = constraints;
   });

  for(var index in values) {
    var rowLength;


    if(options.rowLimit && (index > options.rowLimit))
      break;

    // Normalize rows with invalid dimensions for sanity
    rowLength = value[index].length;
    headersLength = headers.length;

    if(rowLength > headersLength)
      row = _.first(row, headersLength);

    if(rowLength < headersLength)
      row = row.concat(_.range(headersLength - rowLength).map(function() { return ''; }));

    // Build a column-wise lookup of type matches
    for(var index in row)
      typeMatches[index] = (typeMatches[index] || []).concat(guesser.cast(row[index]));
  }

  // Choose a type/format for each column based on the matches
  for(var typeMatch in _.pairs(typeMatches))
    _.extend(schema['fields'][typeMatch[0]], resolver.get(typeMatch[1]));

  return schema;
}
