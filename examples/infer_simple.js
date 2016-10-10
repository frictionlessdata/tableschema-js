import fs from 'fs'
import parse from 'csv-parse'
import jts from '../src/index'

// read CSV file
fs.readFile('../data/data_infer.csv', (err, data) => {

  // parse CSV
  parse(data, (error, values) => {
    const headers = values.shift()
      , schema = jts.infer(headers, values)

    // save JSON into file
    fs.writeFile('schema.json', schema, (e) => {
      if (e) {
        console.log(e)
      }
      // do something after saving
    })
  })
})
