// Module API

function checkPattern(constraint, value) {
  if (value === null) {
    return true
  }
  const regex = new RegExp(constraint)
  const match = regex.exec(value)
  if (match) {
    return true
  }
  return false
}

module.exports = {
  checkPattern,
}
