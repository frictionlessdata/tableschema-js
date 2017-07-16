const fs = require('fs')
const {assert} = require('chai')
const {Table, Schema} = require('../src')
const {catchError} = require('./helpers')


// Fixtures

const SOURCE = [
  ['id', 'height', 'age', 'name', 'occupation'],
  [1, '10.0', 1, 'string1', '2012-06-15 00:00:00'],
  [2, '10.1', 2, 'string2', '2013-06-15 01:00:00'],
  [3, '10.2', 3, 'string3', '2014-06-15 02:00:00'],
  [4, '10.3', 4, 'string4', '2015-06-15 03:00:00'],
  [5, '10.4', 5, 'string5', '2016-06-15 04:00:00']
]
const SCHEMA = {
  fields: [
    {name: 'id', type: 'integer', constraints: {required: true}},
    {name: 'height', type: 'number'},
    {name: 'age', type: 'integer'},
    {name: 'name', type: 'string', constraints: {unique: true}},
    {name: 'occupation', type: 'datetime', format: 'any'}
  ],
  primaryKey: 'id',
}


// Tests

describe('Table', () => {

  it('should not instantiate with bad schema path', async function() {
    if (process.env.USER_ENV === 'browser') this.skip()
    const error = await catchError(Table.load, SOURCE, {schema: 'bad schema path'})
    assert.include(error.message, 'load descriptor')
  })

  it('should work with Schema instance', async () => {
    const schema = await Schema.load(SCHEMA)
    const table = await Table.load(SOURCE, {schema})
    const rows = await table.read()
    assert.equal(rows.length, 5)
  })

  it('should work with array source', async () => {
    const table = await Table.load(SOURCE, {schema: SCHEMA})
    const rows = await table.read()
    assert.equal(rows.length, 5)
  })

  it('should work with readable stream factory', async function() {
    if (process.env.USER_ENV === 'browser') this.skip()
    const source = () => fs.createReadStream('data/data_big.csv')
    const table = await Table.load(source)
    const rows = await table.read({cast: false})
    assert.equal(rows.length, 100)
  })

  it('should work with local path', async function () {
    if (process.env.USER_ENV === 'browser') this.skip()
    const table = await Table.load('data/data_big.csv')
    const rows = await table.read({cast: false})
    assert.equal(rows.length, 100)
  })

  it('should cast source data', async () => {
    const table = await Table.load(SOURCE, {schema: SCHEMA})
    const rows = await table.read()
    assert.deepEqual(rows[0], [1, 10.0, 1, 'string1', new Date(2012, 6-1, 15)])
  })

  it('should not cast source data with cast false', async () => {
    const table = await Table.load(SOURCE, {schema: SCHEMA})
    const rows = await table.read({cast: false})
    assert.deepEqual(rows[0], [1, '10.0', 1, 'string1', '2012-06-15 00:00:00'])
  })

  it('should throw on unique constraints violation', async () => {
    const source = [
      [1, '10.1', '1', 'string1', '2012-06-15'],
      [2, '10.2', '2', 'string1', '2012-07-15'],
    ]
    const table = await Table.load(source, {schema: SCHEMA, headers: false})
    const error = await catchError(table.read.bind(table))
    assert.include(error.message, 'duplicates')
  })

  it('unique constraints violation for primary key', async () => {
    const source = [
      [1, '10.1', '1', 'string1', '2012-06-15'],
      [1, '10.2', '2', 'string2', '2012-07-15'],
    ]
    const table = await Table.load(source, {schema: SCHEMA, headers: false})
    const error = await catchError(table.read.bind(table))
    assert.include(error.message, 'duplicates')
  })

  it('should read source data and limit rows', async () => {
    const table = await Table.load(SOURCE, {schema: SCHEMA})
    const rows = await table.read({limit: 1})
    assert.deepEqual(rows.length, 1)
  })

  it('should read source data and return keyed rows', async () => {
    const table = await Table.load(SOURCE, {schema: SCHEMA})
    const rows = await table.read({keyed: true, limit: 1})
    assert.deepEqual(rows[0],
      {id: 1, height: 10.0, age: 1, name: 'string1', occupation: new Date(2012, 6-1, 15)})
  })

  it('should read source data and return extended rows', async () => {
    const table = await Table.load(SOURCE, {schema: SCHEMA})
    const rows = await table.read({extended: true, limit: 1})
    assert.deepEqual(rows[0], [2,
        ['id', 'height', 'age', 'name', 'occupation'],
        [1, 10.0, 1, 'string1', new Date(2012, 6-1, 15)]])
  })

})
