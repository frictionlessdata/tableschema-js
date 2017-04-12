// Module API

export function checkMaxLength(constraint, value) {
  if (value === null) {
    return true
  }
  if (value.length <= constraint) {
    return true
  }
  return false
}
