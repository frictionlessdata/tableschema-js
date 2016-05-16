var _ = require('underscore');
var moment = require('moment');
var d3time = require('d3-time-format');
var utilities = require('./utilities');


module.exports.JSType = function(field, options) {
  this.js = typeof(null);
  this.name = '';
  this.formats = ['default'];

  // `field` is the field schema.
  this.field = field;

  if(this.field) {
    this.format = this.field['format'];
    this.required = _.result(this.field['constraints'], 'required') || false;
  } else {
    this.format = 'default';
    this.required = true;
  }

  return this;
}

// Return boolean if `value` can be cast as type `this.js`.
module.exports.JSType.prototype.cast = function(value) {
  var _format;
  var _handler;

  // We can check on `constraints.required` before we cast
  if(!this.required && _.contains(_.flatten([null, utilities.NULL_VALUES]), value))
    return true;
  else if(this.required && _.contains([null, undefined, ''], value))
    return false;

  // Cast with the appropriate handler, falling back to default if none
  if(!this.format) {
    _format = 'default';
  } else {
    if(!this.format || this.format.indexOf('fmt') === 0) {
      _format = 'fmt';
    } else {
      _format = this.format;
    }
  }

  _handler = 'cast' + (_format.charAt(0).toUpperCase() + _format.substring(1));

  if(this.hasFormat(_format) && this[_handler])
    return this[_handler](value);

  return this.castDefault(value);
}

// Return boolean if the value can be cast to the type/format.
module.exports.JSType.prototype.castDefault = function(value) {
  if(this.typeCheck(value))
    return true;

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
  if(this.jstype) {
    if (typeof(value) == this.jstype) {
      return true;
    }
  } else if(this.js && value instanceof this.js) {
    return true;
  }

  return false;
}

module.exports.StringType = function(field, options) {
  module.exports.JSType.call(this, field, options);

  this.jstype = 'string';
  this.name = 'string';
  this.formats = ['default', 'email', 'uri', 'binary'];
  this.emailPattern = new RegExp('[^@]+@[^@]+\.[^@]+');
  this.uriPattern = new RegExp('^http[s]?://');

  return this;
}

module.exports.StringType.prototype = _.extend(module.exports.StringType.prototype, module.exports.JSType.prototype, {
  castEmail: function(value) {
    if(!this.typeCheck(value))
      return false;

    if(!this.emailPattern.exec(value))
      return false;

    return value;
  },

  castUri: function(value) {
    if(!this.typeCheck(value))
      return false;

    if(!this.uriPattern.exec(value))
      return false;

    return value;
  },
  
  castBinary: function(value) {
    if(!this.typeCheck(value))
      return false;

    try {
      return (new Buffer(value, 'base64')).toString();
    } catch(E) {
      return false;
    }

    return true;
  },

  typeCheck: function(value) {
    if(typeof value == 'string')
      return true;

    return false;
  }
});

module.exports.IntegerType = function(field, options) {
  module.exports.JSType.call(this, field, options);
  this.js = Number;
  this.name = 'integer';
  return this;
}

module.exports.IntegerType.prototype = _.extend(module.exports.IntegerType.prototype, module.exports.JSType.prototype, {
  castDefault: function(value) {
    if(this.typeCheck(value))
      return true;

    try {
      var x = parseInt(value);
      return (isFinite(+value) && isFinite(x) && (+value === x ) );
    } catch(E) {
      return false;
    }

    return false;
  }
});

module.exports.NumberType = function(field, options) {
  module.exports.JSType.call(this, field, options);
  this.jstype = 'number';
  this.name = 'number';
  this.formats = ['default', 'currency'];
  this.groupChar = (field || {}).groupChar || ',';
  this.decimalChar = (field || {}).decimalChar || '.';
  this.currencies = '$£€';
  return this;
}

