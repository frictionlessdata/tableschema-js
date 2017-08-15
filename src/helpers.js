const fs = require('fs')
const axios = require('axios')
const lodash = require('lodash')
const config = require('./config')


// Retrieve descriptor

async function retrieveDescriptor(descriptor) {

  // Inline
  if (lodash.isPlainObject(descriptor)) {
    descriptor = lodash.clone(descriptor)

  // Remote
  } else if (isRemotePath(descriptor)) {
    const res = await axios.get(descriptor)
    if (res.status >= 400) throw new Error(`Can't load descriptor at "${descriptor}"`)
    descriptor = res.data

  // Local
  } else {
    if (config.IS_BROWSER) throw new Error('Local paths are not supported in browser')
    try {
      descriptor = await new Promise((resolve, reject) => {
        fs.readFile(descriptor, 'utf-8', (error, data) => {
          if (error) reject(error)
          try {resolve(JSON.parse(data))} catch (error) {reject(error)}
        })
      })
    } catch (error) {
      throw new Error(`Can't load descriptor at "${descriptor}"`)
    }
  }

  return descriptor
}


// Expand descriptor

function expandSchemaDescriptor(descriptor) {
  for (const field of (descriptor.fields || [])) {
    expandFieldDescriptor(field)
  }
  if (!descriptor.missingValues) descriptor.missingValues = config.DEFAULT_MISSING_VALUES
  return descriptor
}


function expandFieldDescriptor(descriptor) {
  if (descriptor instanceof Object) {
    if (!descriptor.type) descriptor.type = config.DEFAULT_FIELD_TYPE
    if (!descriptor.format) descriptor.format = config.DEFAULT_FIELD_FORMAT
  }
  return descriptor
}


// Miscellaneous

function isRemotePath(path) {
  // TODO: improve implementation
  return path.startsWith('http')
}


module.exports = {
  retrieveDescriptor,
  expandSchemaDescriptor,
  expandFieldDescriptor,
  isRemotePath,
}
