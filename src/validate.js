const helpers = require('./helpers')
const {Profile} = require('./profile')


// Module API

/**
 * https://github.com/frictionlessdata/tableschema-js#validate
 */
async function validate(descriptor) {

  // Process descriptor
  descriptor = await helpers.retrieveDescriptor(descriptor)
  descriptor = helpers.expandSchemaDescriptor(descriptor)

  // Get descriptor profile
  const profile = await Profile.load('table-schema')

  // Validate descriptor
  return profile.validate(descriptor)

}


// System

module.exports = {
  validate,
}
