const {Schema} = require('./schema')


// Module API

/**
 * https://github.com/frictionlessdata/tableschema-js#validate
 */
async function validate(descriptor) {
  const {valid, errors} = await Schema.load(descriptor)
  return {valid, errors}
}


// System

module.exports = {
  validate,
}
