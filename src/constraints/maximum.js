// Module API

export function checkMaximum(constraint, value) {
  if (value === null) {
    return true
  }
  if (value <= constraint) {
    return true
  }
  return false
}
