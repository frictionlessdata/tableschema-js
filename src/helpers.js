require('isomorphic-fetch')
const url = require('url')
const lodash = require('lodash')
const readFile = require('fs-readfile-promise')
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
    const contents = await readFile(descriptor)
    descriptor = JSON.parse(contents)
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


// Deprecated

/**
 * Check if protocol is remote.
 */
function isURL(protocol) {
  const REMOTE_SCHEMES = ['http', 'https', 'ftp', 'ftps']
  if (!protocol) return false
  return REMOTE_SCHEMES.indexOf(protocol.replace(':', '')) !== -1
}


/**
 * Check unique constraints for every header and value independently.
 * Does not take in count the case, when headers which construct primary key
 * should be checked in combination with each other
 *
 * @param fieldName
 * @param value
 * @param headers
 * @param unique
 */
function checkUnique(fieldName, value, headers, unique) {
  const _ = lodash
  if (!_.includes(headers, fieldName)) {
    return
  }

  if (!Object.prototype.hasOwnProperty.call(unique, fieldName)) {
    unique[fieldName] = [value]
  } else {
    if (_.includes(unique[fieldName], value)) {
      throw new UniqueConstraintsError(
          `Unique constraint violation for field name '${fieldName}'`)
    }
    unique[fieldName].push(value)
  }
}


/**
 * Check uniqueness of primary key
 *
 * @param values
 * @param headers
 * @param unique
 */
function checkUniquePrimary(values, headers, unique) {
  const _ = lodash
  const key = _.keys(headers).join('')
    , indexes = _.values(headers)

  let value = ''

  if (!Object.prototype.hasOwnProperty.call(unique, key)) {
    unique[key] = []
  }

  _.forEach(indexes, index => {
    value += values[index].toString()
  })

  if (_.includes(unique[key], value)) {
    throw new UniqueConstraintsError('Unique constraint violation for primary key')
  }
  unique[key].push(value)
}


class UniqueConstraintsError extends Error {
  constructor(message) {
    super(message)
    this.message = message
    this.name = 'UniqueConstraintsError'
  }
}


module.exports = {
  retrieveDescriptor,
  expandSchemaDescriptor,
  expandFieldDescriptor,
  isRemotePath,
  isURL,
  checkUnique,
  checkUniquePrimary,
  UniqueConstraintsError,
}
