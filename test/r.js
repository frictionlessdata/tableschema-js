'use strict'
var Resource = require('../lib/resource').default
var SCHEMA = {
  fields: [
    {
      name: 'id'
      , type: 'integer'
      , constraints: { required: true }
    }
    , {
      name: 'height'
      , type: 'number'
      , constraints: { required: false }
    }
    , {
      name: 'age'
      , type: 'integer'
      , constraints: { required: false }
    }
    , {
      name: 'name'
      , type: 'string'
      , constraints: { required: true }
    }
    , {
      name: 'occupation'
      , type: 'datetime'
      , constraints: { required: false }
    }
  ]
}

new Resource(SCHEMA, 'http://localhost:63342/jsontableschema-js/data/data_big.csv').then(resource => {
  try {
    resource.iter(items => {
      console.log(items)
    }, true)
  } catch (e) {
    console.log(e)
  }
}, error => {
  console.log(error)
})
