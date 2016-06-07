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

* `cast(fieldName, value, index, skipConstraints)` - returns a value cast against a named `fieldName`
* `convertRow(...args)` - convert the arguments given to the types of the current schema <sup>1</sup>
* `convert(items, failFast = false)` - convert an array of rows using the current schema of the Schema instance <sup>2</sup>
* `fields` - returns an array of the schema's fields
* `foreignKeys` - returns the foreign key property for the schema
* `getConstraints(fieldName, index = 0)` - return the constraints object for a given `fieldName` <sup>3</sup>
* `getField(fieldName, index = 0)` - return the field object for `fieldName` <sup>3</sup>
* `getFieldsByType(typeName)` - return all fields that match the given type
* `hasField(fieldName)` - checks if the field exists in the schema. Returns a boolean
* `headers` - returns an array of the schema headers
* `primaryKey` - returns the primary key field for the schema
* `requiredHeaders` - returns headers with the `required` constraint as an array
* `test(fieldName, value, index, skipConstraints)` - returns boolean after a check if value can be casted against a named `fieldName`

<sup>1</sup> Last argument could be `{ failFast: true|false }` (see <sup>2</sup> for more)  
<sup>2</sup> Where the option `failFast` is given, it will raise the first error it encounters, otherwise an array of errors thrown (if there are any errors occur)  
<sup>3</sup> Where the optional index argument is available, it can be used as a positional argument if the schema has multiple fields with the same name

### Types

Data values can be cast to native Javascript types with a type instance from `jsontableschema.types`.

Type instances can be initialized with [field descriptors](http://dataprotocols.org/json-table-schema/#field-descriptors). This allows formats and constraints to be defined:

Casting a value will check the value is of the expected type, is in the correct format, and complies with any constraints imposed by a schema.

On Type class there are three methods available:
* `cast(field, value, skipConstraints)` - Cast the value of the field accordingly to the field type. Skip constraints default value is `true`<sup>1</sup>. May raise an exception if cast is failed
* `test(field, value, skipConstraints)` - check if given value can be casted by field type. Skip constraints default value is `true`<sup>1</sup>. Returns boolean
* `multiCast(values)` - Try to find the best suited Type for provided array of values. Returns String

<sup>1</sup> Skip constraints if set to `false`, will check all the constraints set for field while casting or testing the value

```javascript
import Type from 'jsontableschema.types'

const fieldDescriptor = {
    'name': 'Field Name',
    'type': 'date',
    'format': 'default',
    'constraints': {
        'required': True,
        'minimum': '2015-05-30'
    }
}
const type = new Type()
```
Following code will not raise the exception, despite the fact our date is less than minimum constraints in the field, because we do not check constraints of the field descriptor
```javascript
let dateType = type.cast(fieldDescriptor, '2014-05-29')
```
And following example will raise exception, because we set flag 'skip constraints' to `false`, and our date is less than allowed by `minimum` constraints of the field. Exception will be raised as well in situation of trying to cast non-date format values, or empty values
```javascript
try {
    let dateType = type.cast(fieldDescriptor, '2014-05-29', false)
} catch(e) {
    // uh oh, something went wrong
}
```
Values that can't be cast will raise an `Error` exception.  
Casting a value that doesn't meet the constraints will raise an `Error` exception.  
**Note**: the `unique` constraint is not currently supported.

Available types, formats and resultant value of the cast:

| Type | Formats | Casting result |
| ---- | ------- | -------------- |
| string | default<sup>1</sup>, uri, email, binary | String |
| integer | default | Number |
| number | default, currency | Number<sup>2</sup> |
| boolean | default | Boolean |
| array | default | Array |
| object | default | Object |
| date | default, any, fmt | Moment object |
| time | default, any, fmt | Moment object |
| datetime | default, any, fmt | Moment object |
| geopoint | default, array, object | Accordingly to format<sup>3</sup> |
| geojson | default, topojson | Accordingly to format<sup>3,4</sup> |

<sup>1</sup> `default` format can be not specified in the field descriptor  
<sup>2</sup> in case value has 00 after point (1.00), it will return Number(1).toFixed(2), which is actually String '1.00'  
<sup>3</sup> default format returns String  
<sup>4</sup> topojson is not implemented

### Infer

Given headers and data, `infer` will return a JSON Table Schema as a JSON object based on the data values. Given the data file, example.csv:

```csv
id,age,name
1,39,Paul
2,23,Jimmy
3,36,Jane
4,28,Judy
```

Call `infer` with headers and values from the datafile:

```javascript
import parse from 'csv-parse'
import fs from 'fs'
import { infer } from 'jsontableschema'

fs.readFile('example.csv', (err, data) => {
  parse(data, (error, values) => {
    const headers = values.shift()
        , schema = infer(headers, values)
  })
})
```

`schema` is now a JSON object:

```javascript
{
  fields: [
    {
      name: 'id',
      title: '',
      description: '',
      type: 'integer',
      format: 'default'
    },
    {
      name: 'age',
      title: '',
      description: '',
      type: 'integer',
      format: 'default'
    },
    {
      name: 'name',
      title: '',
      description: '',
      type: 'string',
      format: 'default'
    }
  ]
}
```

It possible to provide additional options to build the JSON schema. 3-rd argument of `infer` is an object with following possible values:
* `rowLimit` (**integer**) - limit number of rows used by `infer`
* `explicit` (**boolean**) - add required constraints for fields
* `primaryKey` (**string, array**) - add primary key constraints
* `cast` (**object**) - object with cast instructions for types in the schema. For example:

```javascript
{
  string : { format : 'email' },
  number : { format : 'currency' },
  date: { format : 'any'}
}
```

In this example every `string` value will be casted using `email` format, number will be tried as a `currency` format, and date - `any` format 

### Validate

Given a schema as JSON object, `validate` returns `Promise` which resolve to success for a valid JSON Table Schema, or reject with array of errors.

```javascript
validate(schema).then(valid => {
  // do something with valid schema here
}).catch(errors => {
  // uh oh, some validation errors in the errors array
})
```
Note: `validate()` validates whether a **schema** is a validate JSON Table Schema. It does **not** validate data against a schema.

## Contributing

Please read the contribution guideline:

[How to Contribute](CONTRIBUTING.md)

Thanks!