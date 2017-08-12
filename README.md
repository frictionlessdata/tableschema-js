# tableschema-js

[![Travis](https://travis-ci.org/frictionlessdata/tableschema-js.svg?branch=master)](https://travis-ci.org/frictionlessdata/tableschema-js)
[![Coveralls](https://coveralls.io/repos/github/frictionlessdata/tableschema-js/badge.svg?branch=master)](https://coveralls.io/github/frictionlessdata/tableschema-js?branch=master)
[![NPM](https://img.shields.io/npm/v/tableschema.svg)](https://www.npmjs.com/package/tableschema)
[![Gitter](https://img.shields.io/gitter/room/frictionlessdata/chat.svg)](https://gitter.im/frictionlessdata/chat)

A library for working with [Table Schema](http://specs.frictionlessdata.io/table-schema/).

> Version v1.0 includes various important changes. Please read a [migration guide](#v10).

## Features

 - `Table` class for working with data and schema
 - `Schema` class for working with schemas
 - `Field` class for working with schema fields
 - `validate` function for validating schema descriptors
 - `infer` function that creates a schema based on a data sample

## Getting started

### Installation

The package use semantic versioning. It means that major versions  could include breaking changes. It's highly recommended to specify `tableschema` version range in your `package.json` file e.g. `tabulator: ^1.0` which  will be added by default by `npm install --save`.

#### NPM

```bash
$ npm install jsontableschema # v0.2
$ npm install tableschema@latest # v1.0-alpha
```

#### CDN

```html
<script src="//unpkg.com/tableschema/dist/tableschema.min.js"></script>
```

### Examples

Code examples in this readme requires Node v8.0+ or proper modern browser . Also you have to wrap code into async function if there is await keyword used. You could see even more example in [examples](https://github.com/frictionlessdata/tableschema-js/tree/master/examples) directory.

```javascript
const {Table} = require('tableschema')

const table = await Table.load('data.csv')
await table.infer() // infer a schema
await table.read({keyed: true}) // read the data
await table.schema.save() // save the schema
await table.save() // save the data
```

## Documentation

### Table

A table is a core concept in a tabular data world. It represents a data with a metadata (Table Schema). Let's see how we could use it in practice.

Consider we have some local csv file. It could be inline data or remote link - all supported by `Table` class (except local files for in-brower usage of course). But say it's `data.csv` for now:

```csv
city,location
london,"51.50,-0.11"
paris,"48.85,2.30"
rome,N/A
```

Let's create and read a table. We use static `Table.load` method and `table.read` method with a `keyed` option to get array of keyed rows:

```javascript
const table = await Table.load('data.csv')
table.headers // ['city', 'location']
await table.read({keyed: true})
// [
//   {city: 'london', location: '51.50,-0.11'},
//   {city: 'paris', location: '48.85,2.30'},
//   {city: 'rome', location: 'N/A'},
// ]
```

As we could see our locations are just a strings. But it should be geopoints. Also Rome's location is not available but it's also just a `N/A` string instead of JavaScript `null`. First we have to infer Table Schema:

```javascript
await table.infer()
table.schema.descriptor
// { fields:
//   [ { name: 'city', type: 'string', format: 'default' },
//     { name: 'location', type: 'geopoint', format: 'default' } ],
//  missingValues: [ '' ] }
await table.read({keyed: true})
// Fails with a data validation error
```

Let's fix not available location. There is a `missingValues` property in Table Schema specification. As a first try we set `missingValues` to `N/A` in `table.schema.descriptor`. Schema descriptor could be changed in-place but all changes sould be commited by `table.schema.commit()`:

```javascript
table.schema.descriptor['missingValues'] = 'N/A'
table.schema.commit()
table.schema.valid // false
table.schema.errors
// Error: Descriptor validation error:
//   Invalid type: string (expected array)
//    at "/missingValues" in descriptor and
//    at "/properties/missingValues/type" in profile
```

As a good citiziens we've decided to check out schema descriptor validity. And it's not valid! We sould use an array for `missingValues` property. Also don't forget to have an empty string as a missing value:

```javascript
table.schema.descriptor['missingValues'] = ['', 'N/A']
table.schema.commit()
table.schema.valid // true
```

All good. It looks like we're ready to read our data again:

```javascript
await table.read({keyed: true})
// [
//   {city: 'london', location: [51.50,-0.11]},
//   {city: 'paris', location: [48.85,2.30]},
//   {city: 'rome', location: null},
// ]
```

Now we see that:
- locations are arrays with numeric lattide and longitude
- Rome's location is a native JavaScript `null`

And because there are no errors on data reading we could be sure that our data is valid againt our schema. Let's save it:

```javascript
await table.schema.save('schema.json')
await table.save('data.csv')
```

Our `data.csv` looks the same because it has been stringified back to `csv` format. But now we have `schema.json`:

```json
{
    "fields": [
        {
            "name": "city",
            "type": "string",
            "format": "default"
        },
        {
            "name": "location",
            "type": "geopoint",
            "format": "default"
        }
    ],
    "missingValues": [
        "",
        "N/A"
    ]
}

```

If we decide to improve it even more we could update the schema file and then open it again. But now providing a schema path and iterating thru the data using Node Streams:

```javascript
const table = await Table.load('data.csv', {scheme: 'schema.json'})
const stream = await table.iter({stream: true})
stream.on('data', (row) => {
  // handle row ['london', [51.50,-0.11]] etc
  // keyed/extended/cast supported in a stream mode too
})
```

It was onle basic introduction to the `Table` class. To learn more let's take a look on `Table` class API reference.

#### `async Table.load(source, {schema, headers=1, strict=false})`

Factory method to instantiate `Table` class. This method is async and it should be used with await keyword or as a `Promise`.

- `source (String/Array[]/Function)` - data source (one of):
  - local CSV file (path)
  - remote CSV file (url)
  - array of arrays representing the rows
  - function returning readable stream with CSV file contents
- `schema (Object)` - data schema in all forms supported by `Schema` class
- `headers (Integer/String[])` - data source headers (one of):
  - row number containing headers (`source` should contain headers rows)
  - array of headers (`source` should NOT contain headers rows)
- `strict (Boolean)` - strictness option to pass to `Schema` constructor
- `(Error)` - raises any error occured in table creation process
- `(Table)` - returns data table class instance

#### `table.schema`

- `(Schema)` - returns schema class instance

#### `table.headers`

- `(String[])` - returns data source headers

#### `async table.iter({keyed, extended, cast=true, stream=false})`

Iter through the table data and emits rows cast based on table schema (async for loop). With a `stream` flag instead of async iterator a Node stream will be returned. Data casting could be disabled.

- `keyed (Boolean)` - iter keyed rows
- `extended (Boolean)` - iter extended rows
- `cast (Boolean)` - disable data casting if false
- `stream (Boolean)` - return Node Readable Stream of table rows
- `(Error)` - raises any error occured in this process
- `(AsyncIterator/Stream)` - async iterator/stream of rows:
  - `[value1, value2]` - base
  - `{header1: value1, header2: value2}` - keyed
  - `[rowNumber, [header1, header2], [value1, value2]]` - extended

#### `async table.read({keyed, extended, cast=true, limit})`

Read the whole table and returns as array of rows. Count of rows could be limited.

- `keyed (Boolean)` - flag to emit keyed rows
- `extended (Boolean)` - flag to emit extended rows
- `cast (Boolean)` - flag to disable data casting if false
- `limit (Number)` - integer limit of rows to return
- `(Error)` - raises any error occured in this process
- `(Array[])` - returns array of rows (see `table.iter`)

#### `async table.infer({limit=100})`

Infer a schema for the table. It will infer and set Table Schema to `table.schema` based on table data.

- `limit (Number)` - limit rows samle size
- `(Object)` - returns Table Schema descriptor

#### `async table.save(target)`

Save data source to file locally in CSV format with `,` (comma) delimiter

- `target (String)` - path where to save a table data
- `(Error)` - raises an error if there is saving problem
- `(Boolean)` - returns true on success

### Schema

A model of a schema with helpful methods for working with the schema and supported data. Schema instances can be initialized with a schema source as a url to a JSON file or a JSON object. The schema is initially validated (see [validate](#validate) below), and will raise an exception if not a valid Table Schema.

```js
const {Schema} = require('tableschema')

const descriptor = {
  fields: [
    {name: 'name', type: 'string'},
    {name: 'age', type: 'integer'},
  ]
}

try {
  const schema = await Schema.load(descriptor)
  schema.valid // true
  schema.errors // []
  schema.descriptor // {fields: [...]}
} catch (errors) {
  errors // list of validation errors
}
```

#### `async Schema.load(descriptor, {strict=false})`

Factory method to instantiate `Schema` class. This method is async and it should be used with await keyword or as a `Promise`.

- `descriptor (String/Object)` - schema descriptor:
  -  local path
  -  remote url
  -  object
- `strict (Boolean)` - flag to alter validation behaviour:
  - if false error will not be raised and all error will be collected in `schema.errors`
  - if strict is true any validation error will be raised immediately
- `(Error)` - raises error if schema can't be instantiated
- `(Error[])` - raises list of validation errors if strict is true
- `(Schema)` - returns schema class instance

List of actions on descriptor:
- retrieved (if path/url)
- expanded (with profile defaults)
- validated (against `table-schema` profile)

#### `schema.valid`

- `(Boolean)` - returns validation status. It always true in strict mode.

#### `schema.errors`

- `(Error[])` - returns validation errors. It always empty in strict mode.

#### `schema.descriptor`

- `(Object)` - returns schema descriptor

#### `schema.primaryKey`

- `(str[])` - returns schema primary key

#### `schema.foreignKeys`

- `(Object[])` - returns schema foreign keys

#### `schema.fieldNames`

- `(String[])` - returns an array of field names.

#### `schema.addField(descriptor)`

Add new field to schema. The schema descriptor will be validated with newly added field descriptor.

- `descriptor (Object)` - field descriptor
- `(Error[])` - raises list of validation errors
- `(Error)` - raises any field creation error
- `(Field/null)` - returns added `Field` instance or null if not added

#### `schema.getField(name)`

Get schema field by name.

- `name (String)` - schema field name
- `(Field/null)` - returns `Field` instance or null if not found

#### `schema.removeField(name)`

Remove field resource by name. The schema descriptor will be validated after field descriptor removal.

- `name (String)` - schema field name
- `(Error[])` - raises list of validation errors
- `(Field/null)` - returns removed `Field` instances or null if not found

#### `schema.castRow(row)`

Cast row based on field types and formats.

- `row (any[])` - data row as an array of values
- `(any[])` - returns cast data row

#### `schema.infer(rows, {headers=1})`

Infer and set `schema.descriptor` based on data sample.

- `rows (Array[])` - array of arrays representing rows.
- `headers (Integer/String[])` - data sample headers (one of):
  - row number containing headers (`rows` should contain headers rows)
  - array of headers (`rows` should NOT contain headers rows)
- `{Object}` - returns Table Schema descriptor

#### `schema.commit()`

Update schema instance if there are in-place changes in the descriptor.

- `(Error[])` - raises list of validation errors
- `(Error)` - raises any resource creation error
- `(Boolean)` - returns true on success and false if not modified

```js
const descriptor = {fields: [{name: 'field', type: 'string'}]}
const schema = await Schema.load(descriptor)

schema.getField('name').type // string
schema.descriptor.fields[0].type = 'number'
schema.getField('name').type // string
schema.commit()
schema.getField('name').type // number
```

#### `async schema.save(target)`

Save schema descriptor to target destination.

- `target (String)` - path where to save a descriptor
- `(Error)` - raises an error if there is saving problem
- `(Boolean)` - returns true on success

### Field

Class represents field in the schema.

Data values can be cast to native Javascript types. Casting a value will check the value is of the expected type, is in the correct format, and complies with any constraints imposed by a schema.

```js
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

```js
var dateType = field.castValue('2014-05-29')
```

And following example will raise exception, because we set flag 'skip constraints' to `false`, and our date is less than allowed by `minimum` constraints of the field. Exception will be raised as well in situation of trying to cast non-date format values, or empty values

```js
try {
    var dateType = field.castValue('2014-05-29', false)
} catch(e) {
    // uh oh, something went wrong
}
```

Values that can't be cast will raise an `Error` exception.
Casting a value that doesn't meet the constraints will raise an `Error` exception.

Available types, formats and resultant value of the cast:

| Type | Formats | Casting result |
| ---- | ------- | -------------- |
| any | default | Any |
| array | default | Array |
| boolean | default | Boolean |
| date | default, any, <PATTERN> | Date |
| datetime | default, any, <PATTERN> | Date |
| duration | default | moment.Duration |
| geojson | default, topojson | Object |
| geopoint | default, array, object | [Number, Number] |
| integer | default | Number |
| number | default | Number |
| object | default | Object |
| string | default, uri, email, binary | String |
| time | default, any, <PATTERN> | Date |
| year | default | Number |
| yearmonth | default | [Number, Number] |

#### `new Field(descriptor, {missingValues=['']})`

Constructor to instantiate `Field` class.

- `descriptor (Object)` - schema field descriptor
- `missingValues (String[])` - an array with string representing missing values
- `(Error)` - raises error if field can't be instantiated
- `(Field)` - returns field class instance

List of actions on descriptor:
- expanded (with profile defaults)

#### `field.name`

- `(String)` - returns field name

#### `field.type`

- `(String)` - returns field type

#### `field.format`

- `(String)` - returns field format

#### `field.required`

- `(Boolean)` - returns true if field is required

#### `field.constraints`

- `(Object)` - returns an object with field constraints

#### `field.descriptor`

- `(Object)` - returns field descriptor

#### `field.castValue(value, {constraints=true})`

Cast given value according to the field type and format.

- `value (any)` - value to cast against field
- `constraints (Boolean/String[])` - gets constraints configuration
  - it could be set to true to disable constraint checks
  - it could be an Array of constraints to check e.g. ['minimum', 'maximum']
- `(Error)` - raises cast error if happens
- `(any)` - returns cast value

#### `field.testValue(value, {constraints=true})`

Test if value is compliant to the field.

- `value (any)` - value to cast against field
- `constraints (Boolean/String[])` - constraints configuration
- `(Boolean)` - returns if value is compliant to the field

### Validate

> `validate()` validates whether a **schema** is a validate Table Schema accordingly to the [specifications](http://schemas.datapackages.org/json-table-schema.json). It does **not** validate data against a schema.

Given a schema descriptor `validate` returns `Promise`, which success for a valid Table Schema, or reject with array of errors:

```js
const {validate} = require('tableschema')

try {
    validate('schema.json')
} catch (errors) {
  // uh oh, some validation errors in the errors array
}

```


#### `async validate(descriptor)`

This funcion is async so it has to be used with `await` keyword or as a `Promise`.

- `descriptor (String/Object)` - schema descriptor (one of):
  - local path
  - remote url
  - object
- `(Error[])` - raises list of validation errors for invalid
- `(Boolean)` - returns true for valid

List of actions on descriptor:
- retrieved (if path/url)
- expanded (with profile defaults)
- validated (against table-schema profile)



### Infer

Given data source and headers `infer` will return a Table Schema as a JSON object based on the data values.

Given the data file, example.csv:

```csv
id,age,name
1,39,Paul
2,23,Jimmy
3,36,Jane
4,28,Judy
```

Call `infer` with headers and values from the datafile:

```js
const descriptor = await infer('data.csv')
```

The `descriptor` variable is now a JSON object:

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

#### `async infer(source, {headers=1})`

This funcion is async so it has to be used with `await` keyword or as a `Promise`.

- `source (String/Array[])` - data source
- `headers (String[])` - array of headers
- `(Error)` - raises any error occured
- `(Object)` - returns schema descriptor

## Contributing

The project follows the [Open Knowledge International coding standards](https://github.com/okfn/coding-standards). There are common commands to work with the project:

```
$ npm install
$ npm run test
$ npm run build
```

## Changelog

Here described only breaking and the most important changes. The full changelog could be found in nicely formatted [commit history](https://github.com/frictionlessdata/tableschema-js/commits/master).

### v1.0

This version includes various big changes. **A migration guide is under development and will be published here**.

### [v0.2](https://github.com/frictionlessdata/tableschema-js/tree/v0.2.x)

First stable version of the library.
