const { Table } = require('./table')

// Module API

/**
 * This function is async so it has to be used with `await` keyword or as a `Promise`.
 *
 * @param {string|Array[]|Stream|Function} source - data source (one of):
 *   - local CSV file (path)
 *   - remote CSV file (url)
 *   - array of arrays representing the rows
 *   - readable stream with CSV file contents
 *   - function returning readable stream with CSV file contents
 * @param {string[]} headers - array of headers
 * @param {Object} options - any `Table.load` options
 * @throws {TableSchemaError} raises any error occured in the process
 * @returns {Object} returns schema descriptor
 */
async function infer(source, options = {}) {
  const table = await Table.load(source, options)
  const descriptor = await table.infer({ limit: options.limit })
  return descriptor
}

// System

module.exports = {
  infer,
}
