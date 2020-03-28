// Module API

function checkMaxLength(constraint, value) {
  if (value === null) {
    return true
  }
  if (value.length <= constraint) {
    return true
  }
  return false
}

module.exports = {
  checkMaxLength,
}