module.exports.NumberType.prototype = _.extend(module.exports.NumberType.prototype, module.exports.JSType.prototype, {
  castDefault: function(value) {
    if(this.typeCheck(value))
      return true;

    value = value.replace(new RegExp('['+this.groupChar+']','g'),'')
                 .replace(new RegExp('['+this.decimalChar+']','g'),'.')

    try {
      if(isFinite(+value) && isFinite(parseFloat(value)))
        return true;
    } catch(E) {
      return false;
    }

    return false;
  },
  castCurrency: function(value) {
    if(this.typeCheck(value))
      return true;

    var orig = value;
    value = value.replace(new RegExp('['+this.groupChar+']','g'),'')
                 .replace(new RegExp('['+this.decimalChar+']','g'),'.')
    value = value.replace(new RegExp('[' + this.currencies + ']', 'g'), '');

    // parseFloat() parse string even if there are non-digit characters
    if((new RegExp('[^\\d.]+', 'g')).exec(value))
      return false;

    try {
      return isFinite(parseFloat(value));
    } catch(E) {
      return false;
    }
  }
});

module.exports.BooleanType = function(field, options) {
  module.exports.JSType.call(this, field, options);
  this.jstype = 'boolean';
  this.name = 'boolean';
  this.trueValues = utilities.TRUE_VALUES;
  this.falseValues = utilities.FALSE_VALUES;
  return this;
}

module.exports.BooleanType.prototype = _.extend(module.exports.BooleanType.prototype, module.exports.JSType.prototype, {
  castDefault: function(value) {
    if(this.typeCheck(value))
      return true;

    value = value.trim().toLowerCase();
    
    if(_.contains(_.union(this.trueValues, this.falseValues), value))
      return true;

    return false;
  }
});

module.exports.NullType = function(field, options) {
  module.exports.JSType.call(this, field, options);
  this.name = 'null';
  this.nullValues = utilities.NULL_VALUES;
  return this;
}

module.exports.NullType.prototype = _.extend(module.exports.NullType.prototype, module.exports.JSType.prototype, {
  castDefault: function(value) {
    if(_.isNull(value))
      return true;

    value = value.trim().toLowerCase();

    if(_.contains(this.nullValues, value))
      return true;

    return false;  
  }
});

module.exports.ArrayType = function(field, options) {
  module.exports.JSType.call(this, field, options);
  this.js = Array;
  this.name = 'array';
  return this;
}

module.exports.ArrayType.prototype = _.extend(module.exports.ArrayType.prototype, module.exports.JSType.prototype, {
  castDefault: function(value) {
    if(this.typeCheck(value))
      return true;

    try {
      value = JSON.parse(value);
      return this.typeCheck(value);
    } catch(E) {
      return false;
    }
  }
});

module.exports.ObjectType = function(field, options) {
  module.exports.JSType.call(this, field, options);
  this.js = Object;
  this.name = 'object';
  return this;
}

module.exports.ObjectType.prototype = _.extend(module.exports.ObjectType.prototype, module.exports.JSType.prototype, {
  castDefault: function(value) {
    if(_.isObject(value) && !_.isArray(value) && !_.isFunction(value))
      return true;

    try {
      value = JSON.parse(value);
      return this.typeCheck(value);
    } catch(E) {
      return false;
    }
  }
});

module.exports.DateType = function(field, options) {
  module.exports.JSType.call(this, field, options);
  this.js = Object;
  this.name = 'date';
  this.formats = ['default', 'any', 'fmt'];
  this.ISO8601 = 'YYYY-MM-DD';
  return this;
}

module.exports.DateType.prototype = _.extend(module.exports.DateType.prototype, module.exports.JSType.prototype, {
  castAny: function(value) {
    var date;

    try {
      date = moment(new Date(value));
    } catch(E) {
      return false;
    }

    if(date.isValid())
      return date;
    return false;
  },

  castDefault: function(value) {
    var date;

    try {
      date = moment(value, this.ISO8601, true);
    } catch(E) {
      return false;
    }

    if(date.isValid())
      return date;

    return false;
  },

  castFmt: function(value) {
    var date;

    try {
      date = d3time.timeParse(this.format.replace(/^fmt:/, ''))(value);
    } catch(E) {
      return false;
    }

    if(date != null)
      return date;

    return false;
  }
});

module.exports.TimeType = function(field, options) {
  module.exports.JSType.call(this, field, options);
  this.js = Object;
  this.name = 'time';
  this.formats = ['default', 'any', 'fmt'];
  return this;
}

module.exports.TimeType.prototype = _.extend(module.exports.TimeType.prototype, module.exports.DateType.prototype, {
  castDefault: function(value) {
    var date;

    try {
      date = moment(value, 'HH:mm:ss', true);
    } catch(E) {
      return false;
    }

    if(date.isValid())
      return date;

    return false;
  },
});

