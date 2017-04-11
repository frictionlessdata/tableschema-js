import lodash from 'lodash'

// Module API

/**
 * Retrieve descriptor [WIP].
 */
export function retrieveDescriptor(descriptor) {
  descriptor = lodash.cloneDeep(descriptor)
  return descriptor
}

/**
 * Expand field descriptor with spec defaults.
 */
export function expandFieldDescriptor(descriptor) {
  if (!descriptor.type) descriptor.type = 'string'
  if (!descriptor.format) descriptor.format = 'default'
  return descriptor
}
