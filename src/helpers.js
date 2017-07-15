require('isomorphic-fetch')
const url = require('url')
const lodash = require('lodash')
const config = require('./config')


// Module API

/**
 * Retrieve descriptor.
 */
async function retrieveDescriptor(descriptor) {
  if (!lodash.isString(descriptor)) {
    return lodash.cloneDeep(descriptor)
  }
  if (!isURL(url.parse(descriptor).protocol)) {
    throw [new Error('Descriptor can only be an object or a URL')]
  }
  const response = await fetch(descriptor)
  if (response.status >= 400) {
    throw [new Error('Failed to download file due to bad response')]
  }
  descriptor = await response.json()
  return descriptor
}


/**
 * Expand schema descriptor with spec defaults.
 */
function expandSchemaDescriptor(descriptor) {
  for (const field of (descriptor.fields || [])) {
    expandFieldDescriptor(field)
  }
  if (!descriptor.missingValues) descriptor.missingValues = config.DEFAULT_MISSING_VALUES
  return descriptor
}


/**
 * Expand field descriptor with spec defaults.
 */
function expandFieldDescriptor(descriptor) {
  if (descriptor instanceof Object) {
    if (!descriptor.type) descriptor.type = config.DEFAULT_FIELD_TYPE
    if (!descriptor.format) descriptor.format = config.DEFAULT_FIELD_FORMAT
  }
  return descriptor
}


/**
 * Check if protocol is remote.
 */
function isURL(protocol) {
  const REMOTE_SCHEMES = ['http', 'https', 'ftp', 'ftps']
  if (!protocol) return false
  return REMOTE_SCHEMES.indexOf(protocol.replace(':', '')) !== -1
}


// Deprecated

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
  isURL,
  checkUnique,
  checkUniquePrimary,
  UniqueConstraintsError,
}
