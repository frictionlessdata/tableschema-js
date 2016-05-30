# JSON Table Schema

[![Gitter](https://img.shields.io/gitter/room/frictionlessdata/chat.svg)](https://gitter.im/frictionlessdata/chat)
[![Travis Build Status](https://travis-ci.org/frictionlessdata/jsontableschema-js.svg?branch=master)](https://travis-ci.org/frictionlessdata/jsontableschema-js)
[![Coveralls](http://img.shields.io/coveralls/frictionlessdata/jsontableschema-js.svg?branch=master)](https://coveralls.io/r/frictionlessdata/jsontableschema-js?branch=master)

A utility library for working with [JSON Table Schema](http://dataprotocols.org/json-table-schema/) in Javascript.


## Table of Contents

- [Goals](#goals)
- [Installation](#installation)
- [Components](#components)
  - [Schema](#schema) - a javascript model of a JSON Table Schema with useful methods for interaction
  - [Types](#types) - a collection of classes to validate type/format and constraints of data described by a JSON Table Schema
  - [Infer](#infer) - a utility that creates a JSON Table Schema based on a data sample
  - [Validate](#validate) - a utility to validate a **schema** as valid according to the current spec
- [Contributing](#contributing)

## Goals

* A core set of utilities for working with [JSON Table Schema](http://dataprotocols.org/json-table-schema/)
* Use in *other* packages that deal with actual validation of data, or other 'higher level' use cases around JSON Table Schema (e.g. [Tabular Validator](https://github.com/okfn/tabular-validator))
* Be 100% compliant with the the JSON Table Schema specification (we are not there yet)

## Installation

```
npm install jsontableschema
```

## Components

Let's look at each of the components in more detail.

### Schema

A model of a schema with helpful methods for working with the schema and supported data. Schema instances can be initialized with a schema source as a url to a JSON file or a JSON object. 
The schema is initially validated (see [validate](#validate) below), and will raise an exception if not a valid JSON Table Schema.

Model requires Promise to work properly, and need to be sure that Promise available globally. You are free to choose any Promise polyfill  

```javascript
const model = new Schema('http://someurl.com/remote.json')
```
or
```javascript
const model = new Schema({JSON OBJECT})
```
instance always returns promise
```javascript
model.then(schema => {
    // working code to use schema model
}).catch(error => {
    // something went wrong and error variable has explanations
})
```

Some methods available to Schema instances:

* `cast(fieldName, value, index)` - returns a value cast against a named `fieldName`
* `convertRow(...args)` - convert the arguments given to the types of the current schema <sup>1</sup>
* `convert(items, failFast = false)` - convert an array of rows using the current schema of the Schema instance <sup>2</sup>
* `fields` - returns an array of the schema's fields
* `foreignKeys` - returns the foreign key property for the schema
* `getConstraints(fieldName, index = 0)` - return the constraints object for a given `fieldName` <sup>3</sup>
* `getField(fieldName, index = 0)` - return the field object for `fieldName` <sup>3</sup>
* `getFieldsByType(typeName)` - return all fields that match the given type
* `getType(fieldName, index = 0)` - return the type for a given `fieldName` <sup>3</sup>
* `hasField(fieldName)` - checks if the field exists in the schema. Returns a boolean
* `headers` - returns an array of the schema headers
* `primaryKey` - returns the primary key field for the schema
* `requiredHeaders` - returns headers with the `required` constraint as an array

<sup>1</sup>: Last argument could be `{ failFast: true|false }` (see <sup>2</sup> for more)  
<sup>2</sup>: Where the option `failFast` is given, it will raise the first error it encounters, otherwise an array of errors thrown (if there are any errors occur)  
<sup>3</sup>: Where the optional index argument is available, it can be used as a positional argument if the schema has multiple fields with the same name

### Types

Data values can be cast to native Javascript types with a type instance from `jsontableschema.types`.

Types can either be instantiated directly, or returned from `Schema` instances instantiated with a JSON Table Schema.

Casting a value will check the value is of the expected type, is in the correct format, and complies with any constraints imposed by a schema.

```javascript
usage examples
```

Values that can't be cast will raise an `Error` exception.

Type instances can be initialized with [field descriptors](http://dataprotocols.org/json-table-schema/#field-descriptors). This allows formats and constraints to be defined:

```javascript

fieldDescriptor = {
    'name': 'Field Name',
    'type': 'date',
    'format': 'default',
    'constraints': {
        'required': True,
        'minimum': '1978-05-30'
    }
}

dateType = typeGuesser.cast(fieldDescriptor)
```

Casting a value that doesn't meet the constraints will raise a `Error` exception.

Note: the `unique` constraint is not currently supported.

### Infer

Given headers and data, `infer` will return a JSON Table Schema as a JSON object based on the data values. Given the data file, data_to_infer.csv:

```csv
id,age,name
1,39,Paul
2,23,Jimmy
3,36,Jane
4,28,Judy
```

Call `infer` with headers and values from the datafile:

```javascript
import io
import csv

from jsontableschema import infer

filepath = 'data_to_infer.csv'
with io.open(filepath) as stream:
    headers = stream.readline().rstrip('\n').split(',')
    values = csv.reader(stream)

schema = infer(headers, values)
```

`schema` is now a schema dict:

```python
{u'fields': [
    {
        u'description': u'',
        u'format': u'default',
        u'name': u'id',
        u'title': u'',
        u'type': u'integer'
    },
    {
        u'description': u'',
        u'format': u'default',
        u'name': u'age',
        u'title': u'',
        u'type': u'integer'
    },
    {
        u'description': u'',
        u'format': u'default',
        u'name': u'name',
        u'title': u'',
        u'type': u'string'
    }]
}
```

The number of rows used by `infer` can be limited with the `row_limit` argument.

### Validate

Given a schema as JSON file, url to JSON file, or a Python dict, `validate` returns `True` for a valid JSON Table Schema, or raises an exception, `SchemaValidationError`.

```python
import io
import json

from jsontableschema import validate

filepath = 'schema_to_validate.json'

with io.open(filepath) as stream:
    schema = json.load(stream)

try:
    jsontableschema.validate(schema)
except jsontableschema.exceptions.SchemaValidationError as e:
   # handle errors

```

It may be useful to report multiple errors when validating a schema. This can be done with `validator.iter_errors()`.

```python

from jsontableschema import validator

filepath = 'schema_with_multiple_errors.json'
with io.open(filepath) as stream:
    schema = json.load(stream)
    errors = [i for i in validator.iter_errors(schema)]
```

Note: `validate()` validates whether a **schema** is a validate JSON Table Schema. It does **not** validate data against a schema.

## Contributing

Please read the contribution guideline:

[How to Contribute](CONTRIBUTING.md)

Thanks!