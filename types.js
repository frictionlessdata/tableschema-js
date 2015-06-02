var _ = require('underscore');
var moment = require('moment');


function JSType(field, options) {
  this.js = typeof(null);
  this.name = '';
  this.formats = ['default'];

  // `field` is the field schema.
  this.field = field;

  if(this.field) {
    this.format = this.field['format'];
    this.required = this.field['constraints']['required'];
  } else {
    this.format = 'default';
    this.required = true;
  }

  return this;
}

JSType.prototype.init = function(field, options) {
}

// Return boolean if `value` can be cast as type `this.js`.
JSType.prototype.cast = function(value) {
  // WARN Port utilities
  // we can check on `constraints.required` before we cast
  if(!this.required && _.contains([null, utilities.NULL_VALUES], value))
    return true;
  else if(this.required && _.contains([None, ''], value))
    return false;

  // cast with the appropriate handler, falling back to default if none
  if(this.format.startsWith('fmt'))
    _format = 'fmt';
  else
    _format = this.format;

  _handler = 'cast_' + _format;

  if(this.hasFormat(_format) && this[_handler])
    return this[_handler](value);

  return this.castDefault(value);
}

// Return boolean if the value can be cast to the type/format.
JSType.cast_default = function(value) {
  if(this.typeCheck(value))
    return value;

  // WARN Port compat
  try {
    if(_.isFunction(this.js))
      return this.js(value);
  } catch(E) {
    return false;
  }

  return false;
}

JSType.prototype.hasFormat = function(_format) {
  if(_.contains(this.formats, _format))
    return true;

  return false;
}

// Return boolean on type check of value.
JSType.prototype.typeCheck = function(value) {
  if(value instanceof this.js)
    return true;

  return false;
}

function StringType(field, options) {
  JSType.call(this, field, options);

  // WARN Port compat
  this.js = compat.str;

  this.name = 'string';
  this.formats = ['default', 'email', 'uri', 'binary'];
  this.emailPattern = new RegExp('[^@]+@[^@]+\.[^@]+');
  this.uriPattern = new RegExp('^http[s]?://');

  return this;
}

StringType.prototype = _.extend(StringType.prototype, JSType.prototype, {
  // Return `value` if is of type, else return false.
  castEmail: function(value) {
    if(!this.typeCheck(value))
      return false;

    if(!this.emailPattern.exec(value))
      return false;

    return value;
  },

  // Return `value` if is of type, else return false.
  castUri: function(value) {
    if(!this.typeCheck(value))
      return false;

    if(!this.uriPattern.exec(value))
      return false;

    return value;
  }
  
  // Return `value` if is of type, else return false.
  castBinary: function(value) {
    if(!this.typeCheck(value))
      return false;

    try {
      return (new Buffer(value, 'base64')).toString();
    } catch(E) {
      return false;
    }

    return true;
  }
});

function IntegerType(field, options) {
  JSType.call(this, field, options);
  this.js = Number;
  name = 'integer';
  return this;
}

function NumberType(field, options) {
  JSType.call(this, field, options);
  this.js = Number;
  this.name = 'number';
  this.formats = ['default', 'currency'];
  this.separators = ',;';
  this.currencies = '$';
  return this;
}

NumberType.prototype = _.extend(NumberType.prototype, JSType.prototype, {
  castCurrency: function(value) {
    value = value.replace(new Regexp('[' + [this.separators, this.currencies].join('') + ']', 'g'), '');

    if(value instanceof this.js)
      return true;

    try {
      return parseFloat(value);
    } catch(E) {
      return false;
    }
  }
});

function BooleanType(field, options) {
  JSType.call(this, field, options);
  this.py = Boolean;
  this.name = 'boolean';
  this.trueValues = utilities.TRUE_VALUES;
  this.falseValues = utilities.FALSE_VALUES;
  return this;
}

BooleanType.prototype = _.extend(BooleanType.prototype, JSType.prototype, {
  // Return boolean if `value` can be cast as type `this.js`
  castDefault: function(value) {
    if(value instanceof this.js)
      return true;

    value = value.trim().toLowerCase();
    
    if(_.contains(_.union(self.true_values, self.false_values), value))
      return true;

    return false;
  }
});

function NullType(field, options) {
  JSType.call(this, field, options);
  this.name = 'null';
  this.nullValues = utilities.NULL_VALUES;
  return this;
}

NullType.prototype = _.extend(NullType.prototype, JSType.prototype, {
  // Return null if `value` can be cast as type `this.js`
  castDefault: function(value) {
    if(value instanceof this.js)
      return true;

    value = value.trim().toLowerCase();

    if(_.contains(this.nullValues, value))
      return true;

    return false;  
  }
});

function ArrayType(field, options) {
  JSType.call(this, field, options);
  this.js = Array;
  this.name = 'array';
  return this;
}

