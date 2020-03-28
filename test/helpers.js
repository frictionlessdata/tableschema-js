// Helpers

async function catchError(func, ...args) {
  let error
  try {
    await func(...args)
  } catch (exception) {
    error = exception
  }
  return error
}

// System

module.exports = {
  catchError,
}
