# Table Schema

[![Gitter](https://img.shields.io/gitter/room/frictionlessdata/chat.svg)](https://gitter.im/frictionlessdata/chat)
[![Travis Build Status](https://travis-ci.org/frictionlessdata/tableschema-js.svg?branch=master)](https://travis-ci.org/frictionlessdata/tableschema-js)
[![Coverage Status](https://coveralls.io/repos/github/frictionlessdata/tableschema-js/badge.svg?branch=master)](https://coveralls.io/github/frictionlessdata/tableschema-js?branch=master)

A utility library for working with [Table Schema](http://specs.frictionlessdata.io/table-schema/) in Javascript.

> Version v0.2.0 has renewed API introduced in NOT backward-compatibility manner. Previous version could be found [here](https://github.com/frictionlessdata/tableschema-js/tree/9144e83a27515110c77ed54f0daca2a8db326b99).

## Table of Contents

[Installation](#installation)
[Components](#components)
  - [Schema](#schema) - a javascript model of a Table Schema with useful methods for interaction
  - [Field](#field) - a javascript model of a Table Schema field
  - [Infer](#infer) - a utility that creates a Table Schema based on a data sample
  - [Validate](#validate) - a utility to validate a **schema** as valid according to the current spec
  - [Table](#table)
[Goals](#goals)
[Contributing](#contributing)

## Installation

```
$ npm install jsontableschema # v0.2
$ npm install tableschema # v1.0-alpha
```
Library requires `Promise` to work properly, and need to be sure that `Promise` available globally. You are free to choose any Promise polyfill.

## Components

Let's look at each of the components in more detail.

### Schema
A model of a schema with helpful methods for working with the schema and supported data. Schema instances can be initialized with a schema source as a url to a JSON file or a JSON object.
The schema is initially validated (see [validate](#validate) below), and will raise an exception if not a valid Table Schema.

```javascript
var Schema = require('tableschema').Schema;
```

```javascript
var model = new Schema('http://someurl.com/remote.json')
```
or
```javascript
var model = new Schema({JSON OBJECT})
```
instance always returns `Promise`
```javascript
model.then(function(schema) {
    // working code to use schema model
    var fields = schema.fields;

}).catch(function(error) {
    // something went wrong and error variable has explanations
})
```

Following methods are available on `Schema` instances:

* `castRow(items, failFast = false, skipConstraints = false)` - convert the arguments given to the types of the current schema <sup>1</sup>
* `descriptor` - JSON representation of `Schema` description
* `fields` - returns an array of [Field](#field) instances of the schema's fields
* `foreignKeys` - returns the foreign key property for the schema
* `getField(fieldName, index = 0)` - returns an instance of [Field](#field) by field name (`fieldName`) <sup>2</sup>
* `hasField(fieldName)` - checks if the field exists in the schema by it's name. Returns a boolean
* `headers` - returns an array of the schema headers
* `primaryKey` - returns the primary key field for the schema as an array
* `save(path)` - saves the schema JSON to provided local `path`. Returns `Promise`

<sup>1</sup> Where the option `failFast` is given, it will raise the first error it encounters, otherwise an array of errors thrown (if there are any errors occur)
<sup>2</sup> Where the optional index argument is available, it can be used as a positional argument if the schema has multiple fields with the same name

### Field
Class represents field in the [Schema](#schema)

* `castValue(value, skipConstraints)` - returns a value cast against the type of the field and it's constraints <sup>1</sup>
* `constraints` - returns the constraints object for a given `fieldName`
* `format` - returns the format of the field
* `name` - returns the name of the field
* `required` - returns `boolean`
* `testValue(value, skipConstraints)` - returns boolean after a check if value can be casted against the type of the field and it's constraints <sup>1</sup>
* `type` - returns the type of the field

<sup>1</sup> Skip constraints if set to `false`, will check all the constraints set for field while casting or testing the value

#### Field types

Data values can be cast to native Javascript types. Casting a value will check the value is of the expected type, is in the correct format, and complies with any constraints imposed by a schema.


```javascript
{
    'name': 'birthday',
    'type': 'date',
    'format': 'default',
    'constraints': {
        'required': True,
        'minimum': '2015-05-30'
    }
}
```
Following code will not raise the exception, despite the fact our date is less than minimum constraints in the field, because we do not check constraints of the field descriptor
```javascript
var dateType = field.castValue('2014-05-29')
```
And following example will raise exception, because we set flag 'skip constraints' to `false`, and our date is less than allowed by `minimum` constraints of the field. Exception will be raised as well in situation of trying to cast non-date format values, or empty values
```javascript
try {
    var dateType = field.castValue('2014-05-29', false)
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
| date | default, any, fmt | Date object |
| time | default, any, fmt | Date object |
| datetime | default, any, fmt | Date object |
| geopoint | default, array, object | Accordingly to format<sup>3</sup> |
| geojson | default, topojson | Accordingly to format<sup>3,4</sup> |

<sup>1</sup> `default` format can be not specified in the field descriptor
<sup>2</sup> in case value has 00 after point (1.00), it will return Number(1).toFixed(2), which is actually String '1.00'
<sup>3</sup> default format returns String
<sup>4</sup> topojson is not implemented

### Infer
Given headers and data, `infer` will return a Table Schema as a JSON object based on the data values. Given the data file, example.csv:

```csv
id,age,name
1,39,Paul
2,23,Jimmy
3,36,Jane
4,28,Judy
```

Call `infer` with headers and values from the datafile:

```javascript
var parse = require('csv-parse');
var fs = require('fs');
var infer = require('tableschema').infer;

fs.readFile('/path/to/example.csv', function(err, data) {
  parse(data, function(error, values) {
    var headers = values.shift()
        , schema = infer(headers, values);
  });
});
```

The `schema` variable is now a JSON object:

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

It possible to provide additional options to build the JSON schema as 3rd argument of `infer` function. It is an object with following possible values:
* `rowLimit` (**integer**) - limit number of rows used by `infer`
* `explicit` (**boolean**) - add `required` constraints to fields
* `primaryKey` (**string, array**) - add `primary key` constraints
* `cast` (**object**) - object with cast instructions for types in the schema. For example:

```javascript
var parse = require('csv-parse');
var fs = require('fs');
var infer = require('tableschema').infer;

fs.readFile('/path/to/example.csv', function(err, data) {
  parse(data, function(error, values) {
    var headers = values.shift(),
        options = {
          rowLimit: 2,
          explicit: true,
          primaryKey: ['id', 'name'],
          cast: {
            string : { format : 'email' },
            number : { format : 'currency' },
            date: { format : 'any'}
          }
        },
        schema = infer(headers, values, options);
  });
});
```

The `schema` variable will look as follow:

```javascript
{
  fields: [
    {
      name: 'id',
      title: '',
      description: '',
      type: 'integer',
      format: 'default',
      required: true
    },
    {
      name: 'age',
      title: '',
      description: '',
      type: 'integer',
      format: 'default',
      required: true
    },
    {
      name: 'name',
      title: '',
      description: '',
      type: 'string',
      format: 'default',
      required: true
    }
  ],
  primaryKey: ['id', 'name']
}
```
In this example:

`rowLimit`: only two rows of values from `example.csv` will be proceed to set field type. It can be useful in cases when data in `CSV` file is not normalized and
values type can be different in each row. Consider following example:
```csv
id,age,name
1,39,Paul
2,23,Jimmy
3,thirty six,Jane
four,28,Judy
```
In this case by limiting rows to 2, we can build schema structure with correct field types

`cast`: every `string` value will be casted using `email` format, `number` will be tried as a `currency` format, and `date` - as `any` format

### Validate
Given a schema as JSON object, `validate` returns `Promise`, which success for a valid Table Schema, or reject with array of errors.

```javascript
var validate = require('tableschema').validate;
var schema = {
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
};

validate(schema).then(function() {
  // do something with valid schema here
}).catch(function(errors) {
  // uh oh, some validation errors in the errors array
})
```
Note: `validate()` validates whether a **schema** is a validate Table Schema accordingly to the (specifications)[http://schemas.datapackages.org/json-table-schema.json]. It does **not** validate data against a schema.

### Table

A javascript model of a table (schema+source of data)

Instance always returns `Promise`. In case if schema object is not valid, it will reject promise.

Source of data can be:
* array of objects with values, represent the rows
* local CSV file
* remote CSV file (URL)
* readable stream

Following methods are available on `Table` instances:

* `iter(callback, failFast, skipConstraints)`<sup>1,2</sup> - iterate through the given dataset provided in constructor and returns converted data
* `read(keyed, extended, limit)` - Read part or full source into array.
  * `keyed`: row looks like `{header1: value1, header2: value2}`
  * `extended`: row looks like `[row_number, [header1, header2], [value1, value2]]`.
    * Low-level usage: when you need all information about row from stream but there is no guarantee that it is not malformed. For example, in goodtables you cannot use keyed because there is no guarantee that it will not fail - https://github.com/frictionlessdata/goodtables-py/blob/master/goodtables/inspector.py#L205
    * High-level usage: useful when you need to get row + row number. This row number is exact row number of source stream row. It's not like counted or similar. So if you skip first 9 rows using skipRows first row number from iter(extended=True) will be 10. It's not possible to get this information on client code level using other approach - iter() index in this case will start from 0.
  * `limit`: limt the number of rows return to `limit`
* `save(path)` - Save source to file locally in CSV format with `,` (comma) delimiter. Returns `Promise`

<sup>1</sup> If `failFast` is set to `true`, it will raise the first error it encounters, otherwise an array of errors thrown (if there are any errors occur). Default is `false`
<sup>2</sup> Skip constraints if set to `true`, will check all the constraints set for field while casting or testing the value. Default is `false`

```javascript
var jts = require('tableschema');
var Table = jts.Table;

var model = new Table({SCHEMA}, {SOURCE})
var callback = function(items) {
    // ... do something with converted items
    // iter method convert values row by row from the source
}
model.then(function (table) {
    table.iter(callback, true, false).then(function() {
          // ... do something when conversion of all data from source is finished
    }, function (errors) {
          // something went wrong while casting values from source
          // errors is array with explanations
    })
}, function(error) {
    // Table can't instantiate for some reason
    // see error for details
})
```

## Goals

* A core set of utilities for working with [Table Schema](http://specs.frictionlessdata.io/table-schema/)
* Use in *other* packages that deal with actual validation of data, or other 'higher level' use cases around Table Schema (e.g. [Tabular Validator](https://github.com/okfn/tabular-validator))
* Be 100% compliant with the the Table Schema specification (we are not there yet)

## Contributing

Please read the contribution guideline:

[How to Contribute](CONTRIBUTING.md)

Thanks!
