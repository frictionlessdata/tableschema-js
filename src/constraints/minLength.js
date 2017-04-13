// Module API

export function checkMinLength(constraint, value) {
  if (value === null) {
    return true
  }
  if (value.length >= constraint) {
    return true
  }
  return false
}
