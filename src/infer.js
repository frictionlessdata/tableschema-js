const {Table} = require('./table')


// Module API

/**
 * https://github.com/frictionlessdata/tableschema-js#infer
 */
async function infer(source, options={}) {
  const table = await Table.load(source, options)
  const descriptor = await table.infer({limit: options.limit})
  return descriptor
}


// System

module.exports = {
  infer,
}
