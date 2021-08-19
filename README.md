# tableschema-js

[![Build](https://img.shields.io/github/workflow/status/frictionlessdata/tableschema-js/general/main)](https://github.com/frictionlessdata/tableschema-js/actions)
[![Coverage](https://img.shields.io/codecov/c/github/frictionlessdata/tableschema-js/main)](https://codecov.io/gh/frictionlessdata/tableschema-js)
[![Registry](https://img.shields.io/npm/v/frictionless-tableschema-js.svg)](https://www.npmjs.com/package/frictionless-tableschema-js)
[![Codebase](https://img.shields.io/badge/github-main-brightgreen)](https://github.com/frictionlessdata/tableschema-js)
[![Support](https://img.shields.io/badge/support-discord-brightgreen)](https://discordapp.com/invite/Sewv6av)

A library for working with [Table Schema](http://specs.frictionlessdata.io/table-schema/).

## Features

- `Table` class for working with data and schema
- `Schema` class for working with schemas
- `Field` class for working with schema fields
- `validate` function for validating schema descriptors
- `infer` function that creates a schema based on a data sample

## Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Getting started](#getting-started)
  - [Installation](#installation)
- [Documentation](#documentation)
  - [Introduction](#introduction)
  - [Working with Table](#working-with-table)
  - [Working with Schema](#working-with-schema)
  - [Working with Field](#working-with-field)
  - [Working with validate/infer](#working-with-validateinfer)
- [API Reference](#api-reference)
  - [Table](#table)
  - [Schema](#schema)
  - [Field](#field)
  - [validate(descriptor) ⇒ <code>Object</code>](#validatedescriptor-%E2%87%92-codeobjectcode)
  - [infer(source, headers, options) ⇒ <code>Object</code>](#infersource-headers-options-%E2%87%92-codeobjectcode)
  - [DataPackageError](#datapackageerror)
  - [TableSchemaError](#tableschemaerror)
- [Contributing](#contributing)
- [Changelog](#changelog)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Getting started

> To use the library with `webpack` please replicate the `webpack.config.js->node` configuration - https://github.com/frictionlessdata/tableschema-js/blob/master/webpack.config.js

### Installation

The package use semantic versioning. It means that major versions could include breaking changes. It's highly recommended to specify `tableschema` version range in your `package.json` file e.g. `tabulator: ^1.0` which  will be added by default by `npm install --save`.

#### NPM

```bash
$ npm install tableschema
```

#### CDN

```html
<script src="//unpkg.com/tableschema/dist/tableschema.min.js"></script>
```

## Documentation

### Introduction

Let's start with a simple example for Node.js:

```javascript
const {Table} = require('tableschema')

const table = await Table.load('data.csv')
await table.infer() // infer a schema
await table.read({keyed: true}) // read the data
await table.schema.save() // save the schema
await table.save() // save the data
```

And for browser:

> https://jsfiddle.net/rollninja/ayngwd38/2/

After the script registration the library will be available as a global variable `tableschema`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>tableschema-js</title>
  </head>
  <body>
    <script src="//unpkg.com/tableschema/dist/tableschema.min.js"></script>
    <script>
      const main = async () => {
        const table = await tableschema.Table.load('https://raw.githubusercontent.com/frictionlessdata/datapackage-js/master/data/data.csv')
        const rows = await table.read()
        document.body.innerHTML += `<div>${table.headers}</div>`
        for (const row of rows) {
          document.body.innerHTML += `<div>${row}</div>`
        }
      }
      main()
    </script>
  </body>
</html>
```

### Working with Table

A table is a core concept in a tabular data world. It represents data with metadata (Table Schema). Let's see how we could use it in practice.

Consider we have some local csv file. It could be inline data or remote link - all supported by `Table` class (except local files for in-browser usage of course). But say it's `data.csv` for now:

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

As we could see our locations are just strings. But it should be geopoints. Also Rome's location is not available but it's also just a `N/A` string instead of JavaScript `null`. First we have to infer Table Schema:

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

Let's fix not available location. There is a `missingValues` property in Table Schema specification. As a first try we set `missingValues` to `N/A` in `table.schema.descriptor`. Schema descriptor could be changed in-place but all changes should be committed by `table.schema.commit()`:

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

As a good citizens we've decided to check out schema descriptor validity. And it's not valid! We should use an array for `missingValues` property. Also don't forget to have an empty string as a missing value:

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

- locations are arrays with numeric latitude and longitude
- Rome's location is a native JavaScript `null`

And because there are no errors on data reading we could be sure that our data is valid against our schema. Let's save it:

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
const table = await Table.load('data.csv', {schema: 'schema.json'})
const stream = await table.iter({stream: true})
stream.on('data', (row) => {
  // handle row ['london', [51.50,-0.11]] etc
  // keyed/extended/cast supported in a stream mode too
})
```

It was only basic introduction to the `Table` class. To learn more let's take a look on `Table` class API reference.

### Working with Schema

A model of a schema with helpful methods for working with the schema and supported data. Schema instances can be initialized with a schema source as a url to a JSON file or a JSON object. The schema is initially validated (see [validate](#validate) below). By default validation errors will be stored in `schema.errors` but in a strict mode it will be instantly raised.

Let's create a blank schema. It's not valid because `descriptor.fields` property is required by the [Table Schema](http://specs.frictionlessdata.io/table-schema/) specification:

```javascript
const schema = await Schema.load({})
schema.valid // false
schema.errors
// Error: Descriptor validation error:
//         Missing required property: fields
//         at "" in descriptor and
//         at "/required/0" in profile
```

To not create a schema descriptor by hands we will use a `schema.infer` method to infer the descriptor from given data:

```javascript
schema.infer([
  ['id', 'age', 'name'],
  ['1','39','Paul'],
  ['2','23','Jimmy'],
  ['3','36','Jane'],
  ['4','28','Judy'],
])
schema.valid // true
schema.descriptor
//{ fields:
//   [ { name: 'id', type: 'integer', format: 'default' },
//     { name: 'age', type: 'integer', format: 'default' },
//     { name: 'name', type: 'string', format: 'default' } ],
//  missingValues: [ '' ] }
```

Now we have an inferred schema and it's valid. We could cast data row against our schema. We provide a string input by an output will be cast correspondingly:

```javascript
schema.castRow(['5', '66', 'Sam'])
// [ 5, 66, 'Sam' ]
```

But if we try provide some missing value to `age` field cast will fail because for now only one possible missing value is an empty string. Let's update our schema:

```javascript
schema.castRow(['6', 'N/A', 'Walt'])
// Cast error
schema.descriptor.missingValues = ['', 'N/A']
schema.commit()
schema.castRow(['6', 'N/A', 'Walt'])
// [ 6, null, 'Walt' ]
```

We could save the schema to a local file. And we could continue the work in any time just loading it from the local file:

```javascript
await schema.save('schema.json')
const schema = await Schema.load('schema.json')
```

It was only basic introduction to the `Schema` class. To learn more let's take a look on `Schema` class API reference.

### Working with Field

Class represents a field in the schema.

Data values can be cast to native JavaScript types. Casting a value will check the value is of the expected type, is in the correct format, and complies with any constraints imposed by a schema.

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

Available types, formats and resultant value of the cast:

| Type | Formats | Casting result |
| ---- | ------- | -------------- |
| any | default | Any |
| array | default | Array |
| boolean | default | Boolean |
| date | default, any, \<PATTERN\> | Date |
| datetime | default, any, \<PATTERN\> | Date |
| duration | default | moment.Duration |
| geojson | default, topojson | Object |
| geopoint | default, array, object | [Number, Number] |
| integer | default | Number |
| number | default | Number |
| object | default | Object |
| string | default, uri, email, binary | String |
| time | default, any, \<PATTERN\> | Date |
| year | default | Number |
| yearmonth | default | [Number, Number] |

### Working with validate/infer

> `validate()` validates whether a **schema** is a validate Table Schema accordingly to the [specifications](http://schemas.datapackages.org/json-table-schema.json). It does **not** validate data against a schema.

Given a schema descriptor `validate` returns `Promise` with a validation object:

```javascript
const {validate} = require('tableschema')

const {valid, errors} = await validate('schema.json')
for (const error of errors) {
  // inspect Error objects
}
```

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

```javascript
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

## API Reference

### Table
Table representation


* [Table](#Table)
    * _instance_
        * [.headers](#Table+headers) ⇒ <code>Array.&lt;string&gt;</code>
        * [.schema](#Table+schema) ⇒ <code>Schema</code>
        * [.iter(keyed, extended, cast, forceCast, relations, stream)](#Table+iter) ⇒ <code>AsyncIterator</code> \| <code>Stream</code>
        * [.read(limit)](#Table+read) ⇒ <code>Array.&lt;Array&gt;</code> \| <code>Array.&lt;Object&gt;</code>
        * [.infer(limit)](#Table+infer) ⇒ <code>Object</code>
        * [.save(target)](#Table+save) ⇒ <code>Boolean</code>
    * _static_
        * [.load(source, schema, strict, headers, parserOptions)](#Table.load) ⇒ [<code>Table</code>](#Table)


#### table.headers ⇒ <code>Array.&lt;string&gt;</code>
Headers

**Returns**: <code>Array.&lt;string&gt;</code> - data source headers

#### table.schema ⇒ <code>Schema</code>
Schema

**Returns**: <code>Schema</code> - table schema instance

#### table.iter(keyed, extended, cast, forceCast, relations, stream) ⇒ <code>AsyncIterator</code> \| <code>Stream</code>
Iterate through the table data

And emits rows cast based on table schema (async for loop).
With a `stream` flag instead of async iterator a Node stream will be returned.
Data casting can be disabled.

**Returns**: <code>AsyncIterator</code> \| <code>Stream</code> - async iterator/stream of rows:
 - `[value1, value2]` - base
 - `{header1: value1, header2: value2}` - keyed
 - `[rowNumber, [header1, header2], [value1, value2]]` - extended
**Throws**:

- <code>TableSchemaError</code> raises any error occurred in this process


| Param | Type | Description |
| --- | --- | --- |
| keyed | <code>boolean</code> | iter keyed rows |
| extended | <code>boolean</code> | iter extended rows |
| cast | <code>boolean</code> | disable data casting if false |
| forceCast | <code>boolean</code> | instead of raising on the first row with cast error   return an error object to replace failed row. It will allow   to iterate over the whole data file even if it's not compliant to the schema.   Example of output stream:     `[['val1', 'val2'], TableSchemaError, ['val3', 'val4'], ...]` |
| relations | <code>Object</code> | object of foreign key references in a form of   `{resource1: [{field1: value1, field2: value2}, ...], ...}`.   If provided foreign key fields will checked and resolved to its references |
| stream | <code>boolean</code> | return Node Readable Stream of table rows |


#### table.read(limit) ⇒ <code>Array.&lt;Array&gt;</code> \| <code>Array.&lt;Object&gt;</code>
Read the table data into memory

> The API is the same as `table.iter` has except for:

**Returns**: <code>Array.&lt;Array&gt;</code> \| <code>Array.&lt;Object&gt;</code> - list of rows:
 - `[value1, value2]` - base
 - `{header1: value1, header2: value2}` - keyed
 - `[rowNumber, [header1, header2], [value1, value2]]` - extended

| Param | Type | Description |
| --- | --- | --- |
| limit | <code>integer</code> | limit of rows to read |


#### table.infer(limit) ⇒ <code>Object</code>
Infer a schema for the table.

It will infer and set Table Schema to `table.schema` based on table data.

**Returns**: <code>Object</code> - Table Schema descriptor

| Param | Type | Description |
| --- | --- | --- |
| limit | <code>number</code> | limit rows sample size |


#### table.save(target) ⇒ <code>Boolean</code>
Save data source to file locally in CSV format with `,` (comma) delimiter

**Returns**: <code>Boolean</code> - true on success
**Throws**:

- <code>TableSchemaError</code> an error if there is saving problem


| Param | Type | Description |
| --- | --- | --- |
| target | <code>string</code> | path where to save a table data |


#### Table.load(source, schema, strict, headers, parserOptions) ⇒ [<code>Table</code>](#Table)
Factory method to instantiate `Table` class.

This method is async and it should be used with await keyword or as a `Promise`.
If `references` argument is provided foreign keys will be checked
on any reading operation.

**Returns**: [<code>Table</code>](#Table) - data table class instance
**Throws**:

- <code>TableSchemaError</code> raises any error occurred in table creation process


| Param | Type | Description |
| --- | --- | --- |
| source | <code>string</code> \| <code>Array.&lt;Array&gt;</code> \| <code>Stream</code> \| <code>function</code> | data source (one of):   - local CSV file (path)   - remote CSV file (url)   - array of arrays representing the rows   - readable stream with CSV file contents   - function returning readable stream with CSV file contents |
| schema | <code>string</code> \| <code>Object</code> | data schema   in all forms supported by `Schema` class |
| strict | <code>boolean</code> | strictness option to pass to `Schema` constructor |
| headers | <code>number</code> \| <code>Array.&lt;string&gt;</code> | data source headers (one of):   - row number containing headers (`source` should contain headers rows)   - array of headers (`source` should NOT contain headers rows) |
| parserOptions | <code>Object</code> | options to be used by CSV parser.   All options listed at <https://csv.js.org/parse/options/>.   By default `ltrim` is true according to the CSV Dialect spec. |


### Schema
Schema representation


* [Schema](#Schema)
    * _instance_
        * [.valid](#Schema+valid) ⇒ <code>Boolean</code>
        * [.errors](#Schema+errors) ⇒ <code>Array.&lt;Error&gt;</code>
        * [.descriptor](#Schema+descriptor) ⇒ <code>Object</code>
        * [.primaryKey](#Schema+primaryKey) ⇒ <code>Array.&lt;string&gt;</code>
        * [.foreignKeys](#Schema+foreignKeys) ⇒ <code>Array.&lt;Object&gt;</code>
        * [.fields](#Schema+fields) ⇒ <code>Array.&lt;Field&gt;</code>
        * [.fieldNames](#Schema+fieldNames) ⇒ <code>Array.&lt;string&gt;</code>
        * [.getField(fieldName)](#Schema+getField) ⇒ <code>Field</code> \| <code>null</code>
        * [.addField(descriptor)](#Schema+addField) ⇒ <code>Field</code>
        * [.removeField(name)](#Schema+removeField) ⇒ <code>Field</code> \| <code>null</code>
        * [.castRow(row, failFalst)](#Schema+castRow) ⇒ <code>Array.&lt;Array&gt;</code>
        * [.infer(rows, headers)](#Schema+infer) ⇒ <code>Object</code>
        * [.commit(strict)](#Schema+commit) ⇒ <code>Boolean</code>
        * [.save(target)](#Schema+save) ⇒ <code>boolean</code>
    * _static_
        * [.load(descriptor, strict)](#Schema.load) ⇒ [<code>Schema</code>](#Schema)


#### schema.valid ⇒ <code>Boolean</code>
Validation status

It always `true` in strict mode.

**Returns**: <code>Boolean</code> - returns validation status

#### schema.errors ⇒ <code>Array.&lt;Error&gt;</code>
Validation errors

It always empty in strict mode.

**Returns**: <code>Array.&lt;Error&gt;</code> - returns validation errors

#### schema.descriptor ⇒ <code>Object</code>
Descriptor

**Returns**: <code>Object</code> - schema descriptor

#### schema.primaryKey ⇒ <code>Array.&lt;string&gt;</code>
Primary Key

**Returns**: <code>Array.&lt;string&gt;</code> - schema primary key

#### schema.foreignKeys ⇒ <code>Array.&lt;Object&gt;</code>
Foreign Keys

**Returns**: <code>Array.&lt;Object&gt;</code> - schema foreign keys

#### schema.fields ⇒ <code>Array.&lt;Field&gt;</code>
Fields

**Returns**: <code>Array.&lt;Field&gt;</code> - schema fields

#### schema.fieldNames ⇒ <code>Array.&lt;string&gt;</code>
Field names

**Returns**: <code>Array.&lt;string&gt;</code> - schema field names

#### schema.getField(fieldName) ⇒ <code>Field</code> \| <code>null</code>
Return a field

**Returns**: <code>Field</code> \| <code>null</code> - field instance if exists

| Param | Type |
| --- | --- |
| fieldName | <code>string</code> |


#### schema.addField(descriptor) ⇒ <code>Field</code>
Add a field

**Returns**: <code>Field</code> - added field instance

| Param | Type |
| --- | --- |
| descriptor | <code>Object</code> |


#### schema.removeField(name) ⇒ <code>Field</code> \| <code>null</code>
Remove a field

**Returns**: <code>Field</code> \| <code>null</code> - removed field instance if exists

| Param | Type |
| --- | --- |
| name | <code>string</code> |


#### schema.castRow(row, failFalst) ⇒ <code>Array.&lt;Array&gt;</code>
Cast row based on field types and formats.

**Returns**: <code>Array.&lt;Array&gt;</code> - cast data row

| Param | Type | Description |
| --- | --- | --- |
| row | <code>Array.&lt;Array&gt;</code> | data row as an array of values |
| failFalst | <code>boolean</code> |  |


#### schema.infer(rows, headers) ⇒ <code>Object</code>
Infer and set `schema.descriptor` based on data sample.

**Returns**: <code>Object</code> - Table Schema descriptor

| Param | Type | Description |
| --- | --- | --- |
| rows | <code>Array.&lt;Array&gt;</code> | array of arrays representing rows |
| headers | <code>integer</code> \| <code>Array.&lt;string&gt;</code> | data sample headers (one of):   - row number containing headers (`rows` should contain headers rows)   - array of headers (`rows` should NOT contain headers rows)   - defaults to 1 |


#### schema.commit(strict) ⇒ <code>Boolean</code>
Update schema instance if there are in-place changes in the descriptor.

**Returns**: <code>Boolean</code> - returns true on success and false if not modified
**Throws**:

- <code>TableSchemaError</code> raises any error occurred in the process


| Param | Type | Description |
| --- | --- | --- |
| strict | <code>boolean</code> | alter `strict` mode for further work |

**Example**
```javascript
const descriptor = {fields: [{name: 'field', type: 'string'}]}
const schema = await Schema.load(descriptor)

schema.getField('name').type // string
schema.descriptor.fields[0].type = 'number'
schema.getField('name').type // string
schema.commit()
schema.getField('name').type // number
```

#### schema.save(target) ⇒ <code>boolean</code>
Save schema descriptor to target destination.

**Returns**: <code>boolean</code> - returns true on success
**Throws**:

- <code>TableSchemaError</code> raises any error occurred in the process


| Param | Type | Description |
| --- | --- | --- |
| target | <code>string</code> | path where to save a descriptor |


#### Schema.load(descriptor, strict) ⇒ [<code>Schema</code>](#Schema)
Factory method to instantiate `Schema` class.

This method is async and it should be used with await keyword or as a `Promise`.

**Returns**: [<code>Schema</code>](#Schema) - returns schema class instance
**Throws**:

- <code>TableSchemaError</code> raises any error occurred in the process


| Param | Type | Description |
| --- | --- | --- |
| descriptor | <code>string</code> \| <code>Object</code> | schema descriptor:   - local path   - remote url   - object |
| strict | <code>boolean</code> | flag to alter validation behaviour:   - if false error will not be raised and all error will be collected in `schema.errors`   - if strict is true any validation error will be raised immediately |


### Field
Field representation


* [Field](#Field)
    * [new Field(descriptor, missingValues)](#new_Field_new)
    * [.name](#Field+name) ⇒ <code>string</code>
    * [.type](#Field+type) ⇒ <code>string</code>
    * [.format](#Field+format) ⇒ <code>string</code>
    * [.required](#Field+required) ⇒ <code>boolean</code>
    * [.constraints](#Field+constraints) ⇒ <code>Object</code>
    * [.descriptor](#Field+descriptor) ⇒ <code>Object</code>
    * [.castValue(value, constraints)](#Field+castValue) ⇒ <code>any</code>
    * [.testValue(value, constraints)](#Field+testValue) ⇒ <code>boolean</code>


#### new Field(descriptor, missingValues)
Constructor to instantiate `Field` class.

**Returns**: [<code>Field</code>](#Field) - returns field class instance
**Throws**:

- <code>TableSchemaError</code> raises any error occured in the process


| Param | Type | Description |
| --- | --- | --- |
| descriptor | <code>Object</code> | schema field descriptor |
| missingValues | <code>Array.&lt;string&gt;</code> | an array with string representing missing values |


#### field.name ⇒ <code>string</code>
Field name


#### field.type ⇒ <code>string</code>
Field type


#### field.format ⇒ <code>string</code>
Field format


#### field.required ⇒ <code>boolean</code>
Return true if field is required


#### field.constraints ⇒ <code>Object</code>
Field constraints


#### field.descriptor ⇒ <code>Object</code>
Field descriptor


#### field.castValue(value, constraints) ⇒ <code>any</code>
Cast value

**Returns**: <code>any</code> - cast value

| Param | Type | Description |
| --- | --- | --- |
| value | <code>any</code> | value to cast |
| constraints | <code>Object</code> \| <code>false</code> |  |


#### field.testValue(value, constraints) ⇒ <code>boolean</code>
Check if value can be cast


| Param | Type | Description |
| --- | --- | --- |
| value | <code>any</code> | value to test |
| constraints | <code>Object</code> \| <code>false</code> |  |


### validate(descriptor) ⇒ <code>Object</code>
This function is async so it has to be used with `await` keyword or as a `Promise`.

**Returns**: <code>Object</code> - returns `{valid, errors}` object

| Param | Type | Description |
| --- | --- | --- |
| descriptor | <code>string</code> \| <code>Object</code> | schema descriptor (one of):   - local path   - remote url   - object |


### infer(source, headers, options) ⇒ <code>Object</code>
This function is async so it has to be used with `await` keyword or as a `Promise`.

**Returns**: <code>Object</code> - returns schema descriptor
**Throws**:

- <code>TableSchemaError</code> raises any error occured in the process


| Param | Type | Description |
| --- | --- | --- |
| source | <code>string</code> \| <code>Array.&lt;Array&gt;</code> \| <code>Stream</code> \| <code>function</code> | data source (one of):   - local CSV file (path)   - remote CSV file (url)   - array of arrays representing the rows   - readable stream with CSV file contents   - function returning readable stream with CSV file contents |
| headers | <code>Array.&lt;string&gt;</code> | array of headers |
| options | <code>Object</code> | any `Table.load` options |


### DataPackageError
Base class for the all DataPackage/TableSchema errors.

If there are more than one error you could get an additional information
from the error object:

```javascript
try {
  // some lib action
} catch (error) {
  console.log(error) // you have N cast errors (see error.errors)
  if (error.multiple) {
    for (const error of error.errors) {
        console.log(error) // cast error M is ...
    }
  }
}
```


* [DataPackageError](#DataPackageError)
    * [new DataPackageError(message, errors)](#new_DataPackageError_new)
    * [.multiple](#DataPackageError+multiple) ⇒ <code>boolean</code>
    * [.errors](#DataPackageError+errors) ⇒ <code>Array.&lt;Error&gt;</code>


#### new DataPackageError(message, errors)
Create an error


| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> |  |
| errors | <code>Array.&lt;Error&gt;</code> | nested errors |


#### dataPackageError.multiple ⇒ <code>boolean</code>
Whether it's nested


#### dataPackageError.errors ⇒ <code>Array.&lt;Error&gt;</code>
List of errors


### TableSchemaError
Base class for the all TableSchema errors.


## Contributing

> The project follows the [Open Knowledge International coding standards](https://github.com/okfn/coding-standards). There are common commands to work with the project:

```bash
$ npm install
$ npm run test
$ npm run build
```

## Changelog

Here described only breaking and the most important changes. The full changelog and documentation for all released versions could be found in nicely formatted [commit history](https://github.com/frictionlessdata/tableschema-js/commits/master).

#### v1.12

- Added support for infinite numbers: NaN, INF, -INF

#### v1.11

- Improved data/time validation using a conversion table and moment.js (#170)

#### v1.10

- Rebased on csv-parse@4

#### v1.9

Fix bug:

- URI format must have the scheme protocol to be valid ([#135](https://github.com/frictionlessdata/tableschema-js/issues/135))

#### v1.8

Improved behaviour:

- Automatically detect the CSV delimiter if one isn't explicit set

#### v1.7

New API added:

- added `forceCast` flag to the the `table.iter/read` methods

#### v1.6

Improved behaviour:

- improved validation of `string` and `geojson` types
- added heuristics to the `infer` function

#### v1.5

New API added:

- added `format` option to the `Table` constructor
- added `encoding` option to the `Table` constructor

#### v1.4

Improved behaviour:

- Now the `infer` functions support formats inferring

#### v1.3

New API added:

- `error.rowNumber` if available
- `error.columnNumber` if available

#### v1.2

New API added:

- `Table.load` and `infer` now accept Node Stream as a `source` argument

#### v1.1

New API added:

- `Table.load` and `infer` now accepts `parserOptions`

#### v1.0

This version includes various big changes, including a move to asynchronous inference.

#### v0.2

First stable version of the library.
