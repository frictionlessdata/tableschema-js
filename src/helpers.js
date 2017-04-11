import url from 'url'
import 'isomorphic-fetch'
import lodash from 'lodash'
import utilities from './utilities'
import config from './config'


// Module API

/**
 * Retrieve descriptor.
 */
export async function retrieveDescriptor(descriptor) {
  if (!lodash.isString(descriptor)) {
    return lodash.cloneDeep(descriptor)
  }
  if (!utilities.isURL(url.parse(descriptor).protocol)) {
    throw [new Error('Descriptor could be only object or url')]
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
export function expandSchemaDescriptor(descriptor) {
  for (const field of (descriptor.fields || [])) {
    expandFieldDescriptor(field)
  }
  if (!descriptor.missingValues) descriptor.missingValues = config.defaultMissingValues
  return descriptor
}


/**
 * Expand field descriptor with spec defaults.
 */
export function expandFieldDescriptor(descriptor) {
  if (descriptor instanceof Object) {
    if (!descriptor.type) descriptor.type = config.defaultFieldType
    if (!descriptor.format) descriptor.format = config.defaultFieldFormat
  }
  return descriptor
}
