import jts from '../src/index'
import jsonSchema from 'schema.json'

jts.validate(jsonSchema).then(valid => {
  // schema is valid
}).catch(errors => {
  // schema is not valid
  console.log(errors)
})
