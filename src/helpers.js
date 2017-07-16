require('isomorphic-fetch')
const lodash = require('lodash')
const config = require('./config')


// Retrieve descriptor

async function retrieveDescriptor(descriptor) {

  // Inline
  if (lodash.isPlainObject(descriptor)) {
    descriptor = lodash.clone(descriptor)

  // Remote
  } else if (isRemotePath(descriptor)) {
    const res = await fetch(descriptor)
    if (res.status >= 400) throw new Error(`Can't load descriptor at "${descriptor}"`)
    descriptor = await res.json()

  // Local
  } else {
    if (config.IS_BROWSER) throw new Error('Local paths are not supported in browser')
    try {
      /* eslint-disable */
      const readFile = require('fs-readfile-promise')
      /* eslint-enable */
      const contents = await readFile(descriptor)
      descriptor = JSON.parse(contents)
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