module.exports.DateTimeType = function(field, options) {
  module.exports.JSType.call(this, field, options);
  this.js = Object;
  this.name = 'datetime';
  this.formats = ['default', 'any', 'fmt'];
  this.ISO8601 = moment.ISO_8601;
  return this;
}

module.exports.DateTimeType.prototype = _.extend(module.exports.DateTimeType.prototype, module.exports.DateType.prototype);

module.exports.GeoPointType = function(field, options) {
  module.exports.JSType.call(this, field, options);
  this.name = 'geopoint';
  this.formats = ['default', 'array', 'object'];
  return this;
}

module.exports.GeoPointType.prototype = _.extend(module.exports.GeoPointType.prototype, module.exports.JSType.prototype, {
  castDefault: function(value) {
    if(!this.typeCheck(value))
      return false

    if(_.isString(value))
      return value.split(',').length === 2;

    if(_.isObject(value))
      return value;

    try {
      return JSON.parse(value);
    } catch(E) {
      return false;
    }

    return false;
  },

  castArray: function(value) { throw new Error('Not implemented'); },
  castObject: function(value) { throw new Error('Not implemented'); },

  // Geo point may be passed as string object with keys or array
  typeCheck: function(value) {
    return _.isString(value) || _.isArray(value) || _.keys(value).length;
  }
});

module.exports.GeoJSONType = function(field, options) {
  module.exports.JSType.call(this, field, options);
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
  castDefault: module.exports.GeoPointType.prototype.castDefault,
  
  castTopojson: function(value) { throw new Error('Not implemented'); },

  // Geo JSON is always an object
  typeCheck: function(value) {
    return _.isObject(value) && !_.isFunction(value);
  }
});

module.exports.AnyType = function(field, options) {
  module.exports.JSType.call(this, field, options);
  this.name = 'any';
  return this;
}

module.exports.AnyType.prototype = _.extend(module.exports.AnyType.prototype, module.exports.JSType.prototype, {
  cast: function(value) { return true; }
});


function availableTypeNames () {
  return [
    'AnyType', 'StringType', 'BooleanType', 'NumberType', 'IntegerType', 'NullType',
    'DateType', 'TimeType', 'DateTimeType', 'ArrayType', 'ObjectType',
    'GeoPointType', 'GeoJSONType'
  ]
}

// Return available types objects
function availableTypes() {
  return (availableTypeNames()).map(function(T) { return module.exports[T]; });
}

// Guess the type for a value.
// Returns:
//   * A tuple  of ('type', 'format')
module.exports.TypeGuesser = function(typeOptions) {
  this.typeOptions = typeOptions || {};
  return this;
}

module.exports.TypeGuesser.prototype.suitableTypes = function(values) {
  values = _.filter(values, function (value){
    return !(_.isUndefined(value) || _.isEmpty(value));
  });

  if (values.length == 0) {
    return ['AnyType'];
  }
  var possibleTypeList = _.map(values, (function(value) {
    return _.filter(availableTypeNames().reverse(), (function(T) {
      try {
        return (
          new module.exports[T](this.typeOptions[(new module.exports[T]()).name] || {})
        ).cast(value);
      } catch(e) {
        return false;
      }
    }).bind(this) );
  }).bind(this) );

  return _.reduce(possibleTypeList, function (memo, types) {
    return _.intersection(memo, types);
  });
}

module.exports.TypeGuesser.prototype.multicast = function(values) {
  var types = this.suitableTypes(values);

  var suitableType =  _.find(availableTypeNames().reverse(), (function(type){
    return _.indexOf(types, type) >= 0;
  }).bind(this));
  return (new module.exports[suitableType]()).name;
}

module.exports.TypeGuesser.prototype.cast = function(value) {
  try {
    return [
      (new (_.find(availableTypes().reverse(), (function(T) {
        return (
          new T(this.typeOptions[(new T()).name] || {})
        ).cast(value);
      }).bind(this)))()).name,

      'default'
    ];
  } catch(E) {
    return null;
  }
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

  return {type: sortedCounts[0][0].split(',')[0], format: sortedCounts[0][0].split(',')[1]};
}