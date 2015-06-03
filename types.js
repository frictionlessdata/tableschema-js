var _ = require('underscore');
var moment = require('moment');


module.exports.JSType = function(field, options) {
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

// Return boolean if `value` can be cast as type `this.js`.
module.exports.JSType.prototype.cast = function(value) {
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
module.exports.JSType.cast_default = function(value) {
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

module.exports.JSType.prototype.hasFormat = function(_format) {
  if(_.contains(this.formats, _format))
    return true;

  return false;
}

// Return boolean on type check of value.
module.exports.JSType.prototype.typeCheck = function(value) {
  if(value instanceof this.js)
    return true;

  return false;
}

module.exports.StringType = function(field, options) {
  JSType.call(this, field, options);

  // WARN Port compat
  this.js = compat.str;

  this.name = 'string';
  this.formats = ['default', 'email', 'uri', 'binary'];
  this.emailPattern = new RegExp('[^@]+@[^@]+\.[^@]+');
  this.uriPattern = new RegExp('^http[s]?://');

  return this;
}

module.exports.StringType.prototype = _.extend(module.exports.StringType.prototype, module.exports.JSType.prototype, {
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
  },
  
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

module.exports.IntegerType = function(field, options) {
  JSType.call(this, field, options);
  this.js = Number;
  name = 'integer';
  return this;
}

module.exports.NumberType = function(field, options) {
  JSType.call(this, field, options);
  this.js = Number;
  this.name = 'number';
  this.formats = ['default', 'currency'];
  this.separators = ',;';
  this.currencies = '$';
  return this;
}

module.exports.NumberType.prototype = _.extend(module.exports.NumberType.prototype, module.exports.JSType.prototype, {
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

module.exports.BooleanType = function(field, options) {
  JSType.call(this, field, options);
  this.py = Boolean;
  this.name = 'boolean';
  this.trueValues = utilities.TRUE_VALUES;
  this.falseValues = utilities.FALSE_VALUES;
  return this;
}

module.exports.BooleanType.prototype = _.extend(module.exports.BooleanType.prototype, module.exports.JSType.prototype, {
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

module.exports.NullType = function(field, options) {
  JSType.call(this, field, options);
  this.name = 'null';
  this.nullValues = utilities.NULL_VALUES;
  return this;
}

module.exports.NullType.prototype = _.extend(module.exports.NullType.prototype, module.exports.JSType.prototype, {
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

module.exports.ArrayType = function(field, options) {
  JSType.call(this, field, options);
  this.js = Array;
  this.name = 'array';
  return this;
}

module.exports.ArrayType.prototype = _.extend(module.exports.ArrayType.prototype, module.exports.JSType.prototype, {
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

module.exports.ObjectType = function(field, options) {
  JSType.call(this, field, options);
  this.js = Object;
  this.name = 'object';
  return this;
}

module.exports.ObjectType.prototype = _.extend(module.exports.ObjectType.prototype, module.exports.JSType.prototype, {
  // Return boolean if `value` can be cast as type `this.js`
  castDefault: module.exports.ArrayType.prototype.castDefault
});

module.exports.DateType = function(field, options) {
  JSType.call(this, field, options);
  this.js = Object;
  this.name = 'date';
  this.formats = ['default', 'any', 'fmt'];
  this.ISO8601 = 'YYYY-MM-DD';
  return this;
}

module.exports.DateType.prototype = _.extend(module.exports.DateType.prototype, module.exports.JSType.prototype, {
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

module.exports.TimeType = function(field, options) {
  JSType.call(this, field, options);
  this.js = Object;
  this.name = 'time';
  this.formats = ['default', 'any', 'fmt'];
  return this;
}

module.exports.TimeType.prototype = _.extend(module.exports.TimeType.prototype, module.exports.DateType.prototype);

module.exports.DateTimeType = function(field, options) {
  JSType.call(this, field, options);
  this.js = Object;
  this.name = 'datetime';
  this.formats = ['default', 'any', 'fmt'];
  this.ISO8601 = moment.ISO_8601;
  return this;
}

module.exports.DateTimeType.prototype = _.extend(module.exports.DateTimeType.prototype, module.exports.DateType.prototype);

module.exports.GeoPointType = function(field, options) {
  JSType.call(this, field, options);
  this.js = [Object, Array];
  this.name = 'geopoint';
  this.formats = ['default', 'array', 'object'];
  return this;
}

module.exports.GeoPointType.prototype = _.extend(module.exports.GeoPointType.prototype, module.exports.JSType.prototype, {
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

module.exports.GeoJSONType = function(field, options) {
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

module.exports.GeoJSONType.prototype = _.extend(module.exports.GeoJSONType.prototype, module.exports.JSType.prototype, {
  // Return boolean if `value` can be cast as type `self.py`
  castDefault: module.exports.GeoPointType.prototype.castDefault,
  
  castTopojson: function(value) { throw new Error('Not implemented'); }
});

module.exports.AnyType = function(field, options) {
  JSType.call(this, field, options);
  this.name = 'any';
  return this;
}

module.exports.AnyType.prototype = _.extend(module.exports.AnyType.prototype, module.exports.JSType.prototype, {
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
module.exports.TypeGuesser = function(typeOptions) {
  this.typeOptions = typeOptions || {};
  return this;
}

module.exports.TypeGuesser.prototype.cast = function(value) {
  for type in availableTypes().reverse():
    if(type(this.typeOptions[type.name] || {}).cast(value))
      return [type.name, 'default']

  return null
}

module.exports.TypeResolver = function() { return this; }

module.exports.TypeResolver.prototype.get = function(results) {
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