const { Schema } = require('./schema')

// Module API

/**
 * This function is async so it has to be used with `await` keyword or as a `Promise`.
 *
 * @param {(string|Object)} descriptor - schema descriptor (one of):
 *   - local path
 *   - remote url
 *   - object
 * @returns {Object} returns `{valid, errors}` object
 */
async function validate(descriptor) {
  const { valid, errors } = await Schema.load(descriptor)
  return { valid, errors }
}

// System

module.exports = {
  validate,
}
