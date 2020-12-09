const fs = require('fs')
const { Readable } = require('stream')
const { assert } = require('chai')
const cloneDeep = require('lodash/cloneDeep')
const { Table, Schema } = require('../src')
const { catchError } = require('./helpers')
const axios = require('axios').default

// Tests

describe('Table', () => {
  describe('#general', () => {
    const SOURCE = [
      ['id', 'height', 'age', 'name', 'occupation'],
      [1, '10.0', 1, 'string1', '2012-06-15 00:00:00'],
      [2, '10.1', 2, 'string2', '2013-06-15 01:00:00'],
      [3, '10.2', 3, 'string3', '2014-06-15 02:00:00'],
      [4, '10.3', 4, 'string4', '2015-06-15 03:00:00'],
      [5, '10.4', 5, 'string5', '2016-06-15 04:00:00'],
    ]
    const SCHEMA = {
      fields: [
        { name: 'id', type: 'integer', constraints: { required: true } },
        { name: 'height', type: 'number' },
        { name: 'age', type: 'integer' },
        { name: 'name', type: 'string', constraints: { unique: true } },
        { name: 'occupation', type: 'datetime', format: 'any' },
      ],
      primaryKey: 'id',
    }

    it('should not instantiate with bad schema path', async function () {
      if (process.env.USER_ENV === 'browser') this.skip()
      const error = await catchError(Table.load, SOURCE, {
        schema: 'bad schema path',
      })
      assert.include(error.message, 'load descriptor')
    })

    it('should work with Schema instance', async () => {
      const schema = await Schema.load(SCHEMA)
      const table = await Table.load(SOURCE, { schema })
      const rows = await table.read()
      assert.equal(rows.length, 5)
    })

    it('should work with array source', async () => {
      const table = await Table.load(SOURCE, { schema: SCHEMA })
      const rows = await table.read()
      assert.equal(rows.length, 5)
    })

    it('should work with stream as a source', async function () {
      if (process.env.USER_ENV === 'browser') this.skip()
      const stream = fs.createReadStream('data/data_big.csv')
      const table = await Table.load(stream)
      const rows = await table.read()
      assert.equal(rows.length, 100)
    })

    it('should iter with huge stream as a source', async function () {
      if (process.env.USER_ENV === 'browser') this.skip()
      this.timeout(100000)
      /* eslint max-len: off */
      const url =
        'https://raw.githubusercontent.com/datasets/un-locode/6da8b0a849dd5a72ad53a98d294cf4fe2e2cfd4a/data/code-list.csv'
      const stream = (await axios.get(url, { responseType: 'stream' })).data
      const table = await Table.load(stream)
      const iter = await table.iter({ stream: true, keyed: true })
      return new Promise((resolve, reject) => {
        let total = 0
        iter.on('data', () => {
          total = total + 1
        })
        iter.on('end', () => {
          assert.equal(total, 107826)
          resolve()
        })
        iter.on('error', (err) => {
          reject(err)
        })
      })
    })

    it('should work with readable stream factory', async function () {
      if (process.env.USER_ENV === 'browser') this.skip()
      const source = () => fs.createReadStream('data/data_big.csv')
      const table = await Table.load(source)
      const rows = await table.read()
      assert.equal(rows.length, 100)
    })

    it('should work with local path', async function () {
      if (process.env.USER_ENV === 'browser') this.skip()
      const table = await Table.load('data/data_big.csv')
      const rows = await table.read()
      assert.equal(rows.length, 100)
    })

    it('should cast source data', async () => {
      const table = await Table.load(SOURCE, { schema: SCHEMA })
      const rows = await table.read()
      assert.deepEqual(rows[0], [1, 10.0, 1, 'string1', new Date(2012, 6 - 1, 15)])
    })

    it('should not cast source data with cast false', async () => {
      const table = await Table.load(SOURCE, { schema: SCHEMA })
      const rows = await table.read({ cast: false })
      assert.deepEqual(rows[0], [1, '10.0', 1, 'string1', '2012-06-15 00:00:00'])
    })

    it('should throw on unique constraints violation', async () => {
      const source = [
        [1, '10.1', '1', 'string1', '2012-06-15'],
        [2, '10.2', '2', 'string1', '2012-07-15'],
      ]
      const table = await Table.load(source, {
        schema: SCHEMA,
        headers: false,
      })
      const error = await catchError(table.read.bind(table))
      assert.include(error.message, 'unique constraint')
    })

    it('unique constraints violation for primary key', async () => {
      const source = [
        [1, '10.1', '1', 'string1', '2012-06-15'],
        [1, '10.2', '2', 'string2', '2012-07-15'],
      ]
      const table = await Table.load(source, {
        schema: SCHEMA,
        headers: false,
      })
      const error = await catchError(table.read.bind(table))
      assert.include(error.message, 'unique constraint')
    })

    it('should read source data and limit rows', async () => {
      const table = await Table.load(SOURCE, { schema: SCHEMA })
      const rows = await table.read({ limit: 1 })
      assert.deepEqual(rows.length, 1)
    })

    it('should read source data and return keyed rows', async () => {
      const table = await Table.load(SOURCE, { schema: SCHEMA })
      const rows = await table.read({ keyed: true, limit: 1 })
      assert.deepEqual(rows[0], {
        id: 1,
        height: 10.0,
        age: 1,
        name: 'string1',
        occupation: new Date(2012, 6 - 1, 15),
      })
    })

    it('should read source data and return extended rows', async () => {
      const table = await Table.load(SOURCE, { schema: SCHEMA })
      const rows = await table.read({ extended: true, limit: 1 })
      assert.deepEqual(rows[0], [
        2,
        ['id', 'height', 'age', 'name', 'occupation'],
        [1, 10.0, 1, 'string1', new Date(2012, 6 - 1, 15)],
      ])
    })

    it('should infer headers and schema', async function () {
      if (process.env.USER_ENV === 'browser') this.skip()
      const table = await Table.load('data/data_infer.csv')
      await table.infer()
      assert.deepEqual(table.headers, ['id', 'age', 'name'])
      assert.deepEqual(table.schema.fields.length, 3)
    })

    it('should contain stream options after infer', async function () {
      if (process.env.USER_ENV === 'browser') this.skip()
      const table = await Table.load('data/data_infer.csv')
      await table.infer()
      assert.deepEqual(table.headers, ['id', 'age', 'name'])
      assert.deepEqual(table.schema.fields.length, 3)
      assert.deepEqual(table.detectedParserOptions, {
        delimiter: ',',
      })
    })

    it('should throw on read for headers/fieldNames missmatch', async () => {
      const source = [
        ['id', 'bad', 'age', 'name', 'occupation'],
        [1, '10.0', 1, 'string1', '2012-06-15 00:00:00'],
      ]
      const table = await Table.load(source, { schema: SCHEMA })
      const error = await catchError(table.read.bind(table))
      assert.include(error.message, 'header names do not match the field names')
      assert.deepEqual(error.headerNames, source[0])
      assert.deepEqual(error.fieldNames, SCHEMA.headers)
    })

    it('should support user-defined constraints (issue #103)', async function () {
      if (process.env.USER_ENV === 'browser') this.skip()
      const source = 'data/mathematics.csv'
      const schema = 'data/mathematics.json'
      const table = await Table.load(source, { schema })
      const rows = await table.read()
      assert.deepEqual(rows.length, 231)
    })

    it('should autodetect CSV separated by semicolons', async () => {
      const data = `city;location;population
London;51.50,-0.11;8.788
Paris;48.85,2.30;2.244
`
      const stream = Readable()
      const table = await Table.load(stream)
      stream._read = () => {}
      stream.push(data)
      stream.push(null)

      await table.read()
      assert.deepEqual(table.headers, ['city', 'location', 'population'])
    })

    it('should be able to handle defective rows', async function () {
      if (process.env.USER_ENV === 'browser') this.skip()
      // TODO: here we disable csvSniffer because of the following issue
      // (https://github.com/frictionlessdata/tableschema-js/issues/142)
      const table = await Table.load('data/defective_rows.csv', {
        delimiter: ',',
      })
      const rows = await table.read()
      assert.deepEqual(rows, [
        ['1101', 'John'],
        ['1102', 'Julie', '26', 'Potatoes'],
      ])
    })

    it('should be able to handle non-parsable csv files', async function () {
      if (process.env.USER_ENV === 'browser') this.skip()
      const table = await Table.load('data/schema.json')
      const error = await catchError(table.read.bind(table))
      assert.include(error.message, 'parsing error')
    })

    it('should preserve row order (#108)', async function () {
      if (process.env.USER_ENV === 'browser') this.skip()
      const table = await Table.load('data/population.csv')
      const rows = await table.read()
      assert.deepEqual(rows[15][0], '1955')
      assert.deepEqual(rows[16][0], '1956')
      assert.deepEqual(rows[17][0], '1957')
      assert.deepEqual(rows[18][0], '1958')
      assert.deepEqual(rows[19][0], '1959')
      assert.deepEqual(rows[20][0], '1960')
    })

    it('should not fail while guessing if there are defective rows (#142)', async function () {
      if (process.env.USER_ENV === 'browser') this.skip()
      const table = await Table.load('data/defective_rows.csv')
      const rows = await table.read()
      assert.deepEqual(rows, [
        ['1101', 'John'],
        ['1102', 'Julie', '26', 'Potatoes'],
      ])
    })
  })

  describe('#format', () => {
    it('should use csv format by default', async function () {
      if (process.env.USER_ENV === 'browser') this.skip()
      const table = await Table.load('data/data_infer.csv')
      const rows = await table.read({ limit: 2 })
      assert.deepEqual(rows, [
        ['1', '39', 'Paul'],
        ['2', '23', 'Jimmy'],
      ])
    })

    it('should raise on not supported formats', async function () {
      if (process.env.USER_ENV === 'browser') this.skip()
      const error = await catchError(Table.load, 'data/data_infer.csv', {
        format: 'xls',
      })
      assert.include(error.message, 'format "xls" is not supported')
    })
  })

  describe('#encoding', () => {
    it('should use utf-8 by default', async function () {
      if (process.env.USER_ENV === 'browser') this.skip()
      const table = await Table.load('data/data_infer.csv')
      const rows = await table.read({ limit: 2 })
      assert.deepEqual(rows, [
        ['1', '39', 'Paul'],
        ['2', '23', 'Jimmy'],
      ])
    })

    it('should use utf-8 by default for remote resource', async () => {
      const table = await Table.load(
        'https://raw.githubusercontent.com/frictionlessdata/tableschema-js/master/data/data_infer.csv'
      )
      const rows = await table.read({ limit: 2 })
      assert.deepEqual(rows, [
        ['1', '39', 'Paul'],
        ['2', '23', 'Jimmy'],
      ])
    })

    it('should fail to read correctly file with other encoding', async function () {
      if (process.env.USER_ENV === 'browser') this.skip()
      const table = await Table.load('data/latin1.csv')
      const rows = await table.read({ limit: 2 })
      assert.notDeepEqual(rows, [
        ['1', 'english'],
        ['2', '©'],
      ])
    })

    it('should support user-defined encoding', async function () {
      if (process.env.USER_ENV === 'browser') this.skip()
      const table = await Table.load('data/latin1.csv', { encoding: 'latin1' })
      const rows = await table.read({ limit: 2 })
      assert.deepEqual(rows, [
        ['1', 'english'],
        ['2', '©'],
      ])
    })

    it.skip('should support user-defined encoding for remote resource', async () => {
      const table = await Table.load(
        'https://raw.githubusercontent.com/frictionlessdata/tableschema-js/master/data/latin1.csv',
        { encoding: 'latin1' }
      )
      const rows = await table.read({ limit: 2 })
      assert.deepEqual(rows, [
        ['1', 'english'],
        ['2', '©'],
      ])
    })
  })

  describe('#parserOptions', () => {
    it('should use default ltrim param to parse file', async function () {
      if (process.env.USER_ENV === 'browser') this.skip()
      const table = await Table.load('data/data_parse_options_default.csv')
      const rows = await table.read({ extended: true, limit: 1 })
      assert.deepEqual(rows[0], [2, ['id', 'age', 'name'], ['1', '39', 'Paul']])
    })

    it('should use provided parserOptions such as delimiter to parse file', async function () {
      if (process.env.USER_ENV === 'browser') this.skip()
      const table = await Table.load('data/data_parse_options_delimiter.csv', {
        delimiter: ';',
      })
      const rows = await table.read({ extended: true, limit: 1 })
      assert.deepEqual(rows[0], [2, ['id', 'age', 'name'], ['1', '39', 'Paul']])
    })
  })

  describe('#primaryKey', () => {
    const SCHEMA = {
      fields: [{ name: 'id1' }, { name: 'id2' }],
      primaryKey: ['id1', 'id2'],
    }

    it('should work with composity primary key unique (issue #91)', async () => {
      const source = [
        ['id1', 'id2'],
        ['a', '1'],
        ['a', '2'],
      ]
      const table = await Table.load(source, { schema: SCHEMA })
      const rows = await table.read()
      assert.deepEqual(rows, source.slice(1))
    })

    it('should fail with composity primary key not unique (issue #91)', async () => {
      const source = [
        ['id1', 'id2'],
        ['a', '1'],
        ['a', '1'],
      ]
      const table = await Table.load(source, { schema: SCHEMA })
      const error = await catchError(table.read.bind(table))
      assert.include(error.message, 'unique constraint')
    })
  })

  describe('#foreignKeys', () => {
    const SOURCE = [
      ['id', 'name', 'surname'],
      ['1', 'Alex', 'Martin'],
      ['2', 'John', 'Dockins'],
      ['3', 'Walter', 'White'],
    ]
    const SCHEMA = {
      fields: [{ name: 'id' }, { name: 'name' }, { name: 'surname' }],
      foreignKeys: [
        {
          fields: 'name',
          reference: { resource: 'people', fields: 'firstname' },
        },
      ],
    }
    const RELATIONS = {
      people: [
        { firstname: 'Alex', surname: 'Martin' },
        { firstname: 'John', surname: 'Dockins' },
        { firstname: 'Walter', surname: 'White' },
      ],
    }

    it('should read rows if single field foreign keys is valid', async () => {
      const table = await Table.load(SOURCE, { schema: SCHEMA })
      const rows = await table.read({ relations: RELATIONS })
      assert.deepEqual(rows, [
        ['1', { firstname: 'Alex', surname: 'Martin' }, 'Martin'],
        ['2', { firstname: 'John', surname: 'Dockins' }, 'Dockins'],
        ['3', { firstname: 'Walter', surname: 'White' }, 'White'],
      ])
    })

    it('should throw on read if single field foreign keys is invalid', async () => {
      const relations = cloneDeep(RELATIONS)
      relations.people[2].firstname = 'Max'
      const table = await Table.load(SOURCE, { schema: SCHEMA })
      const error = await catchError(table.read.bind(table), { relations })
      assert.include(error.message, 'Foreign key')
    })

    it('should read rows if multi field foreign keys is valid', async () => {
      const schema = cloneDeep(SCHEMA)
      schema.foreignKeys[0].fields = ['name', 'surname']
      schema.foreignKeys[0].reference.fields = ['firstname', 'surname']
      const table = await Table.load(SOURCE, { schema })
      const keyedRows = await table.read({ keyed: true, relations: RELATIONS })
      assert.deepEqual(keyedRows, [
        {
          id: '1',
          name: { firstname: 'Alex', surname: 'Martin' },
          surname: { firstname: 'Alex', surname: 'Martin' },
        },
        {
          id: '2',
          name: { firstname: 'John', surname: 'Dockins' },
          surname: { firstname: 'John', surname: 'Dockins' },
        },
        {
          id: '3',
          name: { firstname: 'Walter', surname: 'White' },
          surname: { firstname: 'Walter', surname: 'White' },
        },
      ])
    })

    it('should throw on read if multi field foreign keys is invalid', async () => {
      const schema = cloneDeep(SCHEMA)
      schema.foreignKeys[0].fields = ['name', 'surname']
      schema.foreignKeys[0].reference.fields = ['name', 'surname']
      const relations = cloneDeep(RELATIONS)
      delete relations.people[2]
      const table = await Table.load(SOURCE, { schema })
      const error = await catchError(table.read.bind(table), { relations })
      assert.include(error.message, 'Foreign key')
    })
  })

  describe('#error-metadata', () => {
    it('should throw an error with correct row/column number', async () => {
      const source = [
        ['id', 'name'],
        ['1', 'Alex'],
        ['bad', 'bad'],
        ['3', 'John'],
      ]
      const schema = {
        fields: [
          { name: 'id', type: 'integer' },
          { name: 'name', type: 'string', constraints: { minLength: 4 } },
        ],
      }
      const table = await Table.load(source, { schema })
      const error = await catchError(table.read.bind(table))
      assert.include(error.errors[0].message, 'type "integer"')
      assert.deepEqual(error.errors[0].rowNumber, 3)
      assert.deepEqual(error.errors[0].columnNumber, 1)
      assert.include(error.errors[1].message, '"minLength" constraint')
      assert.deepEqual(error.errors[1].rowNumber, 3)
      assert.deepEqual(error.errors[1].columnNumber, 2)
    })
  })

  describe('#forceCast', () => {
    it('iter should allow forcing cast', async () => {
      const source = [['name'], [1], ['bad'], [3]]
      const schema = { fields: [{ name: 'name', type: 'integer' }] }
      const table = await Table.load(source, { schema })
      const rows = await table.read({ forceCast: true })
      assert.deepEqual(rows[0], [1])
      assert.deepEqual(rows[1].errors.length, 1)
      assert.deepEqual(rows[2], [3])
    })

    it('force cast should work with unique constraint', async () => {
      const source = [['name'], [1], [1], [3]]
      const schema = {
        fields: [{ name: 'name', type: 'integer', constraints: { unique: true } }],
      }
      const table = await Table.load(source, { schema })
      const rows = await table.read({ forceCast: true })
      assert.deepEqual(rows[0], [1])
      assert.include(rows[1].message, 'unique constraint violation')
      assert.deepEqual(rows[2], [3])
    })
  })
})
