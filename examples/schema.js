import jts from '../src/index'
import jsonSchema from '../data/schema.json'

(new jts.Schema(jsonSchema)).then(schema => {
  // working with schema instance
  if (schema.hasField('capital')) {
    const newValue = 'http://new.url.com'
    // check if new value suitable for the field
    if (schema.testValue('url', newValue)) {
      const castedValue = schema.castValue('capital', newValue)
      // do something with casted value ...
    }
  }
}, error => {
  // something went wrong
  console.log(error)
})
