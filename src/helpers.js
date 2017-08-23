const fs = require('fs')
const axios = require('axios')
const cloneDeep = require('lodash/cloneDeep')
const isPlainObject = require('lodash/isPlainObject')
const {TableSchemaError} = require('./errors')
const config = require('./config')


// Retrieve descriptor

async function retrieveDescriptor(descriptor) {

  // Inline
  if (isPlainObject(descriptor)) {
    descriptor = cloneDeep(descriptor)

  // Remote
  } else if (isRemotePath(descriptor)) {
    const res = await axios.get(descriptor)
    descriptor = res.data

    // Loading error
    if (res.status >= 400) {
      throw new TableSchemaError(`Can't load descriptor at "${descriptor}"`)
    }

  // Local
  } else {

    // Browser error
    if (config.IS_BROWSER) {
      throw new TableSchemaError('Local paths are not supported in browser')
    }

    // Load/parse data
    try {
      descriptor = await new Promise((resolve, reject) => {
        fs.readFile(descriptor, 'utf-8', (error, data) => {
          if (error) reject(error)
          try {resolve(JSON.parse(data))} catch (error) {reject(error)}
        })
      })

    // Load/parse erorr
    } catch (error) {
      throw new TableSchemaError(`Can't load descriptor at "${descriptor}"`)
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


// System

module.exports = {
  retrieveDescriptor,
  expandSchemaDescriptor,
  expandFieldDescriptor,
  isRemotePath,
}
