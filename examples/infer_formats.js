import fs from 'fs'
import parse from 'csv-parse'
import jts from '../src/index'

// read CSV file
fs.readFile('../data/data_infer_formats.csv', (err, data) => {
  parse(data, (error, values) => {
    const headers = values.shift()
      , schema = jts.infer(headers, values, {
      // set primary key
      primaryKey: 'id'
      // explicitly set format of the data, cast will fail, if field does not
      // match mentioned format
      , cast: {
        number: { format: 'currency' }
        , string: { format: 'uri' }
      }
    })

    // save JSON into file
    fs.writeFile('schema.json', schema, (e) => {
      if (e) {
        console.log(e)
      }
      // do something after saving
    })
  })
})
