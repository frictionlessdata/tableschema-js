// Module API

export function checkMinimum(constraint, value) {
  if (value === null) {
    return true
  }
  if (value >= constraint) {
    return true
  }
  return false
}