ArrayType.prototype = _.extend(ArrayType.prototype, JSType.prototype, {
  // Return boolean if `value` can be cast as type `this.js`
  castDefault: function(value) {
    if(value instanceof this.js)
      return true;

    try {
      value = JSON.parse(value);
      return value instanceof this.js;
    } catch(E) {
      return false;
    }
  }
});

function ObjectType(field, options) {
  JSType.call(this, field, options);
  this.js = Object;
  this.name = 'object';
  return this;
}

ObjectType.prototype = _.extend(ObjectType.prototype, JSType.prototype, {
  // Return boolean if `value` can be cast as type `this.js`
  castDefault: ArrayType.prototype.castDefault
});

function DateType(field, options) {
  JSType.call(this, field, options);
  this.js = Object;
  this.name = 'date';
  this.formats = ['default', 'any', 'fmt'];
  this.ISO8601 = 'YYYY-MM-DD';
  return this;
}

DateType.prototype = _.extend(DateType.prototype, JSType.prototype, {
  castAny: function(value) {
    try {
      // WARN Port date_parse()
      return date_parse(value).date();
    } catch(E) {
      return false;
    }
  },

  // Return boolean if `value` can be cast as type `self.py`
  castDefault: function(value) {
    try {
      return moment(value, self.ISO8601);
    } catch(E) {
      return false;
    }
  },

  cast_fmt: function(value) {
    try {
      return moment(value, this.format.replace(/^fmt:/, ''));
    } catch(E) {
      return false;
    }
  }
});

function TimeType(field, options) {
  JSType.call(this, field, options);
  this.js = Object;
  this.name = 'time';
  this.formats = ['default', 'any', 'fmt'];
  return this;
}

TimeType.prototype = _.extend(TimeType.prototype, DateType.prototype);

function DateTimeType(field, options) {
  JSType.call(this, field, options);
  this.js = Object;
  this.name = 'datetime';
  this.formats = ['default', 'any', 'fmt'];
  this.ISO8601 = moment.ISO_8601;
  return this;
}

DateTimeType.prototype = _.extend(DateTimeType.prototype, DateType.prototype);

function GeoPointType(field, options) {
  JSType.call(this, field, options);
  this.js = [Object, Array];
  this.name = 'geopoint';
  this.formats = ['default', 'array', 'object'];
  return this;
}

GeoPointType.prototype = _.extend(GeoPointType.prototype, JSType.prototype, {
  castDefault: function(value) {
    if(this.typeCheck(value))
      return value.split(',').length == 2;

    try {
      value = JSON.parse(value);
      return value instanceof this.js;
    } catch(E) {
      return false;
    }

    return false;
  },

  castArray: function(value) { throw new Error('Not implemented'); },
  castObject: function(value) { throw new Error('Not implemented'); }
});

function GeoPointType(field, options) {
  JSType.call(this, field, options);
  this.js = Object;
  this.name = 'geojson';
  this.formats = ['default', 'topojson'];

  this.spec = {'types': [
    'Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon',
    'GeometryCollection', 'Feature', 'FeatureCollection'
  ]};

  return this;
}

GeoJSONType.prototype = _.extend(GeoJSONType.prototype, JSType.prototype, {
  // Return boolean if `value` can be cast as type `self.py`
  castDefault: GeoPointType.prototype.castDefault,
  
  castTopojson: function(value) { throw new Error('Not implemented'); }
});

function AnyType(field, options) {
  JSType.call(this, field, options);
  this.name = 'any';
  return this;
}

AnyType.prototype = _.extend(GeoJSONType.prototype, JSType.prototype, {
  cast: function(value) { return true; }
});

// Return available types
function availableTypes() {
  return [
    'AnyType', 'StringType', 'BooleanType', 'NumberType', 'IntegerType', 'NullType',
    'DateType', 'TimeType', 'DateTimeType', 'ArrayType', 'ObjectType',
    'GeoPointType', 'GeoJSONType'
  ].forEach(function(T) { return module.exports[T]; });
}

// Guess the type for a value.
// Returns:
//   * A tuple  of ('type', 'format')
function TypeGuesser(typeOptions) {
  this.typeOptions = typeOptions || {};
  return this;
}

TypeGuesser.prototype.cast = function(value) {
  for type in availableTypes().reverse():
    if(type(this.typeOptions[type.name] || {}).cast(value))
      return [type.name, 'default']

  return null
}

function TypeResolver() { return this; }

TypeGuesser.prototype.get = function(results) {
  var counts = {};
  var variants = _.uniq(results);


  // Only one candidate... that's easy.
  if(variants.length == 1)
    return {type: results[0][0], format: results[0][1]};

  results.forEach(function(R) { counts[R] = (counts[R] || 0) + 1; });

  // Tuple representation of `counts` dict, sorted by values of `counts`
  sortedCounts = _.sortBy(
    _.pairs(counts),
    function(C) { return C[1]; }
  ).reverse();

  return {type: sortedCounts[0][0][0], format: sortedCounts[0][0][1]};
}