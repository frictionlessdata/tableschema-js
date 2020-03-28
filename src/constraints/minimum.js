// Module API

function checkMinimum(constraint, value) {
  if (value === null) {
    return true
  }
  if (value >= constraint) {
    return true
  }
  return false
}

module.exports = {
  checkMinimum,
}
