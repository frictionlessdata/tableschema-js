import jts from '../src/index'
import jsonSchema from '../data/schema.json'

new jts.Resource(jsonSchema, 'http://url.to.csv').then(resource => {
  const values = []
  resource.iter(iterator, true, false).then(() => {
    // do something with values
  }, errors => {
    // something wrong with data. Some fields not suitable with the data in
    // the source
    console.log(errors)
  })

  // callback function which called while data is proceed
  function iterator(items) {
    values.push(items)
  }
}).catch(error => {
  console.log(error)
})
